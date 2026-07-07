import { useState, useCallback, useEffect } from "react";
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
      
      console.log("Backend API login raw response:", result);

      const dataPayload = result?.data || result;
      const requiresMfa = dataPayload?.requiresMfa || result?.requiresMfa;

      if (requiresMfa) {
        // Look up user ID across every potential naming convention
        const actualUserId = 
          dataPayload?.userId || 
          dataPayload?.user_id || 
          dataPayload?.id || 
          dataPayload?.user?.id ||
          result?.userId ||
          result?.id;

        console.log("Extracted MFA User ID Reference:", actualUserId);

        // Populate all property permutations to satisfy validation inside your form manager files
        setPendingMfa({ 
          userId: actualUserId,
          user_id: actualUserId,
          id: actualUserId,
          _id: actualUserId,
          ...dataPayload
        });
        
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

  const completeMfaLogin = useCallback(async (userId, code) => {
    try {
      const result = await api.verifyMfaLogin(userId, code);
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

  const updateUserFields = useCallback((fields) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        ...fields,
      };
    });
  }, []);

  const value = {
    user,
    setUser,
    login,
    signup,
    logout,
    error,
    setError,
    pendingMfa,
    completeMfaLogin,
    cancelMfa,
    expireSessionDueToInactivity,
    updateUserFields,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};