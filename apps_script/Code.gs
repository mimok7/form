// Apps Script webapp to receive POST from client and append to appropriate sheet
// Production-ready: robust token handling, minimal logging (no token values), whitelist

const DEFAULT_SHEET = 'SH_M';
const LOG_SHEET = 'APPEND_LOG';

const SERVICE_SHEET_MAP = {
  hotel: 'SH_H',
  tour: 'SH_T',
  rcar: 'SH_RC',
  car: 'SH_C',
  cruise: 'SH_R',
  airport: 'SH_P',
  user: 'SH_M',
  users: 'SH_M'
};

function _getProp(key, fallback) {
  try { return PropertiesService.getScriptProperties().getProperty(key) || fallback; } catch (e) { return fallback; }
}

function _setScriptPropsForDeploy() {
  const DEFAULT_SCRIPT_PROPS = {
    'TARGET_SHEET_ID': 'YOUR_SPREADSHEET_ID',
  // Include both internal codes and human-friendly masters used by client reads
  'ALLOWED_SHEETS': 'SH_H,SH_T,SH_RC,SH_C,SH_R,SH_P,SH_M,hotel,car,rcar,room,tour',
    'ALLOWED_TOKEN': 'REPLACE_WITH_GLOBAL_TOKEN',
    'TOKEN_CRUISE': '',
    'TOKEN_CAR': '',
    'TOKEN_RCAR': '',
    'TOKEN_HOTEL': '',
    'TOKEN_USER': ''
  };
  PropertiesService.getScriptProperties().setProperties(DEFAULT_SCRIPT_PROPS);
  return ContentService.createTextOutput(JSON.stringify({ success:true, set: Object.keys(DEFAULT_SCRIPT_PROPS) })).setMimeType(ContentService.MimeType.JSON);
}

function _log(ss, service, sheetName, row, ok, msg) {
  try {
    let log = ss.getSheetByName(LOG_SHEET);
    if (!log) {
      log = ss.insertSheet(LOG_SHEET);
      log.appendRow(['timestamp','service','sheet','ok','message','row_preview']);
    }
    const preview = Array.isArray(row) ? JSON.stringify(row).slice(0,1000) : String(row);
    log.appendRow([new Date(), service||'', sheetName||'', ok ? 'OK' : 'ERR', msg||'', preview]);
  } catch (e) { console.error('log failed', e); }
}

