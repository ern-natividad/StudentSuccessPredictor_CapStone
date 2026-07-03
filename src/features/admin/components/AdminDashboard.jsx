import { useDashboard } from "../../../hooks/useDashboard";
import DashboardOverview from "../../staff/pages/DashboardOverview";
import StudentsList from "../../staff/pages/StudentsList";
import AlertsList from "../../staff/components/AlertsList";
import ModelManagementPage from "../pages/ModelManagementPage";
import AuditLogsPage from "../pages/AuditLogsPage";

const AdminDashboard = () => {
  const { currentPage } = useDashboard();

  switch (currentPage) {
    case "dashboard":
      return <DashboardOverview />;
    case "students":
      return <StudentsList />;
    case "alerts":
      return <AlertsList />;
    case "models":
      return <ModelManagementPage />;
    case "audit":
      return <AuditLogsPage />;
    default:
      return <DashboardOverview />;
  }
};

export default AdminDashboard;
