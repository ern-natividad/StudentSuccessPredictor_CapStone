import { useDashboard } from "../../hooks/useDashboard";
import StudentPrediction from "../../features/staff/pages/StudentPrediction";
import WhatIfSimulator from "../../features/student/pages/WhatIfSimulator";
import AccountSettingsPage from "../../features/common/pages/AccountSettingsPage"; 

const DashboardLayout = () => {
  const { currentPage } = useDashboard();

  const renderPage = () => {
    switch (currentPage) {
      case "prediction":
        return <StudentPrediction />;
      case "simulator":
        return <WhatIfSimulator />;
      case "settings":
        return <AccountSettingsPage />; 
      default:
        return <StudentPrediction />;
    }
  };

  return renderPage();
};

export default DashboardLayout;