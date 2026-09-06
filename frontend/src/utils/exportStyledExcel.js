import ExcelJS from "exceljs";

const COLORS = {
  maroon: "FF8B0000",
  muted: "FF64748B",
  text: "FF1E293B",
  white: "FFFFFFFF",
  border: "FFCBD5E1",
  zebra: "FFF8FAFC",
  pass: "FF166534",
  fail: "FFB91C1C",
  medium: "FFB45309",
};

const thinBorder = {
  top: { style: "thin", color: { argb: COLORS.border } },
  left: { style: "thin", color: { argb: COLORS.border } },
  bottom: { style: "thin", color: { argb: COLORS.border } },
  right: { style: "thin", color: { argb: COLORS.border } },
};

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const applyCellFont = (cell, options = {}) => {
  cell.font = {
    name: "Calibri",
    size: options.size || 11,
    bold: Boolean(options.bold),
    color: { argb: options.color || COLORS.text },
  };
};

/**
 * Download a professionally styled Excel workbook.
 */
export const downloadStyledExcel = async ({
  fileName,
  sheetName = "Report",
  title,
  subtitle = "WMSU HAWKS · Student Success Predictor",
  meta = [],
  columns = [],
  rows = [],
}) => {
  if (!columns.length) {
    throw new Error("Export columns are required.");
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "WMSU HAWKS Student Success Predictor";
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: false }],
  });

  const lastCol = columns.length;

  sheet.mergeCells(1, 1, 1, lastCol);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  applyCellFont(titleCell, { size: 16, bold: true, color: COLORS.maroon });
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 26;

  sheet.mergeCells(2, 1, 2, lastCol);
  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = subtitle;
  applyCellFont(subtitleCell, { size: 10, color: COLORS.muted });
  sheet.getRow(2).height = 18;

  let currentRow = 3;

  const metaRows = [
    ...meta,
    {
      label: "Generated",
      value: new Date().toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    },
  ];

  metaRows.forEach(({ label, value }) => {
    sheet.mergeCells(currentRow, 1, currentRow, lastCol);
    const cell = sheet.getCell(currentRow, 1);
    cell.value = `${label}: ${value ?? "—"}`;
    applyCellFont(cell, { size: 10, color: COLORS.muted });
    sheet.getRow(currentRow).height = 16;
    currentRow += 1;
  });

  currentRow += 1;

  const headerRowIndex = currentRow;
  const headerRow = sheet.getRow(headerRowIndex);
  headerRow.height = 22;

  columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.header;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.maroon },
    };
    applyCellFont(cell, { size: 11, bold: true, color: COLORS.white });
    cell.alignment = {
      vertical: "middle",
      horizontal: column.align || "left",
      wrapText: true,
    };
    cell.border = thinBorder;
  });

  currentRow += 1;

  rows.forEach((rowData, rowIndex) => {
    const excelRow = sheet.getRow(currentRow);
    excelRow.height = 20;
    const isZebra = rowIndex % 2 === 1;

    columns.forEach((column, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1);
      const rawValue = Array.isArray(rowData)
        ? rowData[colIndex]
        : rowData?.[column.key ?? column.header];

      cell.value =
        rawValue === null || rawValue === undefined || rawValue === ""
          ? "—"
          : rawValue;

      applyCellFont(cell, { size: 11, color: COLORS.text });
      cell.alignment = {
        vertical: "middle",
        horizontal: column.align || "left",
        wrapText: Boolean(column.wrap),
      };
      cell.border = thinBorder;

      if (isZebra) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: COLORS.zebra },
        };
      }

      const headerLower = String(column.header || "").toLowerCase();
      const valueLower = String(cell.value ?? "").toLowerCase();
      if (
        headerLower.includes("remark") ||
        headerLower.includes("risk") ||
        headerLower.includes("status")
      ) {
        if (
          valueLower === "pass" ||
          valueLower === "low" ||
          valueLower === "accepted"
        ) {
          cell.font = {
            name: "Calibri",
            size: 11,
            bold: true,
            color: { argb: COLORS.pass },
          };
        } else if (
          valueLower === "fail" ||
          valueLower === "high" ||
          valueLower === "critical" ||
          valueLower === "rejected"
        ) {
          cell.font = {
            name: "Calibri",
            size: 11,
            bold: true,
            color: { argb: COLORS.fail },
          };
        } else if (valueLower === "medium" || valueLower === "inc") {
          cell.font = {
            name: "Calibri",
            size: 11,
            bold: true,
            color: { argb: COLORS.medium },
          };
        }
      }
    });

    currentRow += 1;
  });

  columns.forEach((column, index) => {
    const col = sheet.getColumn(index + 1);
    if (column.width) {
      col.width = column.width;
      return;
    }

    let maxLen = String(column.header || "").length;
    rows.forEach((rowData) => {
      const value = Array.isArray(rowData)
        ? rowData[index]
        : rowData?.[column.key ?? column.header];
      maxLen = Math.max(maxLen, String(value ?? "").length);
    });
    col.width = Math.min(42, Math.max(10, maxLen + 2));
  });

  sheet.views = [
    {
      state: "frozen",
      ySplit: headerRowIndex,
      showGridLines: false,
    },
  ];

  if (rows.length > 0) {
    sheet.autoFilter = {
      from: { row: headerRowIndex, column: 1 },
      to: { row: headerRowIndex + rows.length, column: lastCol },
    };
  }

  currentRow += 1;
  sheet.mergeCells(currentRow, 1, currentRow, lastCol);
  const footer = sheet.getCell(currentRow, 1);
  footer.value =
    "Confidential academic record · Western Mindanao State University — College of Engineering and Technology";
  applyCellFont(footer, { size: 9, color: COLORS.muted });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, fileName);
};
