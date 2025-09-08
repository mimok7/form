// CRA(dev) 전용 프록시: /api/append 요청을 Apps Script로 포워딩하며 토큰을 주입합니다.
// 개발환경에서만 동작(CRA dev server). 프로덕션은 Vercel의 /api/append 함수를 사용하세요.

let fetchFn = global.fetch;
if (!fetchFn) {
  try { fetchFn = require('node-fetch'); } catch (e) {
    // Will work after installing node-fetch@2 in dev
    throw new Error('Global fetch is unavailable. Install node-fetch (v2) or use Node >= 18.');
  }
}

module.exports = function(app) {
  console.log('[setupProxy] Loaded. Registering /api/append routes...');

  // Basic visibility for incoming calls
  app.use('/api/append', (req, _res, next) => {
    console.log(`[setupProxy] hit /api/append ${req.method} ${req.url}`);
    next();
  });

  // Health check endpoint
  app.all('/api/append/health', (req, res) => {
    return res.status(200).json({ ok: true, method: req.method, url: req.url });
  });

  app.get('/api/append', async (req, res) => {
    try {
      const targetUrl = process.env.REACT_APP_SHEET_APPEND_URL;
      const params = new URLSearchParams();
      if (req.query.sheet) params.set('sheet', req.query.sheet);
      if (req.query.range) params.set('range', req.query.range);

      // Try Apps Script first if configured
      let json = null;
      if (targetUrl) {
        try {
          const url = targetUrl + (params.toString() ? `?${params.toString()}` : '');
          const r = await fetchFn(url, { method: 'GET' });
          const text = await r.text();
          try { json = JSON.parse(text); } catch (_) { json = null; }
          if (json && json.values) {
            return res.status(r.status).json(json);
          }
        } catch (_) {
          // ignore and fallback
        }
      }

      // Fallback: read directly from Google Sheets API in dev
      const SHEET_ID = process.env.REACT_APP_SHEET_ID;
      const API_KEY = process.env.REACT_APP_API_KEY;
      const sheetName = req.query.sheet;
      const range = req.query.range;
      if (SHEET_ID && API_KEY && sheetName) {
        try {
          if (sheetName === '__names__') {
            const namesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`;
            const rr = await fetchFn(namesUrl, { method: 'GET' });
            const data = await rr.json();
            const names = (data.sheets || []).map(sh => sh.properties && sh.properties.title).filter(Boolean);
            return res.status(200).json({ values: [names] });
          }
          const encoded = encodeURIComponent(sheetName + (range ? `!${range}` : ''));
          const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encoded}?key=${API_KEY}`;
          const rr = await fetchFn(valuesUrl, { method: 'GET' });
          const data = await rr.json();
          return res.status(200).json({ values: data.values || [] });
        } catch (fallbackErr) {
          // fall through to original response
        }
      }
      // Default: if we had Apps Script JSON without values
      if (json) return res.status(200).json(json);
      return res.status(500).json({ error: 'No data available' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || 'internal error' });
    }
  });

  app.post('/api/append', async (req, res) => {
    try {
      const targetUrl = process.env.REACT_APP_SHEET_APPEND_URL;
      if (!targetUrl) return res.status(500).json({ error: 'Target URL not configured' });
      // Manual JSON parse to avoid requiring express.json()
      let raw = '';
      req.on('data', chunk => { raw += chunk; });
      req.on('end', async () => {
        try {
          let incoming = {};
          try { incoming = raw ? JSON.parse(raw) : {}; } catch (_) { incoming = {}; }
          if (!incoming.token) {
            const serverToken = process.env.REACT_APP_SHEET_APPEND_TOKEN;
            if (serverToken) incoming.token = serverToken;
          }
          const r = await fetchFn(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(incoming)
          });
          const text = await r.text();
          try { return res.status(r.status).json(JSON.parse(text)); } catch (_) { return res.status(r.status).send(text); }
        } catch (innerErr) {
          console.error(innerErr);
          return res.status(500).json({ error: innerErr.message || 'internal error' });
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || 'internal error' });
    }
  });
};
