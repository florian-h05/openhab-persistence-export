const pad = (n) => (n < 10 ? "0" + n : "" + n);

/**
 * Format a date as an ISO8601 string with local timezone offset, e.g. `2025-11-10T15:12:34+01:00`.
 * @param {Date} d
 * @return {string}
 */
export function formatLocalISO(d) {
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  const tzOffsetMin = -d.getTimezoneOffset(); // minutes east of UTC
  const sign = tzOffsetMin >= 0 ? "+" : "-";
  const absMin = Math.abs(tzOffsetMin);
  const tzHours = pad(Math.floor(absMin / 60));
  const tzMins = pad(absMin % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${tzHours}:${tzMins}`;
}

/**
 * Performs CSV field escaping that adheres to RFC 4180 (the standard specification for CSV files).
 * @param {string} s
 * @param {string} [delimiter]
 * @return {string}
 */
export function escapeCSVField(s, delimiter = ",") {
  if (s === null || s === undefined) return "";
  const str = String(s);

  const needsQuotes = new RegExp(`[${delimiter}"\r\n]`).test(str);

  if (needsQuotes) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Download a file from a Blob.
 * @param {string} filename
 * @param {Blob} blob
 */
export function downloadFile(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
