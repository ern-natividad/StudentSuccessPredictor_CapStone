import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { useDashboard } from "./useDashboard";

/**
 * Returns students visible to the current user:
 * - admin: all students
 * - staff: only students assigned to their sections
 */
export const useRoleScopedStudents = () => {
  const { user } = useAuth();
  const { students, staffMembers, getStudentsForStaff } = useDashboard();

  const isAdmin = user?.role === "admin";

  const loggedInStaff = useMemo(() => {
    if (!user || user.role !== "staff") return null;

    return (
      staffMembers.find(
        (staff) =>
          staff.id === user.id ||
          staff.email?.toLowerCase() === (user.email || "").toLowerCase(),
      ) || null
    );
  }, [staffMembers, user]);

  const visibleStudents = useMemo(() => {
    if (isAdmin) return Array.isArray(students) ? students : [];
    if (!loggedInStaff) return [];
    return getStudentsForStaff(loggedInStaff.id);
  }, [getStudentsForStaff, isAdmin, loggedInStaff, students]);

  const visibleStudentIds = useMemo(
    () =>
      new Set(
        visibleStudents
          .map((student) => String(student.student_id || "").trim().toLowerCase())
          .filter(Boolean),
      ),
    [visibleStudents],
  );

  const visibleUserIds = useMemo(
    () =>
      new Set(
        visibleStudents
          .map((student) => String(student.user_id || "").trim().toLowerCase())
          .filter(Boolean),
      ),
    [visibleStudents],
  );

  return {
    isAdmin,
    loggedInStaff,
    visibleStudents,
    visibleStudentIds,
    visibleUserIds,
  };
};
