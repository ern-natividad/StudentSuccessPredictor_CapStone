import { useState, useCallback } from "react";
import { AuthContext } from "./AuthContextBase";
import {
  validateCredentials,
  generateNameFromEmail,
  storeUserSession,
  getUserSession,
  clearUserSession,
  getRole,
} from "../utils/authUtils";

export const AuthProvider = ({ children }) => {
  const session = getUserSession();
  const [user, setUser] = useState({
    name: session.userName,
    role: session.userRole,
    email: "",
    isAuthenticated: Boolean(session.userName),
  });

  const [error, setError] = useState("");

  const login = useCallback((email, password, selectedRole = "student") => {
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return false;
    }

    if (!validateCredentials(email, password)) {
      setError("Invalid email or password.");
      return false;
    }

    const role = getRole(email);

    if (role !== selectedRole) {
      setError(`This account is not registered as ${selectedRole}.`);
      return false;
    }

    const name = generateNameFromEmail(email);

    storeUserSession(name, role);
    setUser({
      name,
      role,
      email: email.toLowerCase(),
      isAuthenticated: true,
    });

    return true;
  }, []);

  const signup = useCallback(
    (formData, selectedRole = "student") => {
      setError("");

      const {
        firstName,
        lastName,
        email,
        studentId,
        employeeId,
        year,
        department,
        accessCode,
        password,
        confirmPassword,
        termsAccepted,
      } = formData;
      const roleId = selectedRole || "student";
      const roleSpecificId = roleId === "student" ? studentId : employeeId;
      const roleSpecificGroup = roleId === "student" ? year : department;

      if (
        !firstName ||
        !lastName ||
        !email ||
        !roleSpecificId ||
        !roleSpecificGroup ||
        !password ||
        !confirmPassword
      ) {
        setError("Please complete all fields.");
        return false;
      }

      if (roleId !== "student" && !accessCode) {
        setError("Please enter the role access code.");
        return false;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }

      if (!termsAccepted) {
        setError("Please accept the Terms of Service.");
        return false;
      }

      const name = `${firstName} ${lastName}`;

      storeUserSession(name, roleId);
      setUser({
        name,
        role: roleId,
        email: email.toLowerCase(),
        isAuthenticated: true,
      });

      return true;
    },
    [],
  );

  const logout = useCallback(() => {
    clearUserSession();
    setUser({
      name: "",
      role: "student",
      email: "",
      isAuthenticated: false,
    });
  }, []);

  const value = {
    user,
    login,
    signup,
    logout,
    error,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
