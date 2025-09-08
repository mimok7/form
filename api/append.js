// Vercel Serverless Function: /api/append
// - GET: Read from Google Sheets API (sheet headers/values)
// - POST: Forward to Apps Script append endpoint with server-injected token

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function handler(req, res) {
  setCors(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (req.method === 'GET') {
      const SHEET_ID = process.env.SHEET_ID || process.env.REACT_APP_SHEET_ID || '';
      const API_KEY = process.env.SHEETS_API_KEY || process.env.REACT_APP_API_KEY || '';
      if (!SHEET_ID || !API_KEY) {
        return res.status(400).json({ error: 'Missing SHEET_ID or API_KEY' });
      }

      const sheet = (req.query.sheet || '').toString();
      const range = (req.query.range || '').toString();
      const namesOnly = sheet === '__names__' || req.query.names === '1';

      if (namesOnly) {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`;
        const r = await fetch(url, { method: 'GET' });
        const data = await r.json();
        const names = (data.sheets || []).map(s => s.properties && s.properties.title).filter(Boolean);
        return res.status(200).json({ values: [names] });
      }

      if (!sheet) return res.status(400).json({ error: 'Missing sheet' });
      const a1 = range ? `${sheet}!${range}` : sheet;
      const enc = encodeURIComponent(a1);
      const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${enc}?key=${API_KEY}`;
      const r = await fetch(valuesUrl, { method: 'GET' });
      const data = await r.json();
      return res.status(200).json({ values: data.values || [] });
    }

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
      try { return res.status(r.status).json(JSON.parse(text)); } catch (_) { return res.status(r.status).send(text); }
    }

    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'server error' });
  }
}

module.exports = handler;
