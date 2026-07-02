import { createContext, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { STUDENTS, ALERTS_DATA } from "../utils/constants";

export const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = user.role === "student" ? "prediction" : "dashboard";
  const currentPage = searchParams.get("tab") || defaultTab;

  const [students] = useState(STUDENTS);
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

  const value = {
    currentPage,
    showPage,
    students,
    alerts,
    notificationsPanelOpen,
    toggleNotificationsPanel,
    closeNotificationsPanel,
    studentFilter,
    updateStudentFilter,
    riskFilter,
    updateRiskFilter,
    getFilteredStudents,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
