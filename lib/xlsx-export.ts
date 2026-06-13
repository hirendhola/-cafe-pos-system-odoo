import * as XLSX from "xlsx";

import type { CsvColumn } from "./csv";

const NUMERIC_PATTERN = /^-?\d+(\.\d+)?$/;

/**
 * Converts a numeric-looking formatted string (e.g. from `toFixed(2)`) back into a
 * real number so currency/quantity columns stay sortable and summable in Excel.
 */
function toCellValue(raw: string | number | null | undefined): string | number {
  if (typeof raw === "number") return raw;
  const str = raw === null || raw === undefined ? "" : String(raw);
  return NUMERIC_PATTERN.test(str) ? Number(str) : str;
}

export function downloadXlsx<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
  sheetName = "Sheet1",
) {
  const data = rows.map((row) => {
    const out: Record<string, string | number> = {};
    for (const col of columns) {
      out[col.label] = toCellValue(col.format ? col.format(row) : (row[col.key] as string | number | null | undefined));
    }
    return out;
  });

  const worksheet = XLSX.utils.json_to_sheet(data, { header: columns.map((col) => col.label) });
  worksheet["!cols"] = columns.map((col) => ({ wch: Math.max(col.label.length + 2, 12) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}
