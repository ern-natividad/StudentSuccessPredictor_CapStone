import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiFileText,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { api } from "../../../services/api";
import { useToast } from "../../../components/Common/Toast";
import styles from "../../../styles/Dashboard.module.css";
import commonStyles from "../../../styles/Common.module.css";

const FIELDS = [
  "student_id",
  "first_name",
  "last_name",
  "email",
  "department",
  "program",
  "section",
  "year_level",
];

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const HEADER_ALIASES = {
  studentid: "student_id",
  firstname: "first_name",
  lastname: "last_name",
  email: "email",
  department: "department",
  program: "program",
  section: "section",
  yearlevel: "year_level",
};

const readWorkbook = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) throw new Error("The workbook has no worksheet.");
        resolve(XLSX.utils.sheet_to_json(sheet, { defval: "" }));
      } catch (error) {
        reject(new Error(error.message || "Unable to read the selected file."));
      }
    };
    reader.onerror = () =>
      reject(new Error("Unable to read the selected file."));
    reader.readAsArrayBuffer(file);
  });

const normalizeRows = (sourceRows) =>
  sourceRows.map((source) => {
    const values = {};
    Object.entries(source).forEach(([header, value]) => {
      const canonical = HEADER_ALIASES[normalizeHeader(header)];
      if (canonical) values[canonical] = String(value ?? "").trim();
    });
    return Object.fromEntries(
      FIELDS.map((field) => [field, values[field] || ""]),
    );
  });

