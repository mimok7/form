// Vercel Serverless Function: /api/sync
// POST: Forward sync request to Apps Script sync endpoint

// Use global fetch in Node 18+ (Vercel) if available; fallback to node-fetch@2
let fetchImpl;
if (typeof globalThis.fetch === 'function') {
  fetchImpl = globalThis.fetch.bind(globalThis);
} else {
  try {
    fetchImpl = require('node-fetch');
  } catch (e) {
    throw new Error('fetch is unavailable. Use Node 18+ or add node-fetch.');
  }
}
const fetch = fetchImpl;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function handler(req, res) {
  setCors(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (req.method === 'POST') {
      const targetUrl = process.env.SHEET_APPEND_URL || process.env.REACT_APP_SHEET_APPEND_URL;
      if (!targetUrl) return res.status(500).json({ error: 'Target URL not configured' });

      const incoming = req.body && typeof req.body === 'object' ? { ...req.body } : {};
      if (!incoming.token) {
        const serverToken = process.env.SHEET_APPEND_TOKEN || process.env.REACT_APP_SHEET_APPEND_TOKEN || '';
        if (serverToken) incoming.token = serverToken;
      }

      const r = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incoming)
      });
      const text = await r.text();
      try {
        return res.status(r.status).json(JSON.parse(text));
      } catch (_) {
        return res.status(r.status).send(text);
      }
    }

    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'server error' });
  }
}

module.exports = handler;