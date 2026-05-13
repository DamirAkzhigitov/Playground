/**
 * Reduce Excel / Sheets formula-injection risk when a user opens an export.
 * Values that start with formula trigger characters are forced to text by a leading apostrophe.
 */
export function neutralizeSpreadsheetCell(
  value: string | number | null
): string | number | null {
  if (value === null || typeof value === 'number') {
    return value
  }
  const s = value
  if (s.length === 0) {
    return s
  }
  if (/^[=+\-@\t\r|]/.test(s)) {
    return `'${s}`
  }
  return s
}
