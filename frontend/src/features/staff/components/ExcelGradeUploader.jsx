import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiFileText,
  FiRefreshCw,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { api } from "../../../services/api";
import { getPublishedCurricula } from "../../../services/curriculumService";
import { getUserDirectory } from "../../../services/userDirectory";
import { useToast } from "../../../components/Common/Toast";
import { normalizeSemesterCode } from "../../../utils/gradeSemesterUtils";
import { normalizeGradeValue, remarksFromGrade } from "../../../utils/gradeValueUtils";
import styles from "../../../styles/Dashboard.module.css";

const HEADER_ALIASES = {
  id: "student_id",
  studentid: "student_id",
  studentnumber: "student_id",
  userid: "user_id",
  cohort: "cohort_start_year",
  cohortyear: "cohort_start_year",
  cohortstartyear: "cohort_start_year",
  studentname: "student_name",
  fullname: "student_name",
};

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const normalizeIdentifier = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const normalizeCourseKey = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const readCohortStartYear = (value) => {
  const text = String(value ?? "").trim();
  const match = text.match(/^(\d{4})(?:\s*[-–/]\s*\d{4})?$/);
  if (!match) return null;
  const year = Number(match[1]);
  return year >= 1900 && year <= 2200 ? year : null;
};

const readYearLevel = (value) => {
  const match = String(value ?? "").match(/\d+/);
  return match ? Number(match[0]) : null;
};

const readWorkbook = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) throw new Error("The workbook does not contain a worksheet.");
        resolve(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }));
      } catch (error) {
        reject(new Error(error.message || "Unable to read the workbook."));
      }
    };
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsArrayBuffer(file);
  });

const findStudent = (identifier, header, studentById) => {
  const normalizedId = normalizeIdentifier(identifier);
  if (!normalizedId) return [];
  const candidateIds = studentById.get(normalizedId) || [];
  if (header === "user_id") {
    return candidateIds.filter((account) => normalizeIdentifier(account.id) === normalizedId);
  }
  return candidateIds;
};

const findCourseMatches = (header, courses) => {
  const headerKey = normalizeCourseKey(header);
  if (!headerKey) return [];
  return courses.filter((course) => {
    const codeKey = normalizeCourseKey(course.code);
    const titleKey = normalizeCourseKey(course.title);
    return (
      headerKey === codeKey ||
      headerKey === titleKey ||
      (codeKey.length >= 3 && headerKey.startsWith(codeKey))
    );
  });
};

const analyzeImport = (
  sheetRows,
  directory,
  curricula,
  cohortOverrides,
  programOverrides,
  curriculumOverrides,
  selectedCurriculumId,
) => {
  const result = { grades: [], students: [], issues: [] };
  if (!sheetRows.length) return result;

  const headers = (sheetRows[0] || []).map((value) => {
    const original = String(value ?? "").trim();
    const normalized = normalizeHeader(original);
    return { original, key: HEADER_ALIASES[normalized] || normalized };
  });
  const idColumn = headers.findIndex(({ key }) => key === "student_id" || key === "user_id");
  const cohortColumn = headers.findIndex(({ key }) => key === "cohort_start_year");
  const ignoredColumns = new Set(
    headers
      .map(({ key }, index) =>
        ["student_id", "user_id", "cohort_start_year", "student_name"].includes(key)
          ? index
          : -1,
      )
      .filter((index) => index >= 0),
  );

  if (idColumn < 0) {
    result.issues.push("The header row must include student_id (or user_id).");
    return result;
  }

  const studentById = new Map();
  (directory || [])
    .filter((account) => String(account.role).toLowerCase() === "student")
    .forEach((account) => {
      const info = Array.isArray(account.student_info)
        ? account.student_info[0]
        : account.student_info;
      const student = { ...account, student_info: info || null };
      [account.id, info?.student_id].filter(Boolean).forEach((id) => {
        const key = normalizeIdentifier(id);
        const accounts = studentById.get(key) || [];
        if (!accounts.some((entry) => entry.id === account.id)) accounts.push(student);
        studentById.set(key, accounts);
      });
    });

  const groupedStudents = new Map();
  const duplicateGradeKeys = new Set();
  const seenGradeKeys = new Set();
  const rowCount = sheetRows.length;

  sheetRows.slice(1).forEach((row, rowIndex) => {
    if (!(row || []).some((cell) => String(cell ?? "").trim())) return;
    const rowNumber = rowIndex + 2;
    const identifier = row?.[idColumn];
    const studentCandidates = findStudent(identifier, headers[idColumn].key, studentById);
    if (studentCandidates.length === 0) {
      result.issues.push(`Row ${rowNumber}: no student account matches "${String(identifier ?? "").trim()}".`);
      return;
    }
    if (studentCandidates.length > 1) {
      result.issues.push(`Row ${rowNumber}: student ID "${String(identifier).trim()}" matches multiple accounts.`);
      return;
    }

    const account = studentCandidates[0];
    const info = account.student_info || {};
    let student = groupedStudents.get(account.id);
    if (!student) {
      student = {
        userId: account.id,
        studentId: info.student_id || account.id,
        name: account.full_name || account.email || account.id,
        program:
          programOverrides[account.id] ??
          (info.program || account.program || ""),
        cohortStartYear: null,
        curriculum: "",
        curriculumId: "",
        grades: [],
        issues: [],
      };
      groupedStudents.set(account.id, student);
    }

    const rawCohort = cohortColumn >= 0 ? row?.[cohortColumn] : "";
    const parsedCohort = readCohortStartYear(rawCohort);
    const cohortStartYear =
      parsedCohort ||
      readCohortStartYear(cohortOverrides[account.id]) ||
      student.cohortStartYear;
    if (rawCohort && !parsedCohort && !cohortStartYear) {
      student.issues.push(`Row ${rowNumber}: cohort_start_year must be a year such as 2023.`);
      result.issues.push(`Row ${rowNumber}: cohort_start_year must be a year such as 2023.`);
      return;
    }
    if (!cohortStartYear) {
      const message = `Row ${rowNumber}: cohort start year is required for ${student.studentId}.`;
      student.issues.push(message);
      result.issues.push(message);
      return;
    }
    if (student.cohortStartYear && student.cohortStartYear !== cohortStartYear) {
      student.issues.push(`Row ${rowNumber}: this student has conflicting cohort start years.`);
      result.issues.push(`Row ${rowNumber}: conflicting cohort start years for ${student.studentId}.`);
      return;
    }
    student.cohortStartYear = cohortStartYear;

    if (!student.program) {
      student.issues.push(`Row ${rowNumber}: student account has no assigned program.`);
      result.issues.push(`Row ${rowNumber}: no program is assigned to student ${student.studentId}.`);
      return;
    }

    const matchingCurricula = (curricula || []).filter((curriculum) => {
      const curriculumStart = readCohortStartYear(curriculum.academicYear);
      return (
        String(curriculum.program || "").trim().toLowerCase() === student.program.trim().toLowerCase() &&
        curriculumStart === cohortStartYear
      );
    });
    const selectedCurriculum =
      matchingCurricula.find(
        (curriculum) => curriculum.id === curriculumOverrides[account.id],
      ) ||
      matchingCurricula.find(
        (curriculum) => curriculum.id === selectedCurriculumId,
      );
    const curriculum =
      selectedCurriculum ||
      (!selectedCurriculumId && matchingCurricula.length === 1
        ? matchingCurricula[0]
        : null);
    if (!curriculum && selectedCurriculumId && matchingCurricula.length > 0) {
      const message = `Row ${rowNumber}: the selected curriculum does not match ${student.program}, cohort ${cohortStartYear}-${cohortStartYear + 1}. Choose a matching published curriculum for this student.`;
      student.issues.push(message);
      result.issues.push(message);
      return;
    }
    if (!curriculum && matchingCurricula.length === 0) {
      const message = `Row ${rowNumber}: no published curriculum found for ${student.program}, cohort ${cohortStartYear}-${cohortStartYear + 1}.`;
      student.issues.push(message);
      result.issues.push(message);
      return;
    }
    if (!curriculum && matchingCurricula.length > 1) {
      const message = `Row ${rowNumber}: multiple published curricula match ${student.program}, cohort ${cohortStartYear}-${cohortStartYear + 1}.`;
      student.issues.push(message);
      result.issues.push(message);
      return;
    }

    student.curriculum = curriculum.title;
    student.curriculumId = curriculum.id;
    const courses = Array.isArray(curriculum.courses) ? curriculum.courses : [];

    headers.forEach(({ original }, columnIndex) => {
      if (ignoredColumns.has(columnIndex)) return;
      const rawGrade = String(row?.[columnIndex] ?? "").trim();
      if (!rawGrade) return;

      const matchingCourses = findCourseMatches(original, courses);
      if (matchingCourses.length === 0) {
        const message = `Row ${rowNumber}: "${original}" is not a course in ${curriculum.title}.`;
        student.issues.push(message);
        result.issues.push(message);
        return;
      }
      if (matchingCourses.length > 1) {
        const message = `Row ${rowNumber}: course column "${original}" matches multiple curriculum courses.`;
        student.issues.push(message);
        result.issues.push(message);
        return;
      }

      const course = matchingCourses[0];
      const grade = normalizeGradeValue(rawGrade);
      if (!grade) {
        const message = `Row ${rowNumber}: invalid grade "${rawGrade}" for ${course.code || original}.`;
        student.issues.push(message);
        result.issues.push(message);
        return;
      }

      const yearLevel = readYearLevel(course.yearLevel);
      const semester = normalizeSemesterCode(course.semester);
      const units = Number(course.units);
      if (!yearLevel || !["1", "2", "S"].includes(semester) || !Number.isFinite(units)) {
        const message = `Row ${rowNumber}: ${course.code || original} has incomplete year, semester, or units in its curriculum entry.`;
        student.issues.push(message);
        result.issues.push(message);
        return;
      }

      const schoolYearStart = cohortStartYear + yearLevel - 1;
      const gradeRow = {
        user_id: account.id,
        subject_code: String(course.code || original).trim(),
        subject_name: String(course.title || original).trim(),
        semester,
        school_year: `${schoolYearStart}-${schoolYearStart + 1}`,
        grade,
        remarks: remarksFromGrade(grade) || null,
        units,
        student_id: student.studentId,
        student_name: student.name,
        curriculum_title: curriculum.title,
        year_level: course.yearLevel,
      };
      const duplicateKey = [
        gradeRow.user_id,
        gradeRow.subject_code.toLowerCase(),
        gradeRow.school_year,
        gradeRow.semester,
      ].join("|");
      if (seenGradeKeys.has(duplicateKey)) {
        if (!duplicateGradeKeys.has(duplicateKey)) {
          const message = `Row ${rowNumber}: duplicate grade for ${gradeRow.subject_code}, ${gradeRow.school_year}, semester ${gradeRow.semester}.`;
          student.issues.push(message);
          result.issues.push(message);
          duplicateGradeKeys.add(duplicateKey);
        }
        return;
      }
      seenGradeKeys.add(duplicateKey);
      student.grades.push(gradeRow);
      result.grades.push(gradeRow);
    });
  });

  result.students = [...groupedStudents.values()];
  if (rowCount > 5001) {
    result.issues.push("You can import at most 5,000 student rows at once.");
    result.grades = [];
  }
  return result;
};

