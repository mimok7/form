// Build a row array aligned to a given header list.
// fieldMap: { [headerLabel]: string | string[] } mapping to formData keys (priority order)
// If a header is not in fieldMap, we'll try the same header label as key in formData.
export function buildRowFromHeaders(headers = [], formData = {}, fieldMap = {}) {
  const norm = (s) => (s == null ? '' : String(s));
  const isEmailHeader = (h) => {
    const x = norm(h).trim().toLowerCase();
    return x === 'email' || x.includes('이메일');
  };
  return (headers || []).map((header) => {
    const h = norm(header);
    let candidates = fieldMap[h];
    if (!candidates) {
      // also try trimmed header
      candidates = fieldMap[h.trim()];
    }
    if (!candidates) {
      // default: try using header itself as a key
      candidates = [h.trim()];
    }
    if (!Array.isArray(candidates)) candidates = [candidates];
    // find first non-undefined value
    let val = '';
    for (const key of candidates) {
      if (key in (formData || {})) {
        val = formData[key];
        break;
      }
    }
    // Ensure Email-like columns are strings
    if (isEmailHeader(h)) return norm(val);
    return val == null ? '' : val;
  });
}
