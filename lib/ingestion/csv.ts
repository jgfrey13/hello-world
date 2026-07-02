/**
 * Minimal RFC-4180 CSV parser (quoted fields, escaped quotes, CRLF) — no
 * dependency, fully unit-tested. Returns rows of raw string cells; header
 * handling is the caller's job.
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++; // escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    switch (char) {
      case '"':
        inQuotes = true;
        break;
      case ",":
        row.push(cell);
        cell = "";
        break;
      case "\r":
        break; // handled by the following \n (or ignored)
      case "\n":
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
        break;
      default:
        cell += char;
    }
  }
  // Trailing cell/row without a final newline.
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** Parse with a header row into keyed records (keys lowercased/trimmed). */
export function parseCsvRecords(input: string): {
  header: string[];
  records: Record<string, string>[];
} {
  const rows = parseCsv(input).filter(
    (cells) => !(cells.length === 1 && cells[0].trim() === ""),
  );
  if (rows.length === 0) return { header: [], records: [] };
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const records = rows.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key] = (cells[index] ?? "").trim();
    });
    return record;
  });
  return { header, records };
}
