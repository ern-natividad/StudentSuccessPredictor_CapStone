import { useRef, useState } from "react";
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
import { useToast } from "../../../components/Common/Toast";
import {
  getCurrentAcademicYear,
  normalizeSchoolYear,
} from "../../../utils/gradeSemesterUtils";
import { normalizeGradeValue, remarksFromGrade } from "../../../utils/gradeValueUtils";
import styles from "../../../styles/Dashboard.module.css";

const REQUIRED_HEADERS = [
  "user_id",
  "subject_code",
  "subject_name",
  "semester",
  "school_year",
  "grade",
];

const HEADER_ALIASES = {
  userid: "user_id",
  studentid: "user_id",
  subjectcode: "subject_code",
  code: "subject_code",
  subject: "subject_name",
  subjectname: "subject_name",
  schoolyear: "school_year",
  academicyear: "school_year",
  remarks: "remarks",
};

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const normalizeRow = (source, rowNumber) => {
  const row = {};
  Object.entries(source).forEach(([key, value]) => {
    const canonical = HEADER_ALIASES[normalizeHeader(key)] || normalizeHeader(key);
    row[canonical] = typeof value === "string" ? value.trim() : value;
  });

  const normalizedGrade = normalizeGradeValue(row.grade);
  const normalizedSchoolYear = normalizeSchoolYear(row.school_year);
  const missing = REQUIRED_HEADERS.filter(
    (header) => !String(row[header] ?? "").trim(),
  );
  if (missing.length > 0) {
    throw new Error(`Row ${rowNumber}: missing ${missing.join(", ")}.`);
  }
  if (!normalizedGrade) {
    throw new Error(`Row ${rowNumber}: invalid grade "${row.grade}".`);
  }
  if (!/^\d{4}-\d{4}$/.test(normalizedSchoolYear)) {
    throw new Error(`Row ${rowNumber}: school_year must use YYYY-YYYY.`);
  }

  return {
    user_id: String(row.user_id).trim(),
    subject_code: String(row.subject_code).trim(),
    subject_name: String(row.subject_name).trim(),
    semester: String(row.semester).trim(),
    school_year: normalizedSchoolYear,
    grade: normalizedGrade,
    remarks: String(row.remarks || remarksFromGrade(normalizedGrade) || "").trim() || null,
  };
};

const readWorkbook = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) throw new Error("The workbook does not contain a worksheet.");
        resolve(XLSX.utils.sheet_to_json(sheet, { defval: "" }));
      } catch (error) {
        reject(new Error(error.message || "Unable to read the workbook."));
      }
    };
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsArrayBuffer(file);
  });

const ExcelGradeUploader = () => {
  const inputRef = useRef(null);
  const toast = useToast();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ stage: "", value: 0 });
  const [errors, setErrors] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [rowCount, setRowCount] = useState(0);
  const [status, setStatus] = useState("idle");

  const resetUpload = () => {
    setSelectedFile(null);
    setRowCount(0);
    setErrors([]);
    setProgress({ stage: "", value: 0 });
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      {
        user_id: "student-uuid",
        subject_code: "ENG101",
        subject_name: "Sample Subject",
        semester: "1",
        school_year: getCurrentAcademicYear(),
        grade: "1.75",
        remarks: "Pass",
      },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");
    XLSX.writeFile(workbook, "grade-import-template.xlsx");
  };

  const processFile = async (file) => {
    if (!file) return;
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      toast.error("Choose an .xlsx or .csv file.");
      return;
    }

    setBusy(true);
    setErrors([]);
    setSelectedFile(file);
    setStatus("processing");
    try {
      setProgress({ stage: "Reading workbook", value: 20 });
      const rawRows = await readWorkbook(file);
      if (rawRows.length === 0) throw new Error("The selected file has no data rows.");
      setRowCount(rawRows.length);

      setProgress({ stage: "Validating rows", value: 40 });
      const parsedRows = [];
      const rowErrors = [];
      rawRows.forEach((row, index) => {
        try {
          parsedRows.push(normalizeRow(row, index + 2));
        } catch (error) {
          rowErrors.push(error.message);
        }
      });
      if (rowErrors.length > 0) {
        setErrors(rowErrors.slice(0, 10));
        throw new Error(`${rowErrors.length} row${rowErrors.length === 1 ? "" : "s"} need correction.`);
      }

      setProgress({ stage: "Saving grades", value: 65 });
      const result = await api.importStudentGrades(parsedRows);
      setProgress({ stage: "Updating predictions", value: 90 });
      const userCount = result.user_ids?.length || new Set(parsedRows.map((row) => row.user_id)).size;
      setProgress({ stage: "Complete", value: 100 });
      setStatus("success");
      toast.success(`${result.count || parsedRows.length} grade rows saved for ${userCount} student${userCount === 1 ? "" : "s"}.`);
    } catch (error) {
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

  const statusLabel = {
    idle: "Ready for a file",
    processing: progress.stage || "Preparing import",
    success: "Import complete",
    error: "Needs attention",
  }[status];

  const StatusIcon = status === "success"
    ? FiCheckCircle
    : status === "error"
      ? FiAlertCircle
      : status === "processing"
        ? FiRefreshCw
        : FiUploadCloud;

  return (
    <div className={`${styles.contentCard} ${styles.gradeImportCard}`}>
      <div className={styles.gradeImportHeader}>
        <div className={styles.gradeImportTitleGroup}>
          <div className={styles.contentCardEyebrow}>Batch grade intake</div>
          <div className={styles.contentCardTitle}>Import Excel or CSV grades</div>
          <p className={styles.gradeImportDescription}>
            Upload one file to save grades for multiple students and refresh their predictions automatically.
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
          <span>Supports XLSX and CSV, up to 5,000 rows</span>
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
        disabled={busy}
        aria-label="Choose an Excel or CSV grade file"
      >
        <span className={styles.gradeImportIcon}><FiUploadCloud size={25} aria-hidden="true" /></span>
        <span className={styles.gradeImportDropTitle}>{busy ? progress.stage : "Drop your grade file here"}</span>
        <span className={styles.gradeImportDropHint}>or click to browse from your device</span>
        <span className={styles.gradeImportFormatHint}>Required: user_id, subject_code, subject_name, semester, school_year, grade</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv"
        hidden
        onChange={(event) => processFile(event.target.files?.[0])}
      />

      {selectedFile && (
        <div className={`${styles.gradeImportFile} ${status === "error" ? styles.gradeImportFileError : ""}`}>
          <div className={styles.gradeImportFileIcon}><FiFileText size={18} aria-hidden="true" /></div>
          <div className={styles.gradeImportFileDetails}>
            <strong>{selectedFile.name}</strong>
            <span>{(selectedFile.size / 1024).toFixed(1)} KB{rowCount ? ` · ${rowCount.toLocaleString()} rows detected` : ""}</span>
          </div>
          {!busy && (
            <button type="button" className={styles.gradeImportClearButton} onClick={resetUpload} aria-label="Remove selected file" title="Remove selected file">
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
      {errors.length > 0 && (
        <div className={styles.gradeImportErrors} role="alert">
          <strong>Correct these rows and try again</strong>
          <div className={styles.gradeImportErrorList}>
            {errors.map((error, index) => <div key={`${error}-${index}`}>{error}</div>)}
          </div>
          {errors.length === 10 && <span>Showing the first 10 errors.</span>}
        </div>
      )}
      {status === "success" && !busy && (
        <div className={styles.gradeImportSuccess} role="status">
          <FiCheckCircle size={17} aria-hidden="true" /> Grades saved and prediction updates requested.
        </div>
      )}
    </div>
  );
};

export default ExcelGradeUploader;