import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../components/Common/Toast";
import { api } from "../../../services/api";
import { getUserDirectory } from "../../../services/userDirectory";
import styles from "../../../styles/Dashboard.module.css";
import moduleStyles from "../../../styles/Modules.module.css";

const AccountSettingsPage = () => {
  const authContext = useAuth();
  const toast = useToast();
  const user = authContext.user;
  const updateUserFields = authContext.updateUserFields;

  // Extract token from context or fallback session sources
  const token =
    authContext.token ||
    user?.token ||
    sessionStorage.getItem("authToken") ||
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [loading, setLoading] = useState(false);

  // SEARCH, FILTER, AND PAGINATION
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const notifyError = useCallback(
    (message) => {
      const isSessionError = message.toLowerCase().includes("session");
      toast.error(message, {
        duration: isSessionError ? 8000 : 4000,
        action: isSessionError
          ? { label: "Re-Login", onClick: () => { window.location.href = "/login"; } }
          : undefined,
      });
    },
    [toast],
  );

  const loadManageableAccounts = useCallback(async () => {
    setFetchingUsers(true);
    try {
      setManageableUsers(await getUserDirectory());
    } catch (err) {
      console.error("Failed to load users for deletion management:", err);
      notifyError(err.message || "Could not load accounts from Supabase.");
    } finally {
      setFetchingUsers(false);
    }
  }, [notifyError]);

  useEffect(() => {
    if (user?.role === "admin") loadManageableAccounts();
  }, [user?.role, loadManageableAccounts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  // Filter users based on Search query & Role filter
  const filteredUsers = useMemo(() => {
    return manageableUsers.filter((u) => {
      const name = (u.full_name || u.fullName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const term = searchQuery.toLowerCase().trim();

      const matchesSearch = name.includes(term) || email.includes(term);

      const userRole = (u.role || "").toLowerCase();
      const matchesRole =
        roleFilter === "all" ? true : userRole === roleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [manageableUsers, searchQuery, roleFilter]);

  // Paginate filtered data
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const res = await api.startMfaSetup();
      setQrCodeUrl(res.qrCodeDataUrl);
      setManualKey(res.manualEntryKey);
      setIsSettingUp(true);
    } catch (err) {
      notifyError(err.message || "Failed to start MFA setup.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.confirmMfaSetup(verificationCode);
      if (res && res.success) {
        setIsSettingUp(false);
        setVerificationCode("");
        toast.success("Google Authenticator enabled successfully!");

        if (updateUserFields) {
          updateUserFields({ two_factor_enabled: true, twoFactorEnabled: true });
        }
      } else {
        notifyError("Failed to confirm setup. Please try scanning again.");
      }
    } catch (err) {
      notifyError(err.message || "Invalid validation code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.disableMfa(disableCode);
      setShowDisableModal(false);
      setDisableCode("");
      toast.success("Two-Factor Authentication disabled safely.");

      if (updateUserFields) {
        updateUserFields({ two_factor_enabled: false, twoFactorEnabled: false });
      }
    } catch (err) {
      notifyError(err.message || "Failed to disable. Check your verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Prevent self-deletion before opening modal
  const handleOpenDeleteModal = (userItem) => {
    const isSelf =
      userItem.id === user?.id ||
      (userItem.email && userItem.email.toLowerCase() === user?.email?.toLowerCase());

    if (isSelf) {
      toast.error("You cannot delete your own active admin account.");
      return;
    }

    setSelectedUser(userItem);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteAccount = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Defense-in-depth check
    const isSelf =
      selectedUser.id === user?.id ||
      (selectedUser.email && selectedUser.email.toLowerCase() === user?.email?.toLowerCase());

    if (isSelf) {
      toast.error("Operation aborted: You cannot delete your own active account.");
      setShowDeleteModal(false);
      setSelectedUser(null);
      return;
    }

    setDeleteLoading(true);

    try {
      const res = await api.deleteAccount(selectedUser.id, token);
      setShowDeleteModal(false);
      setSelectedUser(null);
      toast.success(res?.message || "Account removed successfully.");

      await loadManageableAccounts();
    } catch (err) {
      notifyError(err.message || "Failed to delete account.");
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={styles.pageShell}>
      <div className={styles.pageHeaderCard}>
        <div>
          <h1 className={styles.pageTitle}>Security & Account Settings</h1>
          <p className={styles.pageSubtitle}>
            Manage two-factor authentication and account security for your HawkPredict profile.
          </p>
        </div>
        
      </div>

      {/* MFA Management Section */}
      <div className={styles.contentCard}>
        <div className={styles.contentCardHeader}>
          <div>
            <div className={styles.contentCardEyebrow}>Security</div>
            <div className={styles.contentCardTitle}>Two-Factor Authentication (MFA)</div>
            <p className={styles.contentCardMeta}>
              Secure your account using dynamic timed verification codes via Google Authenticator.
            </p>
          </div>
          <span
            className={styles.selectedStudentTag}
            style={{
              backgroundColor: isMfaEnabled ? "#e8f5e9" : "#ffebee",
              color: isMfaEnabled ? "#2e7d32" : "#c62828",
            }}
          >
            {isMfaEnabled ? "ENABLED" : "DISABLED"}
          </span>
        </div>

        <div style={{ marginTop: "1.25rem" }}>
          {!isMfaEnabled && !isSettingUp && (
            <button
              type="button"
              onClick={handleStartSetup}
              disabled={loading}
              className={moduleStyles.primaryButton}
            >
              {loading ? "Initializing..." : "Enable Google Authenticator"}
            </button>
          )}

          {isMfaEnabled && (
            <button
              type="button"
              onClick={() => setShowDisableModal(true)}
              className={moduleStyles.primaryButton}
              style={{ backgroundColor: "#d32f2f" }}
            >
              Disable 2FA
            </button>
          )}
        </div>

        {!isMfaEnabled && isSettingUp && (
          <div className={styles.contentCard} style={{ marginTop: "1.25rem", boxShadow: "none" }}>
            <div className={styles.contentCardTitle} style={{ fontSize: 16 }}>Link your Device</div>
            <p className={styles.contentCardMeta}>
              Scan this QR code using Google Authenticator or use the manual key <strong>{manualKey}</strong>:
            </p>

            <div style={{ textAlign: "left", margin: "1rem 0" }}>
              {qrCodeUrl && <img src={qrCodeUrl} alt="MFA QR Enrollment Code" style={{ maxWidth: "180px" }} />}
            </div>

            <form onSubmit={handleConfirmSetup}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "300px" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold" }}>Enter 6-Digit Code:</label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid #d8e0ea", fontSize: "16px", textAlign: "center", letterSpacing: "4px" }}
                  required
                />
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className={moduleStyles.primaryButton}
                    style={{ flex: 1, backgroundColor: loading ? "#cccccc" : "#2e7d32" }}
                  >
                    {loading ? "Verifying..." : "Verify & Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSettingUp(false)}
                    className={moduleStyles.secondaryButton}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ADMIN-ONLY: Remove Account Section */}
      {user?.role === 'admin' && (
        <div className={styles.contentCard}>
          <div className={styles.contentCardHeader}>
            <div>
              <div className={styles.contentCardEyebrow}>Administration</div>
              <div className={styles.contentCardTitle}>Remove User Account</div>
              <p className={styles.contentCardMeta}>
                Manage registered user accounts with full system revocation capabilities.
              </p>
            </div>
            <button
              type="button"
              onClick={loadManageableAccounts}
              disabled={fetchingUsers}
              className={moduleStyles.secondaryButton}
            >
              {fetchingUsers ? "Refreshing..." : "Refresh Table"}
            </button>
          </div>

          {/* SEARCH & FILTER CONTROLS */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: "1 1 200px",
                maxWidth: "320px",
                padding: "0.5rem 0.75rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "13px"
              }}
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "13px",
                backgroundColor: "#fff",
                cursor: "pointer"
              }}
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
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
                      Loading accounts...
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
                      No matching accounts found.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => {
                    const name = u.full_name || u.fullName || u.email?.split("@")[0] || "User";
                    const isSelf =
                      u.id === user?.id ||
                      (u.email && u.email.toLowerCase() === user?.email?.toLowerCase());

                    return (
                      <tr key={u.id} style={{ borderBottom: "1px solid #eee", fontSize: "14px", backgroundColor: isSelf ? "#fafafa" : "transparent" }}>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: "600" }}>
                          {name}
                          {isSelf && (
                            <span style={{
                              marginLeft: "8px",
                              padding: "0.15rem 0.4rem",
                              backgroundColor: "#e8e8e8",
                              color: "#800000",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: "bold",
                              textTransform: "uppercase"
                            }}>
                              You
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", color: "#555" }}>{u.email}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span style={{ 
                            padding: "0.2rem 0.5rem", 
                            borderRadius: "4px", 
                            fontSize: "11px", 
                            fontWeight: "bold",
                            backgroundColor: u.role === 'admin' ? '#ffebee' : u.role === 'staff' ? '#e3f2fd' : '#f3e5f5',
                            color: u.role === 'admin' ? '#c62828' : u.role === 'staff' ? '#1565c0' : '#7b1fa2'
                          }}>
                            {u.role ? u.role.toUpperCase() : 'USER'}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                          <button
                            onClick={() => handleOpenDeleteModal(u)}
                            disabled={isSelf}
                            title={isSelf ? "You cannot delete your own active account" : "Remove Account"}
                            style={{
                              backgroundColor: isSelf ? "#cccccc" : "#800000",
                              color: isSelf ? "#666666" : "#ffffff",
                              border: "none",
                              padding: "0.4rem 0.8rem",
                              borderRadius: "4px",
                              cursor: isSelf ? "not-allowed" : "pointer",
                              fontSize: "12px",
                              opacity: isSelf ? 0.7 : 1
                            }}
                          >
                            {isSelf ? "Current Account" : "Remove Account"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          {!fetchingUsers && filteredUsers.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", fontSize: "13px", color: "#555" }}>
              <div>
                Showing <strong>{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</strong> to <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}</strong> of <strong>{filteredUsers.length}</strong> accounts
              </div>
              <div style={{ display: "flex", gap: "0.25rem" }}>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: "0.3rem 0.6rem",
                    border: "1px solid #ccc",
                    backgroundColor: currentPage === 1 ? "#f5f5f5" : "#fff",
                    color: currentPage === 1 ? "#999" : "#333",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    borderRadius: "4px"
                  }}
                >
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: "0.3rem 0.6rem",
                      border: "1px solid #ccc",
                      backgroundColor: currentPage === pageNum ? "#800000" : "#fff",
                      color: currentPage === pageNum ? "#fff" : "#333",
                      cursor: "pointer",
                      borderRadius: "4px",
                      fontWeight: currentPage === pageNum ? "bold" : "normal"
                    }}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "0.3rem 0.6rem",
                    border: "1px solid #ccc",
                    backgroundColor: currentPage === totalPages ? "#f5f5f5" : "#fff",
                    color: currentPage === totalPages ? "#999" : "#333",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    borderRadius: "4px"
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
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