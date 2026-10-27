import { HttpError } from "../middleware/errorHandler.js";
import {
  listAdviserAssignments,
  saveAdviserAssignmentGroup,
} from "../services/adviserAssignmentService.js";

const cleanText = (value) => String(value ?? "").trim().replace(/\s+/g, " ");
const isValidSchoolYear = (value) => {
  const match = String(value).match(/^(\d{4})-(\d{4})$/);
  return Boolean(match && Number(match[2]) === Number(match[1]) + 1);
};

export const getAdviserAssignments = async (req, res) => {
  const allAssignments = await listAdviserAssignments();
  const assignments =
    req.user?.role === "staff"
      ? allAssignments.filter(
          (assignment) => assignment.adviser_user_id === req.user.sub,
        )
      : allAssignments;
  res.status(200).json({ assignments });
};

export const putAdviserAssignmentGroup = async (req, res) => {
  const adviserUserId = cleanText(req.body.adviser_user_id);
  const schoolYear = cleanText(req.body.school_year);
  const program = cleanText(req.body.program);
  const yearLevel = cleanText(req.body.year_level);
  const sections = [
    ...new Set(
      (Array.isArray(req.body.sections) ? req.body.sections : [])
        .map(cleanText)
        .filter(Boolean),
    ),
  ];

  if (!adviserUserId || !program || !yearLevel || sections.length === 0) {
    throw new HttpError(
      400,
      "Staff, program, year level, and at least one section are required.",
    );
  }
  if (!isValidSchoolYear(schoolYear)) {
    throw new HttpError(400, "School year must be a consecutive YYYY-YYYY pair.");
  }

  const previous = req.body.previous_group;
  let previousGroup;
  if (previous) {
    const previousSchoolYear = cleanText(previous.school_year);
    const previousAdviserUserId = cleanText(previous.adviser_user_id);
    const previousProgram = cleanText(previous.program);
    const previousYearLevel = cleanText(previous.year_level);
    if (
      !previousAdviserUserId ||
      !previousProgram ||
      !previousYearLevel ||
      !isValidSchoolYear(previousSchoolYear)
    ) {
      throw new HttpError(400, "The existing assignment scope is invalid.");
    }
    previousGroup = {
      adviserUserId: previousAdviserUserId,
      schoolYear: previousSchoolYear,
      program: previousProgram,
      yearLevel: previousYearLevel,
    };
  }

  const assignments = await saveAdviserAssignmentGroup({
    adviserUserId,
    schoolYear,
    program,
    yearLevel,
    sections,
    previousGroup,
  });
  res.status(200).json({ assignments });
};
