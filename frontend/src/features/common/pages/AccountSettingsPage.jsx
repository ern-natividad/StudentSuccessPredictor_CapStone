import ModuleShell from "../../../components/Common/ModuleShell";
import MfaSetup from "../../../components/Auth/MfaSetup";
import { useAuth } from "../../../hooks/useAuth";
import { isBackendAuthEnabled } from "../../../services/api";
import moduleStyles from "../../../styles/Modules.module.css";

const AccountSettingsPage = () => {
  const { user, updateTwoFactorEnabled } = useAuth();
  const backendAuth = isBackendAuthEnabled();

  return (
    <ModuleShell
      title="Account Security"
      description="Manage two-factor authentication and account security settings."
    >
      {backendAuth ? (
        <MfaSetup
          twoFactorEnabled={user.twoFactorEnabled}
          onChanged={updateTwoFactorEnabled}
        />
      ) : (
        <div className={moduleStyles.moduleCard}>
          <div className={moduleStyles.moduleTitleSmall}>Two-Factor Authentication</div>
          <p className={moduleStyles.moduleSubtitle}>
            Enable backend authentication to manage two-factor authentication for your account.
          </p>
        </div>
      )}
    </ModuleShell>
  );
};

export default AccountSettingsPage;
