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
import { normalizeUserPayload } from "../utils/dataNormalization";
import { api, isBackendAuthEnabled } from "../services/api";

export const AuthProvider = ({ children }) => {
  const session = getUserSession();
  const [user, setUser] = useState({
    name: session.userName,
    role: session.userRole,
    email: "",
    isAuthenticated: Boolean(session.userName),
    twoFactorEnabled: false,
  });

  const [error, setError] = useState("");
  const [pendingMfa, setPendingMfa] = useState(null);

  const applyBackendSession = ({ token, user: backendUser }) => {
    sessionStorage.setItem("authToken", token);
    storeUserSession(backendUser.fullName || backendUser.email, backendUser.role);
    setUser({
      name: backendUser.fullName || backendUser.email,
      role: backendUser.role,
      email: backendUser.email,
      isAuthenticated: true,
      twoFactorEnabled: backendUser.twoFactorEnabled,
    });
  };

  const loginLocal = (email, password, selectedRole) => {
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
      twoFactorEnabled: false,
    });
    return true;
  };

  const loginBackend = async (email, password) => {
    try {
      const result = await api.login(email, password);

      if (result.requiresMfa) {
        // FIXED: Capture pendingToken instead of looking for non-existent userId
        setPendingMfa({ pendingToken: result.pendingToken });
        return "mfa-required";
      }

      applyBackendSession(result);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const login = useCallback(async (email, password, selectedRole = "student") => {
    setError("");
    if (isBackendAuthEnabled()) {
      return loginBackend(email, password);
    }
    return loginLocal(email, password, selectedRole);
  }, []);

  // FIXED: Changed parameter from userId to pendingToken
  const completeMfaLogin = useCallback(async (pendingToken, code) => {
    try {
      // FIXED: Forward pendingToken directly to the api client wrapper
      const result = await api.verifyMfaLogin(pendingToken, code);
      applyBackendSession(result);
      setPendingMfa(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const cancelMfa = useCallback(() => setPendingMfa(null), []);

  const signup = useCallback(async (formData, selectedRole = "student") => {
    setError("");
    const {
      firstName,
      lastName,
      email,
      studentId,
      year,
      password,
      confirmPassword,
      termsAccepted,
    } = formData;
    
    const roleId = selectedRole || "student";

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please complete all fields.");
      return false;
    }

    if (roleId === "student") {
      if (!studentId || !year) {
        setError("Please complete all fields.");
        return false;
      }
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    if (!termsAccepted) {
      setError("Please accept the Terms of Service.");
      return false;
    }

    const normalizedUser = normalizeUserPayload(formData, roleId);
    console.log("Normalized user payload:", normalizedUser);

    if (isBackendAuthEnabled()) {
      try {
        const result = await api.signup(normalizedUser);
        if (result && result.token) {
          applyBackendSession(result);
          return true;
        }
      } catch (err) {
        setError(err.message || "Registration failed. Please try again.");
        return false;
      }
    }

    const name = `${firstName} ${lastName}`;
    storeUserSession(name, roleId);
    setUser({
      name,
      role: roleId,
      email: email.toLowerCase(),
      isAuthenticated: true,
      twoFactorEnabled: false,
    });
    return true;
  }, []);

  const logout = useCallback(async () => {
    if (isBackendAuthEnabled() && sessionStorage.getItem("authToken")) {
      try {
        await api.logout();
      } catch {
        // Never block client logout
      }
    }
    sessionStorage.removeItem("authToken");
    clearUserSession();
    setUser({ name: "", role: "student", email: "", isAuthenticated: false, twoFactorEnabled: false });
  }, []);

  const expireSessionDueToInactivity = useCallback(async () => {
    if (isBackendAuthEnabled() && sessionStorage.getItem("authToken")) {
      try {
        await api.reportSessionTimeout();
      } catch {
        // Fallback
      }
    }
    sessionStorage.removeItem("authToken");
    clearUserSession();
    setUser({ name: "", role: "student", email: "", isAuthenticated: false, twoFactorEnabled: false });
  }, []);

  const value = {
    user,
    login,
    signup,
    logout,
    error,
    setError,
    pendingMfa,
    completeMfaLogin,
    cancelMfa,
    expireSessionDueToInactivity,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};