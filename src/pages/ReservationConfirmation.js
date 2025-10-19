import React, { useEffect, useMemo, useState } from 'react';
import { fetchSheetData } from '../utils/googleSheets';

// 단일 새 템플릿과 새로운 키 스키마로 예약확인서를 완전 재작성

const SHEETS = ['SH_M', 'SH_R', 'SH_H', 'SH_P', 'SH_RC', 'SH_T', 'SH_C', 'SH_CC', 'SH_SP'];
const guessKeys = ['주문ID', 'Email', '한글이름'];

function normalizeKey(k) { return (k ? String(k) : '').trim().replace(/\s+/g, ''); }
function toMap(headers, row) {
  const m = {};
  headers.forEach((h, i) => { const k = normalizeKey(h); if (k) m[k] = row[i] ?? ''; });
  return m;
}
const ALIAS = { Email: ['Email','이메일','email','메일'], 한글이름: ['한글이름','이름','성명'], 주문ID: ['주문ID','orderId','주문번호'] };
function expandAliases(map){ const out = { ...map }; Object.keys(map).forEach(k=>out[normalizeKey(k)] = map[k]); for(const base in ALIAS){ const v = out[normalizeKey(base)]; if(v==null) continue; for(const a of ALIAS[base]) out[normalizeKey(a)] = v; } return out; }

function parseColrumCsv(text){ const lines = text.split(/\r?\n/).filter(Boolean); const cm={}; for(const line of lines){ const [sheet,col, name] = line.split(','); if(!sheet||!col||!name) continue; const idx = parseInt(col,10)-1; if(idx<0||Number.isNaN(idx)) continue; cm[sheet] = cm[sheet]||{}; cm[sheet][idx]=name; } return cm; }
async function loadAllSheets(cm){ return Promise.all(SHEETS.map(async name=>{ try{ const v = await fetchSheetData(name); let headers = (v&&v[0])||[]; const rows = (v&&v.slice(1))||[]; if(cm[name]){ const max = Math.max(...Object.keys(cm[name]).map(Number)); headers = Array.from({length:max+1},(_,i)=> cm[name][i] || headers[i] || `Col${i+1}`); } return { name, headers, rows }; }catch(e){ return { name, headers:[], rows:[], error:String(e) }; } })); }

function findMatches(all, q){ if(!q) return []; const s = String(q).trim(); const out=[]; for(const sh of all){ const hk = sh.headers.map(normalizeKey); const idxs = guessKeys.map(g=>hk.indexOf(normalizeKey(g))).filter(i=>i>=0); for(const row of sh.rows){ if(idxs.some(i=> String(row[i]??'').trim()===s)) out.push({ sheet: sh.name, headers: sh.headers, row }); } } return out; }

function extractOrderIdFromMatches(matches){
  for(const m of matches){ const map = toMap(m.headers, m.row); const id = map[normalizeKey('주문ID')] || map[normalizeKey('orderId')]; if(id) return String(id).trim(); }
  return '';
}

function collectRowsByOrderId(allSheets, orderId){
  if(!orderId) return [];
  const out = [];
  for(const s of allSheets){
    const hk = s.headers.map(normalizeKey);
    const idx = hk.indexOf(normalizeKey('주문ID')) !== -1 ? hk.indexOf(normalizeKey('주문ID')) : hk.indexOf(normalizeKey('orderId'));
    if(idx < 0) continue;
    for(const row of s.rows){ if(String(row[idx]??'').trim() === String(orderId)) out.push({ sheet: s.name, headers: s.headers, row }); }
  }
  return out;
}

function parseDateLoose(v){ if(!v) return null; if(v instanceof Date) return v; const s=String(v).trim().replace(/\./g,'-').replace(/년|월/g,'-').replace(/일/g,'').replace(/\s+/g,' '); const d=new Date(s); return Number.isNaN(d)?null:d; }
function fmtDate(v){ const d = parseDateLoose(v); if(!d) return ''; const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; }

function pick(m, keys){ for(const k of keys){ const v = m[normalizeKey(k)]; if(v!=null && String(v).trim()!=='') return String(v).trim(); } return ''; }

function groupRows(matches){ const g={}; for(const r of matches){ (g[r.sheet]=g[r.sheet]||[]).push(r); } return g; }

