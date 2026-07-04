import { useState, useCallback, useEffect } from "react";
import { AuthContext } from "./AuthContextBase";
import { supabase } from "../lib/supabaseClient";

// Build the shape the rest of the app expects (`user.role`, `user.name`, ...)
// from a Supabase session. Role/name/IDs are stored in user_metadata at
// signup time (see `signup` below).
const buildUserState = (session) => {
  if (!session?.user) {
    return { name: "", role: "student", email: "", isAuthenticated: false };
  }

  const meta = session.user.user_metadata || {};

  return {
    id: session.user.id,
    name: meta.full_name || session.user.email,
    role: meta.role || "student",
    email: session.user.email,
    isAuthenticated: true,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: "",
    role: "student",
    email: "",
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(buildUserState(session));
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(buildUserState(session));
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password, selectedRole = "student") => {
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return false;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message || "Invalid email or password.");
      return false;
    }

    const role = data.user?.user_metadata?.role || "student";
    if (role !== selectedRole) {
      setError(`This account is not registered as ${selectedRole}.`);
      await supabase.auth.signOut();
      return false;
    }

    return true;
  }, []);

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

    // NOTE: this only checks the code was typed in. If you want the access
    // code to actually gate who can register as staff/admin, verify it
    // server-side (e.g. in a Supabase Edge Function or a DB check) instead
    // of trusting the client.
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

    const fullName = `${firstName} ${lastName}`;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: roleId,
          student_id: roleId === "student" ? studentId : undefined,
          employee_id: roleId !== "student" ? employeeId : undefined,
          year_level: roleId === "student" ? year : undefined,
          department: roleId !== "student" ? department : undefined,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message || "Could not create account.");
      return false;
    }

    // If "Confirm email" is enabled in Supabase, signUp succeeds but there
    // is no session yet — the account isn't usable until the user clicks
    // the confirmation link in their email.
    if (!data.session) {
      return "confirm-email";
    }

    return true;
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return false;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/reset-password` },
    );

    if (resetError) {
      setError(resetError.message || "Could not send reset email.");
      return false;
    }

    return true;
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    setError("");

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message || "Could not update password.");
      return false;
    }

    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    requestPasswordReset,
    updatePassword,
    error,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
