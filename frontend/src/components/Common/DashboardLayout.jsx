import { useDashboard } from "../../hooks/useDashboard";
import StudentPrediction from "../../features/staff/pages/StudentPrediction";
import MyGradesPage from "../../features/student/pages/MyGradesPage";
import AccountSettingsPage from "../../features/common/pages/AccountSettingsPage";

const DashboardLayout = () => {
  const { currentPage } = useDashboard();

  const renderPage = () => {
    switch (currentPage) {
      case "prediction":
        return <StudentPrediction />;
      case "grades":
        return <MyGradesPage />;
      case "settings":
        return <AccountSettingsPage />;
      default:
        return <StudentPrediction />;
    }
  };

  return renderPage();
};

export default DashboardLayout;
