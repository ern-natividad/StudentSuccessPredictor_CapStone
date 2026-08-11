import { createContext, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getUserDirectory } from "../services/userDirectory";

export const DashboardContext = createContext();

const normalizeRiskLevel = (riskLevel) => {
  const normalized = String(riskLevel || "").trim().toLowerCase();
  const riskLevels = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };

  return riskLevels[normalized] || "Low";
};

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = user?.role === "student" ? "prediction" : "dashboard";
  const currentPage = searchParams.get("tab") || defaultTab;

  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState("");

  useEffect(() => {
    const canLoadRoleAccounts = user?.isAuthenticated;

    if (!canLoadRoleAccounts) {
      setStudents([]);
      setStaffMembers([]);
      setAlerts([]);
      return undefined;
    }

    let isMounted = true;

    const loadRoleAccounts = async () => {
      try {
        setDirectoryLoading(true);
        setDirectoryError("");
        const accounts = await getUserDirectory();

        const normalizedStudents = accounts
          .filter((account) => String(account.role).toLowerCase() === "student")
          .map((account, index) => {
            // Supabase returns a one-to-many relation as an array. There is one
            // student_info row per student account, so use its first record.
            const studentInfo = Array.isArray(account.student_info)
              ? account.student_info[0]
              : account.student_info;

            return {
              // Keep the users-table UUID for API calls that require user_id,
              // but display the official ID stored in student_info.student_id.
              user_id: account.id,
              student_id: studentInfo?.student_id || account.id || `student-${index + 1}`,
              full_name:
                account.full_name ||
                account.email?.split("@")[0] ||
                `Student ${index + 1}`,
              year_level:
                studentInfo?.year_level ?? account.year_level ?? account.year ?? "N/A",
              yearLevel:
                studentInfo?.year_level ?? account.year_level ?? account.year ?? "N/A",
              current_gpa: Number(account.current_gpa ?? 0),
              predicted_gpa: Number(account.predicted_gpa ?? 0),
              confidence_score: Number(account.confidence_score ?? 0),
              risk_level: normalizeRiskLevel(
                studentInfo?.risk_level || account.risk_level,
              ),
              assignedSectionId: account.assignedSectionId || studentInfo?.section || null,
              assignedStaffId: account.assignedStaffId || null,
              department: studentInfo?.department || null,
              email: account.email || "",
              account_locked: Boolean(account.account_locked),
              created_at: account.created_at,
            };
          });

        const normalizedStaffMembers = accounts
          .filter((account) => String(account.role).toLowerCase() === "staff")
          .map((account, index) => ({
            id: account.id || `staff-${index + 1}`,
            full_name:
              account.full_name ||
              account.email?.split("@")[0] ||
              `Staff ${index + 1}`,
            email: account.email || "",
            role: "staff",
            title: account.title || "Academic Adviser",
            assignedSection: account.adviser_info?.assigned_section || null,
            assignedYearLevel: account.adviser_info?.year_level || "N/A",
            account_locked: Boolean(account.account_locked),
            created_at: account.created_at,
          }));

        if (!isMounted) {
          return;
        }

        setStudents(normalizedStudents);
        setStaffMembers(normalizedStaffMembers);
        setAlerts(
          accounts
            .filter((account) => account.account_locked)
            .map((account) => ({
              id: account.id,
              sev: "high",
              name: account.full_name || account.email || "User account",
              desc: "This user account is currently locked.",
              time: account.updated_at
                ? new Date(account.updated_at).toLocaleString()
                : "Recently updated",
            })),
        );
      } catch (error) {
        console.error("Failed to load role-based dashboard accounts:", error);
        if (isMounted) {
          setStudents([]);
          setStaffMembers([]);
          setAlerts([]);
          setDirectoryError("Unable to load the user directory from Supabase.");
        }
      } finally {
        if (isMounted) setDirectoryLoading(false);
      }
    };

    loadRoleAccounts();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.role, user?.isAuthenticated]);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [studentFilter, setStudentFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");

  const showPage = useCallback(
    (pageId) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", pageId);
        return next;
      });
    },
    [setSearchParams],
  );

  const toggleNotificationsPanel = useCallback(() => {
    setNotificationsPanelOpen((prev) => !prev);
  }, []);

  const closeNotificationsPanel = useCallback(() => {
    setNotificationsPanelOpen(false);
  }, []);

  const updateStudentFilter = useCallback((filter) => {
    setStudentFilter(filter);
  }, []);

  const updateRiskFilter = useCallback((filter) => {
    setRiskFilter(filter);
  }, []);

  const getFilteredStudents = useCallback(() => {
    let filtered = students;

    if (riskFilter) {
      filtered = filtered.filter((s) => s.risk_level === riskFilter);
    }

    if (studentFilter) {
      const q = studentFilter.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          String(s.student_id || "").toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [students, studentFilter, riskFilter]);

  const getSectionById = useCallback(
    (sectionId) => sections.find((section) => section.id === sectionId) || null,
    [sections],
  );

  const getStaffById = useCallback(
    (staffId) => staffMembers.find((staff) => staff.id === staffId) || null,
    [staffMembers],
  );

  const getStudentsForStaff = useCallback(
    (staffId) =>
      students.filter((student) => student.assignedStaffId === staffId),
    [students],
  );

  const updateStudentGradeRecord = useCallback(
    (studentId, gradeRecords) => {
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.student_id === studentId
            ? { ...student, grade_records: gradeRecords }
            : student,
        ),
      );
    },
    [setStudents],
  );


  const updateStudentSectionAssignment = useCallback(
    (studentId, sectionId) => {
      setStudents((prevStudents) =>
        prevStudents.map((student) => {
          if (student.student_id !== studentId) return student;

          const section = sections.find(
            (sectionItem) => sectionItem.id === sectionId,
          );
          return {
            ...student,
            assignedSectionId: sectionId,
            assignedStaffId: section?.adviserId || student.assignedStaffId,
          };
        }),
      );
    },
    [setStudents, sections],
  );

  const updateSectionAdviser = useCallback(
    (sectionId, staffId) => {
      setSections((prevSections) =>
        prevSections.map((section) => {
          if (section.id === sectionId) {
            return { ...section, adviserId: staffId };
          }
          if (section.adviserId === staffId) {
            return { ...section, adviserId: "" };
          }
          return section;
        }),
      );
    },
    [setSections],
  );

  const updateStaffRole = useCallback(
    (staffId, newRole) => {
      setStaffMembers((prevStaff) =>
        prevStaff.map((staff) =>
          staff.id === staffId
            ? {
                ...staff,
                title:
                  newRole === "Adviser"
                    ? "Academic Adviser"
                    : "Subject Teacher",
              }
            : staff,
        ),
      );
    },
    [setStaffMembers],
  );

  const addStaffMember = useCallback(
    (name, role, sectionId) => {
      const newStaffId = `staff-${Date.now()}`;
      const newStaff = {
        id: newStaffId,
        full_name: name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@wmsu.edu.ph`,
        role: "staff",
        title: role === "Adviser" ? "Academic Adviser" : "Subject Teacher",
      };

      setStaffMembers((prevStaff) => [...prevStaff, newStaff]);

      if (sectionId && role === "Adviser") {
        setSections((prevSections) =>
          prevSections.map((section) =>
            section.id === sectionId
              ? { ...section, adviserId: newStaffId }
              : section,
          ),
        );
      }
    },
    [setStaffMembers, setSections],
  );

  const value = {
    currentPage,
    showPage,
    students,
    sections,
    staffMembers,
    alerts,
    directoryLoading,
    directoryError,
    notificationsPanelOpen,
    toggleNotificationsPanel,
    closeNotificationsPanel,
    studentFilter,
    updateStudentFilter,
    riskFilter,
    updateRiskFilter,
    getFilteredStudents,
    getSectionById,
    getStaffById,
    getStudentsForStaff,
    updateStudentGradeRecord,
    updateStudentSectionAssignment,
    updateSectionAdviser,
    updateStaffRole,
    addStaffMember,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