// 새 키 스키마 구축 + 서비스별 HTML 테이블 생성
function buildSchemaAndHTML(matches){
  const groups = groupRows(matches);
  
  // 1) 고객/주문
  const main = (groups['SH_M']&&groups['SH_M'][0]) || matches[0];
  const mm = main ? toMap(main.headers, main.row) : {};
  const mA = expandAliases(mm);
  const ORDER_ID = pick(mA, ['주문ID']);
  const schema = {
    ORDER_ID,
    RESERVED_AT: fmtDate(pick(mA, ['예약일','만든일시','생성일'])),
    CUST_NAME_KO: pick(mA, ['한글이름','이름','성명']),
    CUST_NAME_EN: pick(mA, ['영문이름']),
    CUST_EMAIL: pick(mA, ['Email','이메일']),
    CUST_PHONE: pick(mA, ['전화번호','연락처']),
    CUST_KAKAO: pick(mA, ['카톡ID','카카오톡ID']),
  };

  // 2) 인원 합계
  const countFrom = (arr, keys)=> arr.reduce((acc, r)=>{ const m = toMap(r.headers, r.row); for(const k of keys){ const v=Number(m[normalizeKey(k)]||0); if(v>0) acc+=v; } return acc; },0);
  const rRows = groups['SH_R'] || [];
  const hRows = groups['SH_H'] || [];
  schema.PAX_ADULT = String(countFrom([...rRows, ...hRows], ['ADULT','성인']));
  schema.PAX_CHILD = String(countFrom([...rRows, ...hRows], ['CHILD','아동']));
  schema.PAX_TODDLER = String(countFrom([...rRows, ...hRows], ['TODDLER','TOODLER','유아']));

  // 3) 서비스별 4열 형식 HTML 생성
  const safe = (s)=> String(s??'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const build4ColTable = (items, mergeDuplicates = false)=>{
    if(items.length===0) return '<div class="empty-state">📋 등록된 항목이 없습니다.</div>';
    
    let processedItems = items;
    if(mergeDuplicates) {
      // 중복 값 통합 로직 (크루즈명, 객실종류가 같으면 통합)
      const groups = {};
      for(const item of items) {
        const key = `${item['크루즈명']||''}_${item['객실종류']||''}`;
        if(!groups[key]) {
          groups[key] = { ...item, _count: 1, _merged: false };
        } else {
          groups[key]._count++;
          groups[key]._merged = true;
          // 숫자 필드 합산
          ['객실수', 'ADULT', 'CHILD', 'TODDLER', '수량', '인원', '차량수'].forEach(field => {
            if(item[field]) {
              const current = parseInt(groups[key][field] || 0, 10);
              const additional = parseInt(item[field] || 0, 10);
              groups[key][field] = String(current + additional);
            }
          });
        }
      }
      processedItems = Object.values(groups);
    }
    
    let html = '<div class="svc-4col">';
    processedItems.forEach((item, idx) => {
      const keys = Object.keys(item).filter(k => !k.startsWith('_'));
      for(let i = 0; i < keys.length; i += 2) {
        const key1 = keys[i];
        const key2 = keys[i + 1];
        let value1 = safe(item[key1] || '');
        let value2 = safe(item[key2] || '');

        if(item._merged && ['객실수', 'ADULT', 'CHILD', 'TODDLER', '수량', '인원', '차량수'].includes(key1)) {
          value1 += ` (${item._count}개 통합)`;
        }
        if(item._merged && key2 && ['객실수', 'ADULT', 'CHILD', 'TODDLER', '수량', '인원', '차량수'].includes(key2)) {
          value2 += ` (${item._count}개 통합)`;
        }

        // 라벨-값, 라벨-값 형태로 4열 채우기
        html += `<div class="svc-cell-label">${safe(key1)}</div>`;
        html += `<div class="svc-cell-value">${value1}</div>`;
        if(key2) {
          html += `<div class="svc-cell-label">${safe(key2)}</div>`;
          html += `<div class="svc-cell-value">${value2}</div>`;
        } else {
          html += `<div class="svc-cell-label"></div><div class="svc-cell-value"></div>`;
        }
      }
      if(idx < processedItems.length - 1) {
        html += '<div class="svc-hr" style="grid-column: 1/-1; height: 1px; background: var(--gray-200);"></div>';
      }
    });
    html += '</div>';
    return html;
  };

  // 크루즈 (SH_R) - 중복 통합 적용
  const cruiseItems = (groups['SH_R']||[]).map(r=>{ const m=toMap(r.headers, r.row); return {
    '크루즈명': m[normalizeKey('크루즈')]||'',
    '객실종류': m[normalizeKey('객실종류')]||'',
    '객실수': m[normalizeKey('객실수')]||'',
    '일정': m[normalizeKey('일정일수')]||'',
    '체크인': fmtDate(m[normalizeKey('체크인')]),
    'ADULT': m[normalizeKey('ADULT')]||'',
    'CHILD': m[normalizeKey('CHILD')]||'',
    'TODDLER': m[normalizeKey('TODDLER')]||m[normalizeKey('TOODLER')]||'',
    '비고': m[normalizeKey('객실비고')]||''
  }; });
  schema.CRUISE_ROWS = build4ColTable(cruiseItems, true);
  schema.CRUISE_SECTION = (cruiseItems.length>0) ? (`<div class="service-section">
      <div class="section-header"><span class="section-icon">🚢</span>크루즈 상품</div>
      <div class="section-content">${schema.CRUISE_ROWS}</div>
    </div>`) : '';

  // 호텔 (SH_H)
  const hotelItems = (groups['SH_H']||[]).map(r=>{ const m=toMap(r.headers, r.row); return {
    '호텔명': m[normalizeKey('호텔명')]||'',
    '객실명': m[normalizeKey('객실명')]||'',
    '객실종류': m[normalizeKey('객실종류')]||'',
    '객실수': m[normalizeKey('객실수')]||'',
    '체크인': fmtDate(m[normalizeKey('체크인날짜')]),
    '체크아웃': fmtDate(m[normalizeKey('체크아웃날짜')]),
    '일정': m[normalizeKey('일정')]||'',
    '조식': m[normalizeKey('조식서비스')]||'',
    '엑스트라베드': m[normalizeKey('엑스트라베드')]||'',
    '비고': m[normalizeKey('비고')]||''
  }; });
  schema.HOTEL_ROWS = build4ColTable(hotelItems);
  schema.HOTEL_SECTION = (hotelItems.length>0) ? (`<div class="service-section">
      <div class="section-header"><span class="section-icon">🏨</span>호텔 서비스</div>
      <div class="section-content">${schema.HOTEL_ROWS}</div>
    </div>`) : '';

  // 공항 픽업/샌딩 (SH_P)
  const airportItems = (groups['SH_P']||[]).map(r=>{ const m=toMap(r.headers, r.row); return {
    '일자': fmtDate(m[normalizeKey('일자')]),
    '시간': m[normalizeKey('시간')]||'',
  '경로': m[normalizeKey('경로')]||'',
  '분류': m[normalizeKey('분류')]||'',
    '공항': m[normalizeKey('공항명')]||'',
    '항공편': m[normalizeKey('항공편')]||'',
    '인원': m[normalizeKey('승차인원')]||'',
    '캐리어': m[normalizeKey('캐리어수량')]||'',
    '장소명': m[normalizeKey('장소명')]||'',
    '차량수': m[normalizeKey('차량수')]||''
  }; });
  schema.AIRPORT_ROWS = build4ColTable(airportItems);
  schema.AIRPORT_SECTION = (airportItems.length>0) ? (`<div class="service-section">
      <div class="section-header"><span class="section-icon">✈️</span>공항 픽업/샌딩</div>
      <div class="section-content">${schema.AIRPORT_ROWS}</div>
    </div>`) : '';

  // 렌터카 (SH_RC)
  const rentalItems = (groups['SH_RC']||[]).map(r=>{ const m=toMap(r.headers, r.row); return {
    '일자': fmtDate(m[normalizeKey('승차일자')]),
    '시간': m[normalizeKey('승차시간')]||'',
    '차량종류': m[normalizeKey('차량종류')]||'',
    '경로': m[normalizeKey('경로')]||'',
    '승차장소': m[normalizeKey('승차장소')]||m[normalizeKey('승차위치')]||'',
    '목적지': m[normalizeKey('목적지')]||'',
    '기간': m[normalizeKey('사용기간')]||'',
    '인원': m[normalizeKey('승차인원')]||'',
    '메모': m[normalizeKey('메모')]||''
  }; });
  schema.RENTAL_ROWS = build4ColTable(rentalItems);
  schema.RENTAL_SECTION = (rentalItems.length>0) ? (`<div class="service-section">
      <div class="section-header"><span class="section-icon">🚗</span>렌터카 서비스</div>
      <div class="section-content">${schema.RENTAL_ROWS}</div>
    </div>`) : '';

  // 투어 (SH_T)
  const tourItems = (groups['SH_T']||[]).map(r=>{ const m=toMap(r.headers, r.row); return {
    '투어명': m[normalizeKey('투어명')]||'',
    '투어종류': m[normalizeKey('투어종류')]||'',
    '상세': m[normalizeKey('상세구분')]||'',
    '수량': m[normalizeKey('수량')]||'',
    '시작일': fmtDate(m[normalizeKey('시작일자')]),
    '종료일': fmtDate(m[normalizeKey('종료일자')]),
    '인원': m[normalizeKey('투어인원')]||'',
    '픽업': m[normalizeKey('픽업위치')]||'',
    '드랍': m[normalizeKey('드랍위치')]||''
  }; });
  schema.TOUR_ROWS = build4ColTable(tourItems);
  schema.TOUR_SECTION = (tourItems.length>0) ? (`<div class="service-section">
      <div class="section-header"><span class="section-icon">🗺️</span>투어 서비스</div>
      <div class="section-content">${schema.TOUR_ROWS}</div>
    </div>`) : '';

  return schema;
}

