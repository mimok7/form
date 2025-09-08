const fetch = require('node-fetch');
require('dotenv').config({ path: __dirname + '/../.env' });

const useProxy = process.env.REACT_APP_USE_PROXY === 'true';
const proxyBase = process.env.REACT_APP_DEV_PROXY_HOST || 'http://localhost:3001';
const appendUrl = process.env.REACT_APP_SHEET_APPEND_URL;

const sheets = [
  'SH_R','SH_C','SH_CC','SH_P','SH_T','SH_H','SH_RC',
  'room','car','rcar','tour','hotel','user','cruise','airport'
];

async function fetchHeader(sheet) {
  try {
    const url = useProxy ? `${proxyBase}/api/append?sheet=${encodeURIComponent(sheet)}&range=1:1` : `${appendUrl}?sheet=${encodeURIComponent(sheet)}&range=1:1`;
    const res = await fetch(url, { method: 'GET' });
    const text = await res.text();
    // try parse JSON
    try {
      const j = JSON.parse(text);
      if (j && Array.isArray(j.values) && j.values.length) return j.values[0];
      return j.values || [];
    } catch (e) {
      // not JSON, return raw text
      return text;
    }
  } catch (e) {
    return { error: e.message };
  }
}

(async () => {
  const out = {};
  for (const s of sheets) {
    process.stdout.write(`Fetching header for ${s}... `);
    const hdr = await fetchHeader(s);
    out[s] = hdr;
    console.log('done');
  }
  console.log('\n==== Headers (sheet -> header row) ====');
  console.log(JSON.stringify(out, null, 2));
})();
