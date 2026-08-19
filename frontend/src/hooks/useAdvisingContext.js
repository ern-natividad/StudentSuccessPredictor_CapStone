import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth";
import { useDashboard } from "./useDashboard";
import { api, isBackendAuthEnabled, isEmptyDataError } from "../services/api";
import {
  buildAdvisingSnapshot,
  buildWelcomeMessage,
} from "../utils/advisingSnapshot";

const findLoggedInStaff = (staffMembers, user) =>
  staffMembers.find(
    (staff) =>
      staff.id === user?.id ||
      staff.email?.toLowerCase() === (user?.email || "").toLowerCase(),
  ) || null;

export const useAdvisingContext = () => {
  const { user } = useAuth();
  const { students, staffMembers, getStudentsForStaff } = useDashboard();
  const [selectedStudentUserId, setSelectedStudentUserId] = useState("");
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = user?.role || "student";

  const accessibleStudents = useMemo(() => {
    if (role === "admin") return students;
    if (role === "staff") {
      const loggedInStaff = findLoggedInStaff(staffMembers, user);
      return loggedInStaff ? getStudentsForStaff(loggedInStaff.id) : [];
    }
    return [];
  }, [role, students, staffMembers, user, getStudentsForStaff]);

  const selfStudent = useMemo(() => {
    if (role !== "student" || !user?.id) return null;

    return (
      students.find((student) => student.user_id === user.id) || {
        user_id: user.id,
        student_id: user.id,
        full_name: user.name,
        yearLevel: "N/A",
        section: "N/A",
        department: "N/A",
        risk_level: "Not assessed",
      }
    );
  }, [role, students, user]);

  const activeStudent = useMemo(() => {
    if (role === "student") return selfStudent;

    return (
      accessibleStudents.find(
        (student) => student.user_id === selectedStudentUserId,
      ) ||
      accessibleStudents[0] ||
      null
    );
  }, [role, selfStudent, accessibleStudents, selectedStudentUserId]);

  useEffect(() => {
    if (role !== "student" && accessibleStudents.length > 0 && !selectedStudentUserId) {
      setSelectedStudentUserId(accessibleStudents[0].user_id);
    }
  }, [role, accessibleStudents, selectedStudentUserId]);

  const loadSnapshot = useCallback(async () => {
    if (!isBackendAuthEnabled() || !user?.isAuthenticated) {
      setError("Sign in with backend authentication to use AI advising.");
      setSnapshot(null);
      setLoading(false);
      return;
    }

    if (!user?.id) {
      return;
    }

    if (role !== "student" && !activeStudent?.user_id) {
      setError("No student records are available for advising.");
      setSnapshot(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const targetUserId = role === "student" ? user.id : activeStudent.user_id;

      const [predictionResult, gradesResult] = await Promise.all([
        role === "student"
          ? api.getMyPrediction()
          : api.getStudentPrediction(targetUserId),
        role === "student"
          ? api.getMyGrades()
          : api.getStudentGrades(targetUserId),
      ]);

      const nextSnapshot = buildAdvisingSnapshot({
        role,
        viewerName: user.name,
        student: activeStudent,
        prediction: predictionResult?.prediction || null,
        grades: gradesResult?.grades || [],
      });

      setSnapshot(nextSnapshot);
    } catch (requestError) {
      if (isEmptyDataError(requestError)) {
        setSnapshot(
          buildAdvisingSnapshot({
            role,
            viewerName: user.name,
            student: activeStudent,
            prediction: null,
            grades: [],
          }),
        );
        setError("");
      } else {
        setError(requestError.message || "Unable to load advising data.");
        setSnapshot(null);
      }
    } finally {
      setLoading(false);
    }
  }, [role, user, activeStudent]);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const welcomeMessage = useMemo(
    () => buildWelcomeMessage(snapshot, role),
    [snapshot, role],
  );

  return {
    role,
    snapshot,
    loading,
    error,
    welcomeMessage,
    accessibleStudents,
    selectedStudentUserId,
    setSelectedStudentUserId,
    reloadSnapshot: loadSnapshot,
  };
};
