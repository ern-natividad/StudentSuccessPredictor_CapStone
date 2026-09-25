import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { FiUploadCloud } from "react-icons/fi";
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

  const processFile = async (file) => {
    if (!file) return;
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      toast.error("Choose an .xlsx or .csv file.");
      return;
    }

    setBusy(true);
    setErrors([]);
    try {
      setProgress({ stage: "Reading workbook", value: 20 });
      const rawRows = await readWorkbook(file);
      if (rawRows.length === 0) throw new Error("The selected file has no data rows.");

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
      toast.success(`${result.count || parsedRows.length} grade rows saved for ${userCount} student${userCount === 1 ? "" : "s"}.`);
    } catch (error) {
      toast.error(error.message || "Unable to import grade records.");
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

  return (
    <div className={styles.contentCard}>
      <div className={styles.contentCardHeader}>
        <div>
          <div className={styles.contentCardEyebrow}>Batch grade intake</div>
          <div className={styles.contentCardTitle}>Import Excel or CSV grades</div>
          <div className={styles.contentCardHint}>
            Required columns: user_id, subject_code, subject_name, semester, school_year, grade. Current year: {getCurrentAcademicYear()}.
          </div>
        </div>
        <FiUploadCloud size={24} aria-hidden="true" />
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        disabled={busy}
        style={{
          width: "100%",
          minHeight: 120,
          marginTop: 16,
          border: `2px dashed ${dragging ? "#8b0000" : "#cbd5e1"}`,
          borderRadius: 10,
          background: dragging ? "#fff7f7" : "#f8fafc",
          color: "#334155",
          cursor: busy ? "wait" : "pointer",
          display: "grid",
          placeItems: "center",
          gap: 6,
        }}
      >
        <strong>{busy ? progress.stage : "Drop a file here or choose one"}</strong>
        <span style={{ fontSize: 12 }}>XLSX and CSV files up to 5,000 rows</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv"
        hidden
        onChange={(event) => processFile(event.target.files?.[0])}
      />
      {busy || progress.value > 0 ? (
        <progress value={progress.value} max="100" style={{ width: "100%", marginTop: 12 }} />
      ) : null}
      {errors.length > 0 && (
        <div style={{ marginTop: 12, color: "#b91c1c", fontSize: 13 }}>
          {errors.map((error) => <div key={error}>{error}</div>)}
        </div>
      )}
    </div>
  );
};

export default ExcelGradeUploader;