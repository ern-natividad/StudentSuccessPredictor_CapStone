import {
  getAcademicPerformanceDashboard,
  syncAcademicPerformanceRecords,
} from "../services/academicPerformanceService.js";

export const getPerformanceForecasts = async (req, res) => {
  const result = await getAcademicPerformanceDashboard({
    academicYear: req.query.academicYear,
    riskLevel: req.query.riskLevel,
    program: req.query.program,
    search: req.query.search,
    sync: req.query.sync,
  });

  return res.status(200).json(result);
};

export const syncPerformanceForecasts = async (req, res) => {
  const result = await syncAcademicPerformanceRecords(req.body?.academicYear);

  return res.status(200).json({
    success: true,
    ...result,
  });
};
