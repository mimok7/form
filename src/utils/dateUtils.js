// Lightweight date parsing utilities to normalize various formats to ISO (YYYY-MM-DD)
export function parseToIso(val) {
  if (val === null || val === undefined) return '';
  const s = ('' + val).toString().trim();
  if (!s) return '';
  // Already ISO-ish
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Excel serial number (common when exporting from sheets) - treat as number
  if (!isNaN(s) && s.length <= 7) {
    // Excel counts from 1899-12-30
    const excelBase = new Date(Date.UTC(1899, 11, 30));
    const days = Number(s);
    const d = new Date(excelBase.getTime() + days * 24 * 3600 * 1000);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }

  // Common US format MM/DD/YYYY or M/D/YYYY or with hyphens
  let parts = null;
  if (s.includes('/')) parts = s.split('/');
  else if (s.includes('-')) parts = s.split('-');

  if (parts && parts.length === 3) {
    const [p1, p2, p3] = parts.map((p) => p.trim());
    // Expect month/day/year ordering for common US-style strings
    if (/^\d{1,2}$/.test(p1) && /^\d{1,2}$/.test(p2) && /^\d{4}$/.test(p3)) {
      const mm = String(p1).padStart(2, '0');
      const dd = String(p2).padStart(2, '0');
      const yyyy = p3;
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // Try Date constructor (ISO extended, or other local formats)
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  // Fallback: return raw trimmed string (so comparisons won't match dates)
  return s;
}

// Return Date object (local, normalized to midnight) or null
export function parseToDate(val) {
  const iso = parseToIso(val);
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}
