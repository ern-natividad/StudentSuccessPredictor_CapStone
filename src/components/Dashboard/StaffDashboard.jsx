import { useDashboard } from "../../hooks/useDashboard";
import DashboardOverview from "../Dashboard/DashboardOverview";
import StudentsList from "../Dashboard/StudentsList";
import AlertsList from "../Dashboard/AlertsList";
import ScreeningPage from "./ScreeningPage";

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
      default:
        return <DashboardOverview />;
    }
  };

  return renderStaffPage();
};

export default StaffDashboard;