const ExcelGradeUploader = () => {
  const inputRef = useRef(null);
  const toast = useToast();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ stage: "", value: 0 });
  const [errors, setErrors] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [rowCount, setRowCount] = useState(0);
  const [sheetRows, setSheetRows] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [curriculumLoadStatus, setCurriculumLoadStatus] = useState("loading");
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");
  const [cohortOverrides, setCohortOverrides] = useState({});
  const [programOverrides, setProgramOverrides] = useState({});
  const [curriculumOverrides, setCurriculumOverrides] = useState({});
  const [selectedUserIds, setSelectedUserIds] = useState(null);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    let isMounted = true;
    getPublishedCurricula()
      .then((publishedCurricula) => {
        if (!isMounted) return;
        setCurricula(publishedCurricula);
        setCurriculumLoadStatus("ready");
      })
      .catch((error) => {
        if (!isMounted) return;
        const message =
          error.message || "Unable to load published curricula.";
        setErrors([message]);
        setCurriculumLoadStatus("error");
        toast.error(message);
      });

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const analysis = useMemo(
    () =>
      analyzeImport(
        sheetRows,
        directory,
        curricula,
        cohortOverrides,
        programOverrides,
        curriculumOverrides,
        selectedCurriculumId,
      ),
    [
      sheetRows,
      directory,
      curricula,
      cohortOverrides,
      programOverrides,
      curriculumOverrides,
      selectedCurriculumId,
    ],
  );
  const availableStudentIds = useMemo(
    () => [...new Set(analysis.grades.map((row) => row.user_id))],
    [analysis.grades],
  );
  const activeUserIds = selectedUserIds
    ? selectedUserIds.filter((id) => availableStudentIds.includes(id))
    : availableStudentIds;
  const importRows = analysis.grades.filter((row) => activeUserIds.includes(row.user_id));

  const resetUpload = () => {
    setSelectedFile(null);
    setRowCount(0);
    setSheetRows([]);
    setDirectory([]);
    setCohortOverrides({});
    setProgramOverrides({});
    setCurriculumOverrides({});
    setSelectedUserIds(null);
    setErrors([]);
    setProgress({ stage: "", value: 0 });
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const cancelImport = () => {
    resetUpload();
    toast.info("Grade import cancelled.");
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["student_id", "cohort_start_year", "ENG101", "MATH101"],
      ["STU-2023-001", 2023, "1.75", "2.00"],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");
    XLSX.writeFile(workbook, "grade-import-template.xlsx");
  };

  const processFile = async (file) => {
    if (!file) return;
    if (curriculumLoadStatus !== "ready" || !selectedCurriculumId) {
      toast.error("Choose a published curriculum before selecting a grade file.");
      return;
    }
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      toast.error("Choose an .xlsx or .csv file.");
      return;
    }

    setBusy(true);
    setErrors([]);
    setSheetRows([]);
    setSelectedFile(file);
    setStatus("processing");
    try {
      setProgress({ stage: "Reading workbook", value: 15 });
      const rows = await readWorkbook(file);
      const nonEmptyRows = rows.filter((row) => row.some((cell) => String(cell ?? "").trim()));
      if (nonEmptyRows.length < 2) throw new Error("The selected file must include a header and at least one student row.");
      if (nonEmptyRows.length > 5001) throw new Error("You can import at most 5,000 student rows at once.");
      setRowCount(nonEmptyRows.length - 1);

      setProgress({ stage: "Loading student records", value: 45 });
      const studentRecords = await getUserDirectory();
      setDirectory(studentRecords);
      setCohortOverrides({});
      setProgramOverrides({});
      setCurriculumOverrides({});
      setSelectedUserIds(null);
      setSheetRows(nonEmptyRows);
      setProgress({ stage: "Preview ready", value: 0 });
      setStatus("ready");
      toast.success("Review the student, curriculum, course, and school-year preview before importing.");
    } catch (error) {
      setErrors([error.message || "Unable to prepare grade records."]);
      toast.error(error.message || "Unable to prepare grade records.");
      setStatus("error");
      setProgress({ stage: "File validation failed", value: 0 });
    } finally {
      setBusy(false);
    }
  };

  const importGrades = async () => {
    if (!importRows.length || busy) return;

    const gradeRows = importRows.map(
      ({
        user_id,
        subject_code,
        subject_name,
        semester,
        school_year,
        grade,
        remarks,
      }) => ({
        user_id,
        subject_code,
        subject_name,
        semester,
        school_year,
        grade,
        remarks,
      }),
    );

    setBusy(true);
    setErrors([]);
    setStatus("processing");
    try {
      setProgress({ stage: "Saving grades", value: 65 });
      const result = await api.importStudentGrades(gradeRows);
      const userCount = result.user_ids?.length || new Set(gradeRows.map((row) => row.user_id)).size;
      setProgress({ stage: "Complete", value: 100 });
      setStatus("success");
      toast.success(`${result.count || gradeRows.length} grade rows saved for ${userCount} student${userCount === 1 ? "" : "s"}.`);
    } catch (error) {
      setErrors([error.message || "Unable to import grade records."]);
      toast.error(error.message || "Unable to import grade records.");
      setStatus("error");
      setProgress({ stage: "Import failed", value: 0 });
    } finally {
      setBusy(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    processFile(event.dataTransfer.files[0]);
  };

  const toggleStudent = (userId) => {
    setSelectedUserIds((current) => {
      const currentIds = current || availableStudentIds;
      return currentIds.includes(userId)
        ? currentIds.filter((id) => id !== userId)
        : [...currentIds, userId];
    });
  };

  const statusLabel = {
    idle: "Ready for a file",
    ready: "Preview ready",
    processing: progress.stage || "Preparing import",
    success: "Import complete",
    error: "Needs attention",
  }[status];

  const StatusIcon =
    status === "success" || status === "ready"
      ? FiCheckCircle
      : status === "error"
        ? FiAlertCircle
        : status === "processing"
          ? FiRefreshCw
          : FiUploadCloud;

  return (
    <div className={`${styles.contentCard} ${styles.gradeImportCard}`}>
      <div className={styles.gradeImportCurriculumPicker}>
        <label htmlFor="grade-import-curriculum">
          Published curriculum for this import
        </label>
        <select
          id="grade-import-curriculum"
          value={selectedCurriculumId}
          onChange={(event) => setSelectedCurriculumId(event.target.value)}
          disabled={curriculumLoadStatus !== "ready" || busy || status === "success"}
          aria-describedby="grade-import-curriculum-help"
        >
          <option value="">
            {curriculumLoadStatus === "loading"
              ? "Loading published curricula..."
              : curriculumLoadStatus === "error"
                ? "Unable to load published curricula"
                : curricula.length
                  ? "Choose a curriculum before uploading"
                  : "No published curricula available"}
          </option>
          {curricula.map((curriculum) => (
            <option key={curriculum.id} value={curriculum.id}>
              {curriculum.title} · {curriculum.program} · {curriculum.academicYear}
            </option>
          ))}
        </select>
        <span id="grade-import-curriculum-help">
          Choose the curriculum that matches the students’ program and cohort. You can review individual matches after uploading.
        </span>
        {curriculumLoadStatus === "error" && (
          <span className={styles.gradeImportCurriculumError} role="alert">
            {errors[0] || "Unable to load published curricula."}
          </span>
        )}
      </div>

      <div className={styles.gradeImportHeader}>
        <div className={styles.gradeImportTitleGroup}>
          <div className={styles.contentCardEyebrow}>Batch grade intake</div>
          <div className={styles.contentCardTitle}>Import Excel or CSV grades</div>
          <p className={styles.gradeImportDescription}>
            Upload one row per student with a column for each course. Grades are matched against each student’s published curriculum before anything is saved.
          </p>
        </div>
        <div className={`${styles.gradeImportStatus} ${styles[`gradeImportStatus${status[0].toUpperCase()}${status.slice(1)}`]}`}>
          <StatusIcon size={15} aria-hidden="true" />
          <span>{statusLabel}</span>
        </div>
      </div>

      <div className={styles.gradeImportToolbar}>
        <div className={styles.gradeImportRequirements}>
          <FiFileText size={16} aria-hidden="true" />
          <span>Supports XLSX and CSV, up to 5,000 student rows</span>
        </div>
        <button type="button" className={styles.gradeImportTemplateButton} onClick={downloadTemplate}>
          Download template
        </button>
      </div>

      <button
        type="button"
        className={`${styles.gradeImportDropzone} ${dragging ? styles.gradeImportDropzoneActive : ""} ${busy ? styles.gradeImportDropzoneBusy : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        disabled={
          busy ||
          curriculumLoadStatus !== "ready" ||
          !selectedCurriculumId
        }
        aria-label="Choose an Excel or CSV grade file"
      >
        <span className={styles.gradeImportIcon}><FiUploadCloud size={25} aria-hidden="true" /></span>
        <span className={styles.gradeImportDropTitle}>{busy ? progress.stage : "Drop your grade file here"}</span>
        <span className={styles.gradeImportDropHint}>or click to browse from your device</span>
        <span className={styles.gradeImportFormatHint}>Required: student_id and one column per course; cohort_start_year is optional</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv"
        hidden
        disabled={
          busy ||
          curriculumLoadStatus !== "ready" ||
          !selectedCurriculumId
        }
        onChange={(event) => processFile(event.target.files?.[0])}
      />

      {selectedFile && (
        <div className={`${styles.gradeImportFile} ${status === "error" ? styles.gradeImportFileError : ""}`}>
          <div className={styles.gradeImportFileIcon}><FiFileText size={18} aria-hidden="true" /></div>
          <div className={styles.gradeImportFileDetails}>
            <strong>{selectedFile.name}</strong>
            <span>{(selectedFile.size / 1024).toFixed(1)} KB{rowCount ? ` · ${rowCount.toLocaleString()} student rows detected` : ""}</span>
          </div>
          {!busy && status !== "success" && (
            <button type="button" className={styles.gradeImportClearButton} onClick={cancelImport} aria-label="Cancel grade import" title="Cancel import">
              <FiX size={17} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {busy && (
        <div className={styles.gradeImportProgress} aria-live="polite">
          <div className={styles.gradeImportProgressMeta}>
            <span>{progress.stage}</span>
            <strong>{progress.value}%</strong>
          </div>
          <progress value={progress.value} max="100" />
        </div>
      )}

      {sheetRows.length > 0 && (
        <section className={styles.gradeImportPreview} aria-label="Grade import preview">
          <div className={styles.gradeImportPreviewHeader}>
            <strong>Review before saving</strong>
            <span>{analysis.grades.length} valid grades · {analysis.issues.length} item{analysis.issues.length === 1 ? "" : "s"} need attention</span>
          </div>
          <p className={styles.gradeImportPreviewHelp}>
            Confirm each student’s program and select the published curriculum to use. The course columns are matched against that curriculum. Choose one student for a small test import, or leave all matched students selected.
          </p>
          <p className={styles.gradeImportPreviewHelp}>
            Each course grade is saved as one standard grade record: student account ID, subject code and name, semester, school year, grade, and remarks. Year level and units are used for the preview and school-year calculation; they are not stored in the grade record.
          </p>
          {analysis.students.length > 0 && (
            <div className={styles.gradeImportPreviewTableWrap}>
              <table className={styles.gradeImportPreviewTable}>
                <thead>
                  <tr>
                    <th scope="col">Import</th>
                    <th scope="col">Student</th>
                    <th scope="col">Program</th>
                    <th scope="col">Published curriculum</th>
                    <th scope="col">Cohort start</th>
                    <th scope="col">Valid grades</th>
                    <th scope="col">Review items</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.students.map((student) => (
                    <tr key={student.userId}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Include ${student.name} in this import`}
                          checked={activeUserIds.includes(student.userId)}
                          disabled={!student.grades.length || busy || status === "success"}
                          onChange={() => toggleStudent(student.userId)}
                        />
                      </td>
                      <td>
                        <strong>{student.name}</strong>
                        <span>{student.studentId}</span>
                      </td>
                      <td>
                        <label className={styles.gradeImportProgramField}>
                          <span className={styles.srOnly}>Program for {student.name}</span>
                          <select
                            value={student.program}
                            onChange={(event) =>
                              {
                                setProgramOverrides((current) => ({
                                  ...current,
                                  [student.userId]: event.target.value,
                                }));
                                setCurriculumOverrides((current) => ({
                                  ...current,
                                  [student.userId]: "",
                                }));
                              }
                            }
                            disabled={busy || status === "success"}
                          >
                            <option value="">Choose a program</option>
                            {[...new Set([
                              student.program,
                              ...curricula.map((curriculum) => curriculum.program),
                            ].filter(Boolean))]
                              .sort((left, right) => left.localeCompare(right))
                              .map((program) => (
                                <option key={program} value={program}>
                                  {program}
                                </option>
                              ))}
                          </select>
                        </label>
                      </td>
                      <td>
                        <label className={styles.gradeImportCurriculumField}>
                          <span className={styles.srOnly}>Published curriculum for {student.name}</span>
                          <select
                            value={student.curriculumId}
                            onChange={(event) =>
                              setCurriculumOverrides((current) => ({
                                ...current,
                                [student.userId]: event.target.value,
                              }))
                            }
                            disabled={!student.program || busy || status === "success"}
                          >
                            <option value="">
                              {!student.program
                                ? "Choose a program first"
                                : curricula.some(
                                      (curriculum) =>
                                        String(curriculum.program || "").trim().toLowerCase() ===
                                            student.program.trim().toLowerCase() &&
                                          readCohortStartYear(curriculum.academicYear) ===
                                            student.cohortStartYear,
                                    )
                                    ? "Choose a published curriculum"
                                    : "No curriculum for this program and cohort"}
                            </option>
                            {curricula
                              .filter(
                                (curriculum) =>
                                  String(curriculum.program || "").trim().toLowerCase() ===
                                    student.program.trim().toLowerCase() &&
                                  readCohortStartYear(curriculum.academicYear) ===
                                    student.cohortStartYear,
                              )
                              .map((curriculum) => (
                                <option key={curriculum.id} value={curriculum.id}>
                                  {curriculum.title} · {curriculum.academicYear}
                                </option>
                              ))}
                          </select>
                        </label>
                        <span>{student.curriculum || "Curriculum unresolved"}</span>
                      </td>
                      <td>
                        {student.cohortStartYear ? `${student.cohortStartYear}-${student.cohortStartYear + 1}` : (
                          <label className={styles.gradeImportCohortField}>
                            <span className={styles.srOnly}>Cohort start year for {student.name}</span>
                            <input
                              type="number"
                              min="1900"
                              max="2200"
                              placeholder="e.g. 2023"
                              value={cohortOverrides[student.userId] || ""}
                              onChange={(event) =>
                                setCohortOverrides((current) => ({
                                  ...current,
                                  [student.userId]: event.target.value,
                                }))
                              }
                              disabled={busy || status === "success"}
                            />
                          </label>
                        )}
                      </td>
                      <td>{student.grades.length}</td>
                      <td>{student.issues.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {analysis.grades.length > 0 && (
            <details className={styles.gradeImportCourseDetails}>
              <summary>Preview {analysis.grades.length} course grades, school years, and units</summary>
              <div className={styles.gradeImportPreviewTableWrap}>
                <table className={styles.gradeImportPreviewTable}>
                  <thead>
                    <tr>
                      <th scope="col">Student</th>
                      <th scope="col">Course</th>
                      <th scope="col">Grade</th>
                      <th scope="col">Year / semester</th>
                      <th scope="col">School year</th>
                      <th scope="col">Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.grades.slice(0, 200).map((grade, index) => (
                      <tr key={`${grade.user_id}-${grade.subject_code}-${grade.school_year}-${grade.semester}-${index}`}>
                        <td>{grade.student_id}</td>
                        <td>{grade.subject_code} — {grade.subject_name}</td>
                        <td>{grade.grade}</td>
                        <td>{grade.year_level} / {grade.semester}</td>
                        <td>{grade.school_year}</td>
                        <td>{grade.units}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {analysis.grades.length > 200 && (
                  <p className={styles.gradeImportPreviewHelp}>Showing the first 200 course rows in this preview.</p>
                )}
              </div>
            </details>
          )}
        </section>
      )}

      {(errors.length > 0 || analysis.issues.length > 0) && (
        <div className={styles.gradeImportErrors} role="alert">
          <strong>Review these items before importing</strong>
          <div className={styles.gradeImportErrorList}>
            {[...errors, ...analysis.issues].slice(0, 20).map((error, index) => (
              <div key={`${error}-${index}`}>{error}</div>
            ))}
          </div>
          {[...errors, ...analysis.issues].length > 20 && <span>Showing the first 20 items.</span>}
          <span>Valid grades remain available for import; unresolved rows will not be saved.</span>
        </div>
      )}
      {status === "success" && !busy && (
        <div className={styles.gradeImportSuccess} role="status">
          <FiCheckCircle size={17} aria-hidden="true" /> Grades saved and prediction updates requested.
        </div>
      )}
      {selectedFile && status !== "success" && (
        <div className={styles.gradeImportActions}>
          <button
            type="button"
            className={styles.gradeImportCancelButton}
            onClick={cancelImport}
            disabled={busy}
          >
            Cancel import
          </button>
          <button
            type="button"
            className={styles.studentAccountImportButton}
            onClick={importGrades}
            disabled={busy || importRows.length === 0}
          >
            {busy && status === "processing"
              ? "Importing…"
              : `Import ${importRows.length} valid grades`}
          </button>
        </div>
      )}
    </div>
  );
};

export default ExcelGradeUploader;
