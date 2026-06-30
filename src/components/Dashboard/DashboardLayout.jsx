import { useDashboard } from "../../hooks/useDashboard";
import StudentPrediction from "./StudentPrediction";
import WhatIfSimulator from "./WhatIfSimulator";

const DashboardLayout = () => {
  const { currentPage } = useDashboard();

  const renderPage = () => {
    switch (currentPage) {
      case "prediction":
        return <StudentPrediction />;
      case "simulator":
        return <WhatIfSimulator />;
      default:
        return <StudentPrediction />;
    }
  };

  return renderPage();
};

export default DashboardLayout;
