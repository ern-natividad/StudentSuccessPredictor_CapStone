import { useDashboard } from "../../hooks/useDashboard";
import DashboardOverview from "../Dashboard/DashboardOverview";
import StudentsList from "../Dashboard/StudentsList";
import AlertsList from "../Dashboard/AlertsList";
import ModelManagementPage from "./ModelManagementPage";
import AuditLogsPage from "./AuditLogsPage";

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