function doPost(e) {
  try {
    let body = {};
    try { body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {}; } catch (err) { return _json({ success:false, error:'invalid json' }); }

    // Support action-based shortcuts for saving to Drive and sending email
    const action = (body.action || '').toString().trim();
    if(action === 'saveToDrive' || body.driveId){
      try{
        const driveId = body.driveId;
        const filename = body.filename || 'reservation.html';
        const content = body.content || '';
        const url = saveToDrive(driveId, filename, content);
        return _json({ success:true, url });
      }catch(err){ return _json({ success:false, error: err && err.message ? err.message : String(err) }); }
    }
    if(action === 'sendReservationEmail' || body.to){
      try{
        const result = sendReservationEmail(body);
        return _json({ success:true, result });
      }catch(err){ return _json({ success:false, error: err && err.message ? err.message : String(err) }); }
    }

    // Fallback: original append-row behavior
    const payload = body || {};
    const service = (payload.service || '').toString().toLowerCase();
    const row = payload.row || [];

    const targetId = _getProp('TARGET_SHEET_ID', _getProp('REACT_APP_SHEET_ID', ''));
    if (!targetId) return _json({ success:false, error:'no target sheet id' });

    let ss;
    try { ss = SpreadsheetApp.openById(targetId); } catch (errOpen) { return _json({ success:false, error: 'openById failed' }); }

    if (!service || !SERVICE_SHEET_MAP.hasOwnProperty(service)) { _log(ss, service, '', row, false, 'unknown service'); return _json({ success:false, error:'unknown service' }); }
    const sheetName = SERVICE_SHEET_MAP[service];

    const allowedSheetsProp = _getProp('ALLOWED_SHEETS', 'SH_H,SH_T,SH_RC,SH_C,SH_R,SH_P,SH_M');
    const allowed = allowedSheetsProp.split(',').map(s=>s.trim());
    if (allowed.indexOf(sheetName) === -1) { _log(ss, service, sheetName, row, false, 'forbidden sheet'); return _json({ success:false, error:'forbidden sheet' }); }

    // header detection (case-insensitive) and support X-Api-Key
    let headerAuth = '';
    if (e.headers) {
      for (var hk in e.headers) {
        if (!e.headers.hasOwnProperty(hk)) continue;
        var lk = hk.toString().toLowerCase();
        if (lk === 'authorization' || lk === 'x-api-key') { headerAuth = e.headers[hk]; break; }
      }
    }
    var headerToken = '';
    if (headerAuth) { var m = headerAuth.match(/Bearer\s+(.+)/i); headerToken = m ? m[1] : headerAuth; }

    var token = (headerToken || (e.parameter && e.parameter.token) || payload.token || '').toString().trim();
    token = token.replace(/^['\"]|['\"]$/g, '').trim();
    const serviceTokenProp = (_getProp('TOKEN_' + service.toUpperCase(), '') || '').toString().trim();
    const globalToken = (_getProp('ALLOWED_TOKEN', '') || '').toString().trim();
    const expected = globalToken || serviceTokenProp;
    if (!expected) { _log(ss, service, sheetName, row, false, 'no expected token configured'); return _json({ success:false, error:'invalid token' }); }
    if (token.length === 0 || token !== expected) { _log(ss, service, sheetName, row, false, 'invalid token'); return _json({ success:false, error:'invalid token' }); }

    if (!Array.isArray(row) || row.length === 0) { _log(ss, service, sheetName, row, false, 'invalid row'); return _json({ success:false, error:'invalid row' }); }

    try {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) { _log(ss, service, sheetName, row, false, 'sheet not found'); return _json({ success:false, error:'sheet not found' }); }
      sheet.appendRow(row);
      _log(ss, service, sheetName, row, true, 'appended');
      return _json({ success:true });
    } catch (err) { _log(ss, service, sheetName, row, false, err.message); return _json({ success:false, error:err.message }); }

  } catch (errOuter) { Logger.log('doPost unexpected error: %s', errOuter); return _json({ success:false, error: 'server error' }); }
}

function doGet(e) {
  try {
    // Health/diagnostic probe: doGet?probe=tokenlen
    const probe = (e && e.parameter && e.parameter.probe) ? e.parameter.probe.toString() : '';
    if (probe === 'tokenlen') {
      const globalToken = (_getProp('ALLOWED_TOKEN', '') || '').toString();
      const hasGlobal = globalToken && globalToken.trim().length > 0;
      return _json({ success: true, probe: 'tokenlen', hasGlobal: !!hasGlobal, globalLen: hasGlobal ? globalToken.trim().length : 0, time: new Date() });
    }

    // If a sheet query is provided, return that sheet's values (safe: only allowed sheets)
    const sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet.toString() : '';
    const range = (e && e.parameter && e.parameter.range) ? e.parameter.range.toString() : '';
    if (sheetName) {
      const allowedSheetsProp = _getProp('ALLOWED_SHEETS', 'SH_H,SH_T,SH_RC,SH_C,SH_R,SH_P,SH_M');
      const allowed = allowedSheetsProp.split(',').map(s=>s.trim()).filter(Boolean);
      const targetId = _getProp('TARGET_SHEET_ID', _getProp('REACT_APP_SHEET_ID', ''));
      if (!targetId) return _json({ success:false, error:'no target sheet id' });
      try {
        const ss = SpreadsheetApp.openById(targetId);

        // Special virtual sheet: __names__ -> return list of sheet names
        if (sheetName === '__names__') {
          const names = ss.getSheets().map(sh => sh.getName());
          // Normalize response shape to align with client expectations: values[0] is list of names
          return _json({ success: true, values: [names] });
        }

        if (allowed.indexOf(sheetName) === -1) return _json({ success:false, error:'forbidden sheet' });
        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) return _json({ success:false, error:'sheet not found' });
        const data = range ? sheet.getRange(range).getValues() : sheet.getDataRange().getValues();
        return _json({ success:true, values: data });
      } catch (e) {
        return _json({ success:false, error: 'openById or read failed' });
      }
    }
    return _json({ success: true, time: new Date(), info: 'Apps Script webapp ready' });
  } catch (err) { return _json({ success: false, error: err.message }); }
}

function _json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

// --- Additional helpers for Drive save and email send ---
function saveToDrive(driveId, filename, content){
  if(!driveId) throw new Error('driveId required');
  const folder = DriveApp.getFolderById(driveId);
  if(!folder) throw new Error('folder not found');
  const blob = Utilities.newBlob(content, 'text/html', filename);
  const file = folder.createFile(blob);
  return file.getUrl();
}

function sendReservationEmail(body){
  const to = (body.to || '').toString().trim();
  if(!to) throw new Error('to required');
  const subject = body.subject || '예약 확인서';
  const html = body.bodyHtml || '';
  const text = body.bodyText || '예약 확인서를 송부드립니다.';
  const filename = body.filename || 'reservation.html';
  const attachment = Utilities.newBlob(html, 'text/html', filename);
  GmailApp.sendEmail(to, subject, text, { htmlBody: html, attachments: [attachment] });
  return 'sent';
}
