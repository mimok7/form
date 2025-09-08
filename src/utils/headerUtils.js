// Header utilities: case-insensitive lookups with synonyms

// Normalize header row to lowercased, trimmed strings
export const normalizeHeaders = (headers = []) =>
  (headers || []).map(h => (h || '').toString().trim().toLowerCase());

// Find index case-insensitively by trying multiple candidate names (exact match)
// candidates: string | string[]
export const findIndexCI = (headers = [], candidates) => {
  const lower = normalizeHeaders(headers);
  const candArr = Array.isArray(candidates) ? candidates : [candidates];
  for (const c of candArr) {
    const idx = lower.indexOf((c || '').toString().trim().toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
};

// Build an index map from logical keys to header indexes using provided synonyms map
// synonymsMap example: { code: ['코드','code'], amount: ['금액','amount'] }
export const buildIndexMap = (headers = [], synonymsMap = {}) => {
  const map = {};
  for (const key of Object.keys(synonymsMap)) {
    map[key] = findIndexCI(headers, synonymsMap[key]);
  }
  return map;
};