async function fetchTemplate(){ const res = await fetch('/reservation_new.html', { cache: 'no-cache' }); if(!res.ok) throw new Error('템플릿 로드 실패'); return await res.text(); }
function normalizeTemplateHtml(html){ if(!html) return ''; const hasHtml=/<html[\s>]/i.test(html); if(!hasHtml) return `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`; return html; }

function applyTemplate(html, data){ return html.replace(/{{\s*([^}]+?)\s*}}/g, (_,k)=>{ const v = data[normalizeKey(k)]; return v==null? '': String(v); }); }

// Inline CSS from <style> blocks into element style attributes.
function inlineCss(html) {
  try{
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Collect :root variables first
    const varMap = {};
    const styleEls = Array.from(doc.querySelectorAll('style'));
    for(const s of styleEls){
      const text = s.textContent || '';
      // find :root { --var: value; }
    const rootMatch = text.match(/:root\s*{([\s\S]*?)}/m);
      if(rootMatch){
        const body = rootMatch[1];
        const re = /--([\w-]+)\s*:\s*([^;]+);/g;
        let m;
        while((m = re.exec(body))){ varMap[m[1].trim()] = m[2].trim(); }
      }
    }

    // Parse style rules and apply to matched elements
    for(const s of styleEls){
      const text = s.textContent || '';
      // match selectors { declarations }
  const ruleRe = /([^{]+)\{([^}]+)\}/g;
      let rm;
      while((rm = ruleRe.exec(text))){
        const selector = rm[1].trim();
        const decls = (rm[2] || '').trim();
        if(!selector || !decls) continue;
        // skip media queries and keyframes
        if(selector.startsWith('@')) continue;
        try{
          const nodes = Array.from(doc.querySelectorAll(selector));
          for(const node of nodes){
            // resolve var(...) in declarations using varMap
            let resolved = decls.replace(/var\(--([\w-]+)\)/g, (_,v)=> varMap[v] || '');
            // append declarations to existing inline style
            const existing = node.getAttribute('style') || '';
            // ensure declarations end with semicolon
            const add = resolved.split(';').map(x=>x.trim()).filter(Boolean).join('; ') + (resolved.trim().endsWith(';') ? '' : ';');
            node.setAttribute('style', (existing ? existing + ' ' : '') + add);
          }
        }catch(e){ /* ignore invalid selectors */ }
      }
    }

    // Remove original style elements to avoid reliance on <style>
    styleEls.forEach(s=>s.parentNode && s.parentNode.removeChild(s));

    return '<!doctype html>\n' + doc.documentElement.outerHTML;
  }catch(err){ console.error('inlineCss failed', err); return html; }
}

