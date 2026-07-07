import { createContext, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  STUDENTS,
  ALERTS_DATA,
  SECTIONS,
  STAFF_MEMBERS,
} from "../utils/constants";

export const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = user.role === "student" ? "prediction" : "dashboard";
  const currentPage = searchParams.get("tab") || defaultTab;

  const [students, setStudents] = useState(STUDENTS);
  const [sections, setSections] = useState(SECTIONS);
  const [staffMembers, setStaffMembers] = useState(STAFF_MEMBERS);
  const [alerts] = useState(ALERTS_DATA);
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
          s.student_id.toLowerCase().includes(q),
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
