import React, { createContext, useState, useCallback } from "react";
import {
  validateCredentials,
  generateNameFromEmail,
  storeUserSession,
  getUserSession,
  clearUserSession,
  getRole,
} from "../utils/authUtils";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const session = getUserSession();
  const [user, setUser] = useState({
    name: session.userName,
    role: session.userRole,
    email: "",
    isAuthenticated: !!session.userName,
  });

  const [error, setError] = useState("");

  const login = useCallback((email, password) => {
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
    (
      firstName,
      lastName,
      email,
      studentId,
      year,
      password,
      confirmPassword,
      termsAccepted,
    ) => {
      setError("");

      if (
        !firstName ||
        !lastName ||
        !email ||
        !studentId ||
        !year ||
        !password ||
        !confirmPassword
      ) {
        setError("Please complete all fields.");
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
      const role = getRole(email);

      storeUserSession(name, role);
      setUser({
        name,
        role,
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