export default function ReservationConfirmation(){
  const [loading,setLoading]=useState(false);
  const [allSheets,setAllSheets]=useState([]);
  const [query,setQuery]=useState('');
  const [template,setTemplate]=useState('');
  const [resultHtml,setResultHtml]=useState('');
  const [resultData,setResultData]=useState(null);
  const [error,setError]=useState('');

  useEffect(()=>{ let alive=true; (async()=>{ try{ setLoading(true); const csv = await fetch('/colrum.csv',{cache:'no-cache'}).then(r=>r.ok?r.text():'').catch(()=>'' ); const cm = csv? parseColrumCsv(csv):{}; const [sheets,tpl] = await Promise.all([loadAllSheets(cm), fetchTemplate()]); if(!alive) return; setAllSheets(sheets); setTemplate(normalizeTemplateHtml(tpl)); }catch(e){ setError(String(e)); } finally{ setLoading(false); } })(); return ()=>{ alive=false; }; },[]);

  const candidates = useMemo(()=>{ const set = new Set(); for(const s of allSheets){ const hk=s.headers.map(normalizeKey); const idxs = guessKeys.map(g=>hk.indexOf(normalizeKey(g))).filter(i=>i>=0); for(const row of s.rows){ for(const i of idxs){ const v=String(row[i]??'').trim(); if(v) set.add(v); } } } return Array.from(set).sort(); },[allSheets]);

  const onGenerate = () => {
    setError('');
    const matches = findMatches(allSheets, query);
    if(matches.length===0){ setResultHtml(''); setError('일치하는 데이터가 없습니다.'); return; }
    // 주문ID 기준으로 모든 서비스행을 수집해 누락 없이 렌더링
    let rows = matches;
    let orderId = extractOrderIdFromMatches(matches);
    if(!orderId && /^\d/.test(String(query||''))) { orderId = String(query).trim(); }
    if(orderId){ const allById = collectRowsByOrderId(allSheets, orderId); if(allById.length>0) rows = allById; }
  const data = buildSchemaAndHTML(rows);
  const html = applyTemplate(template, data);
  setResultHtml(html);
  setResultData(data);
  };

  const onDownload = async () => {
    if(!resultHtml) return;
    // build filename: 예약일_한글이름(주문ID).html
    const data = resultData || {};
    const reserved = (data.RESERVED_AT || '').replace(/[:\s]/g,'') || '예약일없음';
    const name = (data.CUST_NAME_KO || data.CUST_NAME_EN || '').replace(/[^\w\-\sㄱ-ㅎ가-힣]/g,'') || '이름없음';
    const order = data.ORDER_ID || '';
    const filename = `${reserved}_${name}${order? `(${order})` : ''}.html`;

    const payload = {
      driveId: '0ADbMNv_AB2IKUk9PVA',
      filename,
      content: inlineCss(resultHtml)
    };

    try{
      // Prefer explicit Apps Script web app URL set in env. Fallback to local proxy endpoint only if not provided.
      const targetUrl = (process.env.REACT_APP_SAVE_TO_DRIVE_URL && process.env.REACT_APP_SAVE_TO_DRIVE_URL.length>0)
        ? process.env.REACT_APP_SAVE_TO_DRIVE_URL
        : '/api/saveToDrive';
      const isAppsScript = targetUrl.includes('script.google.com');
      const headers = isAppsScript ? { 'Content-Type': 'text/plain' } : { 'Content-Type': 'application/json' };
      const bodyToSend = isAppsScript ? JSON.stringify(payload) : JSON.stringify(payload);
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: bodyToSend,
      });
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      let json;
      if(ct.includes('application/json')){
        json = await res.json();
      } else {
        // fallback: attempt to read text (could be HTML error page)
        const txt = await res.text();
        try{ json = JSON.parse(txt); }catch(e){ throw new Error('서버 응답이 JSON이 아닙니다: ' + (txt.slice(0,200))); }
      }
      if(!json || !json.success){
        throw new Error(json && json.error ? json.error : 'Save to Drive failed');
      }
      alert('구글드라이브에 저장되었습니다: ' + (json.url || filename));
    }catch(err){
      console.error('Save to Drive error:', err);
      alert('저장 중 오류가 발생했습니다: ' + (err.message||''));
    }
  };
  const onSend = async () => {
    if(!resultHtml) return;
    const data = resultData || {};
    const to = (data.CUST_EMAIL || '').trim();
    if(!to){ alert('수신자 이메일이 없습니다. 고객 정보에 이메일을 입력해 주세요.'); return; }
    const reserved = data.RESERVED_AT || '';
    const name = data.CUST_NAME_KO || data.CUST_NAME_EN || '';
    const order = data.ORDER_ID ? `(${data.ORDER_ID})` : '';
    const subject = `예약 확인서: ${reserved} ${name} ${order}`.trim();
    const politeBodyText = `안녕하세요 ${name || '고객님'}님,\n\n귀하의 예약에 대한 확인서를 발송드립니다. 첨부된 확인서를 확인해 주시고, 예약 내용 중 수정이나 문의가 있으시면 회신 부탁드립니다.\n\n감사합니다.\n[회사명] 드림`;
    const payload = {
      to,
      subject,
      bodyHtml: inlineCss(resultHtml),
      bodyText: politeBodyText,
      filename: `${(reserved||'예약일없음')}_${(name||'이름없음')}${order}.html`
    };

    try{
      // Prefer explicit Apps Script web app URL set in env. Fallback to local proxy endpoint only if not provided.
      const targetUrl = (process.env.REACT_APP_SEND_EMAIL_URL && process.env.REACT_APP_SEND_EMAIL_URL.length>0)
        ? process.env.REACT_APP_SEND_EMAIL_URL
        : '/api/sendReservationEmail';
      const isAppsScript = targetUrl.includes('script.google.com');
      const headers = isAppsScript ? { 'Content-Type': 'text/plain' } : { 'Content-Type': 'application/json' };
      const bodyToSend = isAppsScript ? JSON.stringify(payload) : JSON.stringify(payload);
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: bodyToSend,
      });
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      let json;
      if(ct.includes('application/json')){
        json = await res.json();
      } else {
        const txt = await res.text();
        try{ json = JSON.parse(txt); }catch(e){ throw new Error('서버 응답이 JSON이 아닙니다: ' + (txt.slice(0,200))); }
      }
      if(!json || !json.success){ throw new Error(json && json.error ? json.error : 'Email send failed'); }
      alert('예약 확인서를 이메일로 발송했습니다.');
    }catch(err){ console.error('Send email error:', err); alert('발송 중 오류가 발생했습니다: ' + (err.message||'')); }
  };

  // 최근 사용자 10명(예약일 기준) 수집 - SH_M 우선
  const recentUsers = useMemo(()=>{
    const main = allSheets.find(s=>s.name==='SH_M');
    if(!main) return [];
    const rows = (main.rows||[]).map((row, idx)=>{
      const m = toMap(main.headers, row);
      return {
        orderId: (m[normalizeKey('주문ID')]||'').toString().trim(),
        name: (m[normalizeKey('한글이름')]||m[normalizeKey('이름')]||'').toString().trim(),
        date: parseDateLoose(m[normalizeKey('예약일')]||m[normalizeKey('만든일시')]||m[normalizeKey('생성일')]||'')
      };
    }).filter(x=>x.orderId||x.name);
    rows.sort((a,b)=> (b.date?b.date.getTime():0) - (a.date?a.date.getTime():0));
    return rows.slice(0,10);
  },[allSheets]);

  return (
    <div style={{padding:16}}>
      <h2>예약확인서 생성(신규)</h2>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:12 }}>
        <label>
          검색 키(주문ID/Email/한글이름):
          <input list="reservation-candidates" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="예: 주문ID 또는 Email 또는 한글이름" style={{ marginLeft:8, padding:'6px 8px', minWidth:260 }} />
        </label>
        <datalist id="reservation-candidates">
          {candidates.map(c=> <option key={c} value={c} />)}
        </datalist>
        <button onClick={onGenerate} disabled={loading || !template} style={{ padding:'6px 12px' }}>생성</button>
        <button onClick={onDownload} disabled={!resultHtml} style={{ padding:'6px 12px' }}>다운로드</button>
  <button onClick={onSend} disabled={!resultHtml} style={{ padding:'6px 12px' }}>발송</button>
        {loading && <span style={{ marginLeft:8 }}>로딩 중…</span>}
      </div>
      {error && <div style={{ color:'crimson', marginBottom:12 }}>{error}</div>}
  <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:12 }}>
        <div style={{ border:'1px solid #eee', borderRadius:6, overflow:'hidden' }}>
          <div style={{ padding:'10px 12px', background:'#fafafa', borderBottom:'1px solid #eee', fontWeight:700 }}>최근 예약 사용자 (10명)</div>
          <div style={{ maxHeight:480, overflow:'auto' }}>
            {recentUsers.length===0 ? (
              <div style={{ padding:12, color:'#888' }}>표시할 사용자가 없습니다.</div>
            ) : recentUsers.map((u,i)=> (
              <div key={i} onClick={()=>{ setQuery(u.orderId || u.name); setTimeout(onGenerate, 0); }} style={{ padding:'10px 12px', borderBottom:'1px solid #f0f0f0', cursor:'pointer', display:'flex', justifyContent:'space-between' }}>
                <div style={{ fontWeight:600 }}>{u.name || '(이름없음)'}</div>
                <div style={{ color:'#666', fontSize:12 }}>{u.date ? fmtDate(u.date): ''}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ border:'1px solid #ddd', minHeight:400, overflow:'hidden' }}>
          {resultHtml ? (
            <iframe title="reservation-preview" srcDoc={resultHtml} style={{ width:'100%', height:700, border:0 }} />
          ) : (
            <div style={{ color:'#666', padding:16 }}>좌측 사용자 또는 검색 키를 선택해 생성하세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}
