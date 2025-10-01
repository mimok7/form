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
      if (!targetUrl) {
        console.error('Target URL not configured');
        return res.status(500).json({ error: 'Target URL not configured' });
      }
      
      // Validate URL format
      if (!targetUrl.includes('script.google.com/macros/s/') || !targetUrl.endsWith('/exec')) {
        console.error('Invalid Google Apps Script URL format:', targetUrl);
        return res.status(500).json({ error: 'Invalid Apps Script URL format' });
      }

      const incoming = req.body && typeof req.body === 'object' ? { ...req.body } : {};
      
      // Debug logging
      console.log('Sync API called with body:', JSON.stringify(incoming));
      console.log('Target URL:', targetUrl);
      
      // Ensure action is set for sync operations
      if (!incoming.action) {
        incoming.action = 'syncMatchingSheets';
      }
      
      // Add token if not present
      if (!incoming.token) {
        const serverToken = process.env.SHEET_APPEND_TOKEN || process.env.REACT_APP_SHEET_APPEND_TOKEN || '';
        if (serverToken) {
          incoming.token = serverToken;
          console.log('Token added to request');
        } else {
          console.error('No token available');
          return res.status(500).json({ error: 'No authentication token configured' });
        }
      }

      console.log('Making request to Apps Script:', targetUrl);
      
      const r = await fetch(targetUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-Sync-API/1.0'
        },
        body: JSON.stringify(incoming),
        timeout: 30000 // 30 second timeout
      });
      
      console.log('Apps Script response status:', r.status);
      console.log('Apps Script response headers:', Object.fromEntries(r.headers.entries()));
      
      const text = await r.text();
      console.log('Apps Script response text (first 500 chars):', text.substring(0, 500));
      
      // Check if response is HTML (error page)
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        console.error('Received HTML response instead of JSON - Apps Script deployment issue');
        return res.status(502).json({ 
          success: false, 
          error: 'Apps Script returned HTML error page. Please check deployment and permissions.',
          hint: 'The Google Apps Script might not be deployed properly or permissions are missing.'
        });
      }
      
      try {
        const jsonResult = JSON.parse(text);
        console.log('Parsed JSON result:', jsonResult);
        return res.status(r.status).json(jsonResult);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.error('Raw response:', text);
        return res.status(502).json({ 
          success: false, 
          error: 'Apps Script response parsing failed',
          rawResponse: text.substring(0, 200),
          hint: 'The response from Google Apps Script is not valid JSON'
        });
      }
    }

    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'server error' });
  }
}

module.exports = handler;