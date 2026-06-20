import React, { createContext, useState, useCallback } from "react";
import { STUDENTS, ALERTS_DATA } from "../utils/constants";

export const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [students, setStudents] = useState(STUDENTS);
  const [alerts, setAlerts] = useState(ALERTS_DATA);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [studentFilter, setStudentFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");

  const showPage = useCallback((pageId) => {
    setCurrentPage(pageId);
  }, []);

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
      filtered = filtered.filter((s) => s.risk === riskFilter);
    }

    if (studentFilter) {
      const q = studentFilter.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q),
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
