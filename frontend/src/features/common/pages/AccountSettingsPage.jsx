import React, { useState } from "react";
import { useAuth } from "../../../hooks/useAuth"; 
import { api } from "../../../services/api";

const AccountSettingsPage = () => {
  const { user, updateUserFields } = useAuth();
  
  // Track reactive flag status cleanly from global state layer
  const isMfaEnabled = user?.two_factor_enabled || user?.twoFactorEnabled || false;
  
  // Setup States
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  
  // Disable States
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  
  const [uiError, setUiError] = useState("");
  const [uiSuccess, setUiSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Initialize the MFA Generation Request
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

  // 2. Submit the 6-Digit Code to Confirm and Activate
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
        
        // Lock changes directly into the global AuthContext state
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
      
      // Clear flags globally from AuthContext
      if (updateUserFields) {
        updateUserFields({ two_factor_enabled: false, twoFactorEnabled: false });
      }
    } catch (err) {
      setUiError(err.message || "Failed to disable. Check your verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2 style={{ color: "#800000", borderBottom: "2px solid #f0f0f0", paddingBottom: "0.5rem" }}>
        Security Settings
      </h2>

      {/* Global Message Alerts */}
      {uiError && <div style={{ backgroundColor: "#ffebee", color: "#c62828", padding: "1rem", borderRadius: "4px", marginBottom: "1rem" }}>{uiError}</div>}
      {uiSuccess && <div style={{ backgroundColor: "#e8f5e9", color: "#2e7d32", padding: "1rem", borderRadius: "4px", marginBottom: "1rem" }}>{uiSuccess}</div>}

      <div style={{ background: "#fafafa", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        <h3>Two-Factor Authentication (MFA)</h3>
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

        {/* Action Toggle Buttons */}
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

        {/* Interactive QR Setup Box */}
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

      {/* Confirmation Disable Modal Backdrop */}
      {showDisableModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", maxWidth: "400px", width: "90%", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#d32f2f" }}>Are you absolutely sure?</h3>
            <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.4" }}>
              Disabling multi-factor authentication drops an extra layer of account protection. To proceed, confirm by typing the current code from your authenticator application.
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
    </div>
  );
};

export default AccountSettingsPage;