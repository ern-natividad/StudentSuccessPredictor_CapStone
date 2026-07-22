import React, { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth"; 
import { api } from "../../../services/api";

const AccountSettingsPage = () => {
  const authContext = useAuth();
  const user = authContext.user;
  const updateUserFields = authContext.updateUserFields;
  
  // Extract token from context or fallback to localStorage keys
  const token = 
    authContext.token || 
    user?.token || 
    localStorage.getItem("token") || 
    localStorage.getItem("accessToken");
  
  const isMfaEnabled = user?.two_factor_enabled || user?.twoFactorEnabled || false;
  
  // Setup & Disable States
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  // Account Removal States (Admin Only)
  const [manageableUsers, setManageableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // Selected user object for deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  
  const [uiError, setUiError] = useState("");
  const [uiSuccess, setUiSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Load manageable accounts when Admin views the page
  useEffect(() => {
    if (user?.role === 'admin') {
      loadManageableAccounts();
    }
  }, [user]);

  const loadManageableAccounts = async () => {
    setFetchingUsers(true);
    setUiError("");
    try {
      const users = await api.getManageableUsers(token);
      setManageableUsers(users || []);
    } catch (err) {
      console.error("Failed to load users for deletion management:", err);
      setUiError(err.message || "Could not load manageable accounts. Please re-login if session expired.");
    } finally {
      setFetchingUsers(false);
    }
  };

  // 1. Initialize MFA Request
  const handleStartSetup = async () => {
    setUiError("");
    setUiSuccess("");
    setLoading(true);
    try {
      const res = await api.startMfaSetup();
      setQrCodeUrl(res.qrCodeDataUrl);
      setManualKey(res.manualEntryKey);
      setIsSettingUp(true);
    } catch (err) {
      setUiError(err.message || "Failed to start MFA setup.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Confirm and Activate MFA
  const handleConfirmSetup = async (e) => {
    e.preventDefault();
    setUiError("");
    setUiSuccess("");
    setLoading(true);
    try {
      const res = await api.confirmMfaSetup(verificationCode);
      if (res && res.success) {
        setIsSettingUp(false);
        setVerificationCode("");
        setUiSuccess("Google Authenticator enabled successfully!");
        
        if (updateUserFields) {
          updateUserFields({ two_factor_enabled: true, twoFactorEnabled: true });
        }
      } else {
        setUiError("Failed to confirm setup. Please try scanning again.");
      }
    } catch (err) {
      setUiError(err.message || "Invalid validation code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Confirm and Deactivate MFA
  const handleDisableMfa = async (e) => {
    e.preventDefault();
    setUiError("");
    setUiSuccess("");
    setLoading(true);
    try {
      await api.disableMfa(disableCode);
      setShowDisableModal(false);
      setDisableCode("");
      setUiSuccess("Two-Factor Authentication disabled safely.");
      
      if (updateUserFields) {
        updateUserFields({ two_factor_enabled: false, twoFactorEnabled: false });
      }
    } catch (err) {
      setUiError(err.message || "Failed to disable. Check your verification code.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Open Delete Modal for specific target
  const handleOpenDeleteModal = (userItem) => {
    setSelectedUser(userItem);
    setShowDeleteModal(true);
  };

  // 5. Submit Account Deletion
  const handleConfirmDeleteAccount = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUiError("");
    setUiSuccess("");
    setDeleteLoading(true);

    try {
      const res = await api.deleteAccount(selectedUser.id, token);
      setShowDeleteModal(false);
      setSelectedUser(null);
      setUiSuccess(res.message || "Account removed successfully.");
      
      // Refresh the user table
      loadManageableAccounts();
    } catch (err) {
      setUiError(err.message || "Failed to delete account.");
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2 style={{ color: "#800000", borderBottom: "2px solid #f0f0f0", paddingBottom: "0.5rem" }}>
        Security & Account Settings
      </h2>

      {/* Global Alerts */}
      {uiError && (
        <div style={{ backgroundColor: "#ffebee", color: "#c62828", padding: "1rem", borderRadius: "4px", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{uiError}</span>
          {uiError.includes("session") && (
            <button onClick={() => window.location.href = "/login"} style={{ backgroundColor: "#c62828", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
              Re-Login
            </button>
          )}
        </div>
      )}
      {uiSuccess && <div style={{ backgroundColor: "#e8f5e9", color: "#2e7d32", padding: "1rem", borderRadius: "4px", marginBottom: "1rem" }}>{uiSuccess}</div>}

      {/* MFA Management Section */}
      <div style={{ background: "#fafafa", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", marginBottom: "1.5rem" }}>
        <h3 style={{ marginTop: 0 }}>Two-Factor Authentication (MFA)</h3>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Secure your account using dynamic timed verification codes via Google Authenticator.
        </p>

        <div style={{ margin: "1.5rem 0" }}>
          <span style={{ fontSize: "14px", fontWeight: "bold" }}>Status: </span>
          <span style={{
            padding: "0.25rem 0.5rem", 
            borderRadius: "4px", 
            fontSize: "12px", 
            fontWeight: "bold",
            backgroundColor: isMfaEnabled ? "#e8f5e9" : "#ffebee",
            color: isMfaEnabled ? "#2e7d32" : "#c62828"
          }}>
            {isMfaEnabled ? "ENABLED" : "DISABLED"}
          </span>
        </div>

        {!isMfaEnabled && !isSettingUp && (
          <button 
            onClick={handleStartSetup} 
            disabled={loading}
            style={{ backgroundColor: "#800000", color: "#fff", border: "none", padding: "0.6rem 1.2rem", borderRadius: "4px", cursor: "pointer" }}
          >
            {loading ? "Initializing..." : "Enable Google Authenticator"}
          </button>
        )}

        {isMfaEnabled && (
          <button 
            onClick={() => setShowDisableModal(true)} 
            style={{ backgroundColor: "#d32f2f", color: "#fff", border: "none", padding: "0.6rem 1.2rem", borderRadius: "4px", cursor: "pointer" }}
          >
            Disable 2FA
          </button>
        )}

        {!isMfaEnabled && isSettingUp && (
          <div style={{ marginTop: "1.5rem", background: "#fff", padding: "1rem", borderRadius: "6px", border: "1px solid #e0e0e0" }}>
            <h4 style={{ margin: "0 0 0.5rem 0" }}>Link your Device</h4>
            <p style={{ fontSize: "13px", color: "#666" }}>
              Scan this QR code using Google Authenticator or use the manual key <strong>{manualKey}</strong>:
            </p>
            
            <div style={{ textAlign: "center", margin: "1rem 0" }}>
              {qrCodeUrl && <img src={qrCodeUrl} alt="MFA QR Enrollment Code" style={{ maxWidth: "180px" }} />}
            </div>

            <form onSubmit={handleConfirmSetup}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold" }}>Enter 6-Digit Code:</label>
                <input 
                  type="text" 
                  maxLength="6"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", fontSize: "16px", textAlign: "center", letterSpacing: "4px" }}
                  required
                />
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    style={{ flex: 1, backgroundColor: loading ? "#cccccc" : "#2e7d32", color: "#fff", border: "none", padding: "0.5rem", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer" }}
                  >
                    {loading ? "Verifying..." : "Verify & Activate"}
                  </button>
                  <button type="button" onClick={() => setIsSettingUp(false)} style={{ backgroundColor: "#ccc", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ADMIN-ONLY: Remove Account Section (Table Layout) */}
      {user?.role === 'admin' && (
        <div style={{ background: "#fafafa", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderTop: "3px solid #800000" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ color: "#800000", margin: 0 }}>Remove User Account</h3>
              <p style={{ color: "#666", fontSize: "14px", margin: "0.25rem 0 0 0" }}>
                Manage Student and Staff accounts with full system revocation capabilities.
              </p>
            </div>
            <button 
              onClick={loadManageableAccounts} 
              disabled={fetchingUsers}
              style={{ backgroundColor: "#f0f0f0", border: "1px solid #ccc", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
            >
              {fetchingUsers ? "Refreshing..." : "Refresh Table"}
            </button>
          </div>

          {/* User Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "6px", overflow: "hidden", border: "1px solid #e0e0e0" }}>
              <thead>
                <tr style={{ backgroundColor: "#800000", color: "#fff", textAlign: "left", fontSize: "14px" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>User</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Email</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Role</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {fetchingUsers ? (
                  <tr>
                    <td colSpan="4" style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
                      Loading manageable accounts...
                    </td>
                  </tr>
                ) : manageableUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
                      No student or staff accounts found.
                    </td>
                  </tr>
                ) : (
                  manageableUsers.map((u) => {
                    const name = u.full_name || u.fullName || u.email.split("@")[0];
                    return (
                      <tr key={u.id} style={{ borderBottom: "1px solid #eee", fontSize: "14px" }}>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: "600" }}>{name}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#555" }}>{u.email}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span style={{ 
                            padding: "0.2rem 0.5rem", 
                            borderRadius: "4px", 
                            fontSize: "11px", 
                            fontWeight: "bold",
                            backgroundColor: u.role === 'staff' ? '#e3f2fd' : '#f3e5f5',
                            color: u.role === 'staff' ? '#1565c0' : '#7b1fa2'
                          }}>
                            {u.role ? u.role.toUpperCase() : 'USER'}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                          <button
                            onClick={() => handleOpenDeleteModal(u)}
                            style={{
                              backgroundColor: "#800000",
                              color: "#fff",
                              border: "none",
                              padding: "0.4rem 0.8rem",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                          >
                            Remove Account
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Disable MFA Modal */}
      {showDisableModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", maxWidth: "400px", width: "90%", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#d32f2f" }}>Are you absolutely sure?</h3>
            <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.4" }}>
              Disabling multi-factor authentication drops an extra layer of account protection.
            </p>
            <form onSubmit={handleDisableMfa}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
                <input 
                  type="text" 
                  maxLength="6"
                  placeholder="Enter current 6-digit code"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", textAlign: "center" }}
                  required
                />
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button type="submit" disabled={loading} style={{ flex: 1, backgroundColor: "#d32f2f", color: "#fff", border: "none", padding: "0.5rem", borderRadius: "4px", cursor: "pointer" }}>
                    {loading ? "Disabling..." : "Yes, Disable Protection"}
                  </button>
                  <button type="button" onClick={() => { setShowDisableModal(false); setDisableCode(""); }} style={{ backgroundColor: "#ccc", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Remove Account Modal */}
      {showDeleteModal && selectedUser && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", maxWidth: "420px", width: "90%", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#800000" }}>Confirm Account Removal</h3>
            <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.4" }}>
              Are you sure you want to permanently delete the account for <strong>{selectedUser.full_name || selectedUser.email}</strong>? This action cannot be undone.
            </p>
            <form onSubmit={handleConfirmDeleteAccount}>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button type="submit" disabled={deleteLoading} style={{ flex: 1, backgroundColor: "#800000", color: "#fff", border: "none", padding: "0.5rem", borderRadius: "4px", cursor: "pointer" }}>
                  {deleteLoading ? "Deleting..." : "Yes, Remove Account"}
                </button>
                <button type="button" onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }} style={{ backgroundColor: "#ccc", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettingsPage;