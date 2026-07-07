import { useDashboard } from "../../../hooks/useDashboard";
import DashboardOverview from "./DashboardOverview";
import StudentsList from "./StudentsList";
import AlertsList from "../components/AlertsList";
import ScreeningPage from "../../admin/pages/ScreeningPage";
import AccountSettingsPage from "../../common/pages/AccountSettingsPage";

const StaffDashboard = () => {
  const { currentPage } = useDashboard();

  const renderStaffPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardOverview />;
      case "students":
        return <StudentsList />;
      case "alerts":
        return <AlertsList />;
      case "screening":
        return <ScreeningPage />;
      case "settings":
        return <AccountSettingsPage />;
      default:
        return <DashboardOverview />;
    }
  };

  return renderStaffPage();
};

export default StaffDashboard;