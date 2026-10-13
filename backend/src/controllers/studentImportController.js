import { HttpError } from "../middleware/errorHandler.js";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  recordAuditLog,
} from "../services/auditService.js";
import {
  importStudentAccounts,
  previewStudentImport,
} from "../services/studentImportService.js";

const getStudents = (body) => {
  if (!Array.isArray(body?.students)) {
    throw new HttpError(400, "Provide a students array.");
  }
  return body.students;
};

export const previewStudentAccounts = async (req, res) => {
  const result = await previewStudentImport(getStudents(req.body));
  res.status(200).json(result);
};

export const importStudentAccountsHandler = async (req, res) => {
  const result = await importStudentAccounts(getStudents(req.body));
  if (result.created.length > 0) {
    await recordAuditLog({
      userId: req.user.id || req.user.sub,
      username: req.user.email || null,
      action: AUDIT_ACTIONS.USER_CREATED,
      module: AUDIT_MODULES.USER_MANAGEMENT,
      description: `Bulk student account import created ${result.created.length} account(s); ${result.failed.length} row(s) failed.`,
    });
  }
  res.status(result.failed.length > 0 ? 207 : 201).json({
    totalCount: result.created.length + result.failed.length,
    createdCount: result.created.length,
    failedCount: result.failed.length,
    ...result,
  });
};
