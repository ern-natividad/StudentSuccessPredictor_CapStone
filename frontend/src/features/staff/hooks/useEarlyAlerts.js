import { useDashboard } from "../../../hooks/useDashboard";

export const useEarlyAlerts = () => {
  const {
    alerts,
    alertsLoading,
    alertsError,
    refreshEarlyAlerts,
  } = useDashboard();

  return {
    alerts,
    loading: alertsLoading,
    error: alertsError,
    refetch: refreshEarlyAlerts,
  };
};