const StudentAccountUploader = ({ onImported }) => {
  const inputRef = useRef(null);
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [students, setStudents] = useState([]);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const clearFile = () => {
    setSelectedFile(null);
    setStudents([]);
    setPreview(null);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const processFile = async (file) => {
    if (!file) return;
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      toast.error("Choose a CSV or Excel file.");
      return;
    }

    setBusy(true);
    setError("");
    setPreview(null);
    setResult(null);
    setSelectedFile(file);
    try {
      const sourceRows = await readWorkbook(file);
      if (sourceRows.length === 0)
        throw new Error("The file has no student rows.");
      const normalizedRows = normalizeRows(sourceRows);
      setStudents(normalizedRows);
      const serverPreview = await api.previewStudentAccounts(normalizedRows);
      setPreview(serverPreview);
      if (serverPreview.issues.length > 0) {
        toast.error("Review the student rows with errors before importing.");
      } else {
        toast.success(
          `${serverPreview.validCount} student rows are ready to import.`,
        );
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to preview student accounts.");
      toast.error(
        requestError.message || "Unable to preview student accounts.",
      );
    } finally {
      setBusy(false);
    }
  };

  const importAccounts = async () => {
    if (!students.length || !preview || preview.issues.length > 0) return;
    setBusy(true);
    setError("");
    try {
      const importResult = await api.importStudentAccounts(students);
      setResult(importResult);
      if (importResult.createdCount > 0) await onImported?.();
      if (importResult.failedCount > 0) {
        toast.error(
          `${importResult.createdCount} created; ${importResult.failedCount} need attention.`,
        );
      } else {
        toast.success(`${importResult.createdCount} student accounts created.`);
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to import student accounts.");
      toast.error(requestError.message || "Unable to import student accounts.");
    } finally {
      setBusy(false);
    }
  };

  const canImport =
    !busy &&
    students.length > 0 &&
    preview?.issues.length === 0 &&
    preview.validCount === students.length;

  return (
    <section className={`${styles.contentCard} ${styles.gradeImportCard}`}>
      <div className={styles.gradeImportHeader}>
        <div className={styles.gradeImportTitleGroup}>
          <div className={styles.contentCardEyebrow}>Account setup</div>
          <div className={styles.contentCardTitle}>Import student accounts</div>
          <p className={styles.gradeImportDescription}>
            Import the eight student profile columns. Test-only .test emails
            cannot receive messages or sign in. Leave passwords out of the file.
          </p>
        </div>
        <span
          className={`${styles.gradeImportStatus} ${busy ? styles.gradeImportStatusProcessing : ""}`}
        >
          {busy ? "Checking file" : "Admin only"}
        </span>
      </div>

      <div className={styles.gradeImportToolbar}>
        <div className={styles.gradeImportRequirements}>
          <FiFileText size={15} aria-hidden="true" />
          <span>
            CSV or XLSX · student ID, name, email, program, section, year
          </span>
        </div>
        <button
          type="button"
          className={styles.gradeImportTemplateButton}
          onClick={() => {
            const sheet = XLSX.utils.json_to_sheet([
              {
                student_id: "STU-2023-001",
                first_name: "Sample",
                last_name: "Student One",
                email: "student001@hawkpredict-demo.test",
                department: "Engineering",
                program: "BS Agricultural and Biosystems Engineering",
                section: "DEMO-1A",
                year_level: "4th Year",
              },
            ]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, sheet, "Students");
            XLSX.writeFile(workbook, "student-account-import-template.xlsx");
          }}
          disabled={busy}
        >
          Download template
        </button>
      </div>

      <label
        className={`${styles.gradeImportDropzone} ${busy ? styles.gradeImportDropzoneBusy : ""}`}
      >
        <span className={styles.gradeImportIcon}>
          <FiUploadCloud size={22} aria-hidden="true" />
        </span>
        <span className={styles.gradeImportDropTitle}>
          {busy ? "Checking student rows…" : "Choose a student account file"}
        </span>
        <span className={styles.gradeImportDropHint}>
          CSV or Excel workbook
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          hidden
          disabled={busy}
          onChange={(event) => processFile(event.target.files?.[0])}
        />
      </label>

      {selectedFile && (
        <div className={styles.gradeImportFile}>
          <div className={styles.gradeImportFileIcon}>
            <FiFileText size={18} aria-hidden="true" />
          </div>
          <div className={styles.gradeImportFileDetails}>
            <strong>{selectedFile.name}</strong>
            <span>{students.length} student rows</span>
          </div>
          <button
            type="button"
            className={styles.gradeImportClearButton}
            aria-label="Remove selected student file"
            title="Remove file"
            disabled={busy}
            onClick={clearFile}
          >
            <FiX size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {preview && (
        <div
          className={
            preview.issues.length
              ? styles.gradeImportErrors
              : styles.gradeImportSuccess
          }
          role="status"
        >
          {preview.issues.length ? (
            <FiAlertCircle size={17} />
          ) : (
            <FiCheckCircle size={17} />
          )}
          <span>
            {preview.validCount} of {preview.totalCount} rows are ready.
          </span>
        </div>
      )}

      {preview && students.length > 0 && (
        <div className={commonStyles.tableWrapper} style={{ marginTop: 12 }}>
          <table className={commonStyles.table}>
            <thead className={commonStyles.tableHead}>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Program</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              {students.slice(0, 5).map((student) => (
                <tr
                  className={commonStyles.tableRow}
                  key={student.student_id || student.email}
                >
                  <td>{student.student_id || "-"}</td>
                  <td>
                    {`${student.first_name} ${student.last_name}`.trim() || "-"}
                  </td>
                  <td>{student.email || "-"}</td>
                  <td>{student.program || "-"}</td>
                  <td>{student.year_level || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length > 5 && (
            <div
              className={styles.gradeImportRequirements}
              style={{ padding: 10 }}
            >
              Showing 5 of {students.length} rows.
            </div>
          )}
        </div>
      )}

      {preview?.issues.length > 0 && (
        <div className={styles.gradeImportErrors} role="alert">
          <strong>Fix these rows before importing</strong>
          {preview.issues.slice(0, 10).map((issue) => (
            <div key={`${issue.rowNumber}-${issue.studentId || issue.email}`}>
              Row {issue.rowNumber ?? "file"}: {issue.errors.join(", ")}
            </div>
          ))}
          {preview.issues.length > 10 && (
            <span>Showing the first 10 of {preview.issues.length} issues.</span>
          )}
        </div>
      )}

      {error && (
        <div className={styles.gradeImportErrors} role="alert">
          {error}
        </div>
      )}

      {result && (
        <div
          className={
            result.failedCount
              ? styles.gradeImportErrors
              : styles.gradeImportSuccess
          }
          role="status"
        >
          {result.createdCount} created; {result.failedCount} failed.
          {result.failed.slice(0, 5).map((item) => (
            <div key={`${item.row}-${item.student_id || item.email}`}>
              Row {item.row}: {item.errors.join(", ")}
            </div>
          ))}
        </div>
      )}

      <div
        className={styles.gradeImportProgressMeta}
        style={{ justifyContent: "flex-end", marginTop: 14 }}
      >
        <button
          type="button"
          className={styles.studentAccountImportButton}
          disabled={!canImport}
          onClick={importAccounts}
        >
          {busy ? "Working…" : `Create ${preview?.validCount || 0} accounts`}
        </button>
      </div>
    </section>
  );
};

export default StudentAccountUploader;
