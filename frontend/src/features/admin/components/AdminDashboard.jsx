import { useDashboard } from "../../../hooks/useDashboard";
import DashboardOverview from "../../staff/pages/DashboardOverview";
import StudentsList from "../../staff/pages/StudentsList";
import AlertsList from "../../staff/components/AlertsList";
import ModelManagementPage from "../pages/ModelManagementPage";
import AuditLogsPage from "../pages/AuditLogsPage";
import AccountSettingsPage from "../../common/pages/AccountSettingsPage";
import AdviserManager from "../pages/AdviserManager";

const AdminDashboard = () => {
  const { currentPage } = useDashboard();

  switch (currentPage) {
    case "dashboard":
      return <DashboardOverview />;
    case "students":
      return <StudentsList />;
    case "adviser-manager":
      return <AdviserManager />;
    case "alerts":
      return <AlertsList />;
    case "models":
      return <ModelManagementPage />;
    case "audit":
      return <AuditLogsPage />;
    case "settings":
      return <AccountSettingsPage />;
    default:
      return <DashboardOverview />;
  }
};

export default AdminDashboard;
