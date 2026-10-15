const toPdfText = (value) =>
  String(value ?? "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const buildPageContent = (records, pageNumber, pageCount) => {
  const lines = [
    "Pre-Enrollment Degree Recommendation History",
    `Generated: ${new Date().toLocaleString()}`,
    `Page ${pageNumber} of ${pageCount}`,
    "",
    ...records.flatMap((record, index) => [
      `${index + 1}. Applicant ID: ${record.applicantId}`,
      `   Name: ${record.name}`,
      `   Program: ${record.program}`,
      `   Composite Score: ${record.confidence === null ? "N/A" : `${record.confidence}%`}`,
      `   Status: ${record.status}`,
      "",
    ]),
  ];

  return [
    "BT",
    "/F1 10 Tf",
    "50 760 Td",
    ...lines.flatMap((line, index) => [
      index === 0 ? `(${toPdfText(line)}) Tj` : `0 -13 Td (${toPdfText(line)}) Tj`,
    ]),
    "ET",
  ].join("\n");
};

export const downloadRecommendationPdf = (records) => {
  if (!records.length) {
    throw new Error("No recommendation records are available to export.");
  }

  const pageSize = 10;
  const pageCount = Math.ceil(records.length / pageSize);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${records
      .filter((_, index) => index % pageSize === 0)
      .map((_, index) => `${4 + index * 2} 0 R`)
      .join(" ")}] /Count ${pageCount} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const pageObjectId = 4 + pageIndex * 2;
    const contentObjectId = pageObjectId + 1;
    const pageRecords = records.slice(
      pageIndex * pageSize,
      (pageIndex + 1) * pageSize,
    );
    const content = buildPageContent(pageRecords, pageIndex + 1, pageCount);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
    );
    objects.push(
      `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`,
    );
  }

  const encoder = new TextEncoder();
  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];
  let byteLength = encoder.encode(chunks[0]).length;

  objects.forEach((object, index) => {
    offsets.push(byteLength);
    const serialized = `${index + 1} 0 obj\n${object}\nendobj\n`;
    chunks.push(serialized);
    byteLength += encoder.encode(serialized).length;
  });

  const xrefOffset = byteLength;
  const xref = [
    `xref\n0 ${objects.length + 1}\n`,
    "0000000000 65535 f \n",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`,
    `startxref\n${xrefOffset}\n%%EOF`,
  ].join("");
  chunks.push(xref);

  const link = document.createElement("a");
  const url = URL.createObjectURL(
    new Blob(chunks, { type: "application/pdf" }),
  );
  link.href = url;
  link.download = "pre-enrollment-recommendations.pdf";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
