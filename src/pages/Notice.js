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
function fmtNum(n){ const x=Number(n); return Number.isFinite(x)? x.toLocaleString('en-US') : (n??''); }

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

  // 가격 정보 수집 (라인 아이템: 금액/수량/합계 + 통화별 총합 + KRW 환산)
  const parseNumber = (v) => {
    if(v==null) return NaN;
    if(typeof v === 'number') return v;
    const s = String(v).replace(/[^0-9.+-]/g,'');
    const n = parseFloat(s);
    return Number.isFinite(n)? n : NaN;
  };
  const amountFromMap = (m) => {
    const keys = ['합계','금액','총액','요금','가격','판매가'];
    for(const k of keys){ const n = parseNumber(m[normalizeKey(k)]); if(Number.isFinite(n)) return n; }
    // 단가*수량 추정
    const unitKeys = ['단가','요금','금액'];
    const qtyKeys = ['수량','인원','객실수','차량수'];
    let unit = NaN, qty = NaN;
    for(const k of unitKeys){ const n=parseNumber(m[normalizeKey(k)]); if(Number.isFinite(n)){ unit=n; break; } }
    for(const k of qtyKeys){ const n=parseNumber(m[normalizeKey(k)]); if(Number.isFinite(n)){ qty=n; break; } }
    if(Number.isFinite(unit) && Number.isFinite(qty)) return unit*qty;
    return NaN;
  };
  const pickCurrency = (m) => {
    return (m[normalizeKey('통화')]||m[normalizeKey('화폐')]||m[normalizeKey('currency')]||'').toString().trim();
  };
  const deriveQty = (m) => {
    const prefer = ['수량','인원','객실수','차량수'];
    for(const k of prefer){ const n=parseNumber(m[normalizeKey(k)]); if(Number.isFinite(n)) return n; }
    const a=parseNumber(m[normalizeKey('ADULT')]);
    const c=parseNumber(m[normalizeKey('CHILD')]);
    const t=parseNumber(m[normalizeKey('TODDLER')]||m[normalizeKey('TOODLER')]);
    const sum=[a,c,t].filter(Number.isFinite).reduce((x,y)=>x+y,0);
    return Number.isFinite(sum)&&sum>0? sum : 1;
  };
  const itemLabelFrom = (sheet, m) => {
    if(sheet==='SH_H') return `${m[normalizeKey('호텔명')]||''} ${m[normalizeKey('객실명')]||m[normalizeKey('객실종류')]||''}`.trim();
    if(sheet==='SH_R') return `${m[normalizeKey('크루즈')]||''} ${m[normalizeKey('객실종류')]||''}`.trim();
    if(sheet==='SH_P') return `${m[normalizeKey('경로')]||m[normalizeKey('공항명')]||''}`.trim();
    if(sheet==='SH_RC') return `${m[normalizeKey('차량종류')]||''} ${m[normalizeKey('경로')]||''}`.trim();
    if(sheet==='SH_T') return `${m[normalizeKey('투어명')]||''} ${m[normalizeKey('상세구분')]||''}`.trim();
    return m[normalizeKey('상품명')]||'';
  };
  const extractRates = (groups) => {
    const rates = {};
    const add = (cur, rate) => { const n=parseNumber(rate); if(Number.isFinite(n) && cur){ rates[cur]=n; } };
    const scan = (arr) => {
      for(const r of (arr||[])){
        const m = toMap(r.headers, r.row);
        const cur = (m[normalizeKey('통화')]||m[normalizeKey('화폐')]||'').toString().trim().toUpperCase();
        const rx = m[normalizeKey('환율')]||m[normalizeKey('원화환산')]||m[normalizeKey('KRW')];
        if(cur && rx) add(cur, rx);
        // 특정 키 형태: USD환율, JPY환율 등
        for(const k of Object.keys(m)){
          const nk = normalizeKey(k);
          const m1 = nk.match(/^([A-Z]{3})환율$/i);
          if(m1) add(m1[1].toUpperCase(), m[k]);
        }
      }
    };
  // prefer SH_M (main sheet) values first, then fallback to SH_SP
  scan(groups['SH_M']);
  scan(groups['SH_SP']);
    return rates;
  };

  const rates = extractRates(groups);
  const lineItems = [];
  const currencyTotals = {};
  const pushItem = (sheetName, r) => {
    const m = toMap(r.headers, r.row);
    const label = itemLabelFrom(sheetName, m) || sheetName;
    // default qty from deriveQty
    let qty = deriveQty(m);
    // For cruise items, prefer explicit '인원수' column, then ADULT+CHILD+TODDLER
    if (sheetName === 'SH_R') {
      const p = parseNumber(m[normalizeKey('인원수')]);
      if (Number.isFinite(p) && p > 0) {
        qty = p;
      } else {
        const a = parseNumber(m[normalizeKey('ADULT')]);
        const c = parseNumber(m[normalizeKey('CHILD')]);
        const t = parseNumber(m[normalizeKey('TODDLER')]||m[normalizeKey('TOODLER')]);
        const persons = [a,c,t].filter(Number.isFinite).reduce((x,y)=>x+y,0);
        if (Number.isFinite(persons) && persons > 0) qty = persons;
      }
    }
    let unit = parseNumber(m[normalizeKey('단가')]);
    let total = amountFromMap(m);
    if(!Number.isFinite(unit) && Number.isFinite(total) && Number.isFinite(qty) && qty>0) unit = total/qty;
    if(!Number.isFinite(total) && Number.isFinite(unit) && Number.isFinite(qty)) total = unit*qty;
  const cur = (pickCurrency(m) || 'KRW').toUpperCase();
    if(Number.isFinite(total)) currencyTotals[cur] = (currencyTotals[cur]||0) + total;
    // map sheetName to human friendly service label
    const svcMap = {
      'SH_R': '크루즈',
      'SH_P': '공항',
      'SH_T': '투어',
      'SH_H': '호텔',
      'SH_RC': '렌트카'
    };
    const serviceLabel = svcMap[sheetName] || sheetName;
    lineItems.push({ service: serviceLabel, label, unit: Number.isFinite(unit)? unit: NaN, qty: Number.isFinite(qty)? qty: 1, total: Number.isFinite(total)? total: NaN, cur });
  };
  ['SH_R','SH_H','SH_P','SH_RC','SH_T'].forEach(sn => (groups[sn]||[]).forEach(r=>pushItem(sn,r)) );

  // SH_M 에서 계약금/잔금/할인 등 별도 라인
  (groups['SH_M']||[]).forEach(r=>{
    const m = toMap(r.headers, r.row);
    const cur = pickCurrency(m) || 'KRW';
    const addKey = (lab, keys)=>{
      for(const k of keys){ const n=parseNumber(m[normalizeKey(k)]); if(Number.isFinite(n)){ lineItems.push({ label: lab, unit: n, qty: 1, total: n, cur, meta:true }); return; } }
    };
    addKey('계약금', ['계약금','선금','예약금','Deposit']);
    addKey('할인금액', ['할인금액','할인액','Discount']);
    addKey('잔금', ['잔금','나머지금액','Balance']);
  });

  if(lineItems.length>0){
    // build HTML table: header row + data rows
    let priceHtml = '<table class="price-table">';
    priceHtml += '<thead><tr><th>서비스</th><th>항목</th><th style="text-align:right">금액</th><th style="text-align:center">수량</th><th style="text-align:right">합계</th></tr></thead>';
    priceHtml += '<tbody>';
    for(const it of lineItems){
      const displayUnit = (it.cur || '').toUpperCase() === 'KRW' ? '동' : (it.cur || '');
      const unitStr = Number.isFinite(it.unit)? fmtNum(it.unit)+' '+displayUnit : '';
      const qtyStr = Number.isFinite(it.qty)? String(it.qty): '';
      const totalStr = Number.isFinite(it.total)? fmtNum(it.total)+' '+displayUnit : '';
      // render one row per item: 서비스 | 항목 | 금액(단가) | 수량 | 합계
      priceHtml += `<tr><td>${safe(it.service)}</td><td>${safe(it.label)}</td><td style="text-align:right">${safe(unitStr)}</td><td style="text-align:center">${safe(qtyStr)}</td><td style="text-align:right">${safe(totalStr)}</td></tr>`;
    }
    priceHtml += '</tbody>';
    // totals into tfoot for visual separation
    const totalsStr = Object.entries(currencyTotals).map(([c,v])=> `${fmtNum(v)} ${(c||'').toUpperCase() === 'KRW' ? '동' : c}`).join(' + ');
    // compute KRW total: require rates for all non-KRW currencies; otherwise mark as missing
    let krwTotal = 0;
    let rateMissing = false;
    for(const [c,v] of Object.entries(currencyTotals)){
      const cur = (c||'').toUpperCase();
      if(cur === 'KRW'){
        krwTotal += v;
        continue;
      }
      const rate = rates[cur];
      if(!Number.isFinite(rate)){
        rateMissing = true;
        break;
      }
      krwTotal += v * rate * 0.01;
    }
  priceHtml += '<tfoot>';
  // colspan=4 to span 서비스, 항목, 금액, 수량 columns
  priceHtml += `<tr><td class="price-total" colspan="4">총합계</td><td class="price-total" style="text-align:right">${safe(totalsStr || '')}</td></tr>`;
  priceHtml += `<tr><td class="price-total" colspan="4">원화</td><td class="price-total" style="text-align:right">${safe(!rateMissing && Number.isFinite(krwTotal) ? fmtNum(krwTotal) + ' 원' : '(환율 정보 없음)')}</td></tr>`;
  priceHtml += '</tfoot></table>';
    schema.PRICE_ROWS = priceHtml;
  } else {
    schema.PRICE_ROWS = '<div class="empty-state">💳 가격 정보가 없습니다.</div>';
  }

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
  const [resultText,setResultText]=useState('');
  const [useHtmlText,setUseHtmlText]=useState(true); // 아이콘 포함 HTML로 렌더
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
  setResultText(buildNaturalTextFromRows(rows));
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
        <div style={{ border:'1px solid #ddd', minHeight:400, overflow:'auto', background:'#fff' }}>
          <div style={{ padding:8, borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:8 }}>
            <label style={{ display:'flex', alignItems:'center', gap:6 }}>
              <input type="checkbox" checked={useHtmlText} onChange={(e)=>setUseHtmlText(e.target.checked)} />
              아이콘 포함 HTML로 보기
            </label>
          </div>
          {resultText ? (
            useHtmlText ? (
              <div dangerouslySetInnerHTML={{ __html: convertNaturalTextToHtmlWithIcons(resultText) }} />
            ) : (
              <div style={{ whiteSpace:'pre-wrap', padding:16, lineHeight:1.6 }}>{resultText}</div>
            )
          ) : (
            <div style={{ color:'#666', padding:16 }}>좌측 사용자 또는 검색 키를 선택해 생성하세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== 자연어 텍스트 빌더 =====
function num(v){
  if(v==null) return NaN;
  if(typeof v==='number') return v;
  const s=String(v).replace(/[^0-9.+-]/g,'');
  const n=parseFloat(s);
  return Number.isFinite(n)? n: NaN;
}
function pickCurrencyNL(m){ return (m[normalizeKey('통화')]||m[normalizeKey('화폐')]||m[normalizeKey('currency')]||'').toString().trim().toUpperCase(); }
function amountFromMapNL(m){
  const keys=['합계','금액','총액','요금','가격','판매가'];
  for(const k of keys){ const n=num(m[normalizeKey(k)]); if(Number.isFinite(n)) return n; }
  const unitKeys=['단가','요금','금액'];
  const qtyKeys=['수량','인원','객실수','차량수'];
  let unit=NaN, qty=NaN;
  for(const k of unitKeys){ const n=num(m[normalizeKey(k)]); if(Number.isFinite(n)){ unit=n; break; } }
  for(const k of qtyKeys){ const n=num(m[normalizeKey(k)]); if(Number.isFinite(n)){ qty=n; break; } }
  if(Number.isFinite(unit) && Number.isFinite(qty)) return unit*qty;
  return NaN;
}
function deriveQtyNL(m){
  const prefer=['수량','인원','객실수','차량수'];
  for(const k of prefer){ const n=num(m[normalizeKey(k)]); if(Number.isFinite(n)) return n; }
  const a=num(m[normalizeKey('ADULT')]);
  const c=num(m[normalizeKey('CHILD')]);
  const t=num(m[normalizeKey('TODDLER')]||m[normalizeKey('TOODLER')]);
  const sum=[a,c,t].filter(Number.isFinite).reduce((x,y)=>x+y,0);
  return Number.isFinite(sum)&&sum>0? sum: 1;
}
function vndToMandong(n){ if(!Number.isFinite(n)) return ''; const md = Math.round(n/10000); return md.toLocaleString('ko-KR')+'만동'; }
function formatKRW(n){ if(!Number.isFinite(n)) return ''; return n.toLocaleString('ko-KR')+'원'; }
function extractRatesFromGroups(groups){
  const rates={};
  const add=(cur,rate)=>{ const n=num(rate); if(Number.isFinite(n) && cur){ rates[cur.toUpperCase()]=n; } };
  const scan=(arr)=>{ for(const r of (arr||[])){ const m=toMap(r.headers, r.row); const cur=(m[normalizeKey('통화')]||m[normalizeKey('화폐')]||'').toString().trim().toUpperCase(); const rx=m[normalizeKey('환율')]||m[normalizeKey('원화환산')]||m[normalizeKey('KRW')]; if(cur && rx) add(cur,rx); for(const k of Object.keys(m)){ const nk=normalizeKey(k); const m1 = nk.match(/^([A-Z]{3})환율$/i); if(m1) add(m1[1], m[k]); } } };
  scan(groups['SH_M']);
  scan(groups['SH_SP']);
  return rates;
}
function buildNaturalTextFromRows(rows){
  const groups = groupRows(rows);
  const rates = extractRatesFromGroups(groups);
  const lines=[];
  lines.push('회원님~! 견적드립니다^^','');
  const usedVehicleRows = new Set();

  const unitLabelFrom = (m) => {
    const hasRoom = Number.isFinite(num(m[normalizeKey('객실수')]));
    const hasCar = Number.isFinite(num(m[normalizeKey('차량수')]));
    if(hasRoom) return '객실';
    if(hasCar) return '대';
    return '인';
  };
  const computeAmounts = (m, qtyHint) => {
    const cur = pickCurrencyNL(m) || 'VND';
    const qty = Number.isFinite(qtyHint) && qtyHint>0 ? qtyHint : deriveQtyNL(m);
    let total = amountFromMapNL(m);
    let unit = num(m[normalizeKey('단가')]);
    if(!Number.isFinite(unit) && Number.isFinite(total) && Number.isFinite(qty) && qty>0) unit = total/qty;
    let unitVnd=NaN, totalVnd=NaN, unitKrw=NaN, totalKrw=NaN;
    if(cur==='VND'){
      unitVnd = Number.isFinite(unit)? unit : NaN;
      totalVnd = Number.isFinite(total)? total : (Number.isFinite(unitVnd)&&Number.isFinite(qty)? unitVnd*qty: NaN);
    } else if(cur==='KRW'){
      unitKrw = Number.isFinite(unit)? unit : NaN;
      totalKrw = Number.isFinite(total)? total : (Number.isFinite(unitKrw)&&Number.isFinite(qty)? unitKrw*qty: NaN);
      if(Number.isFinite(rates['VND'])){
        if(Number.isFinite(unitKrw)) unitVnd = unitKrw * 100 / rates['VND'];
        if(Number.isFinite(totalKrw)) totalVnd = totalKrw * 100 / rates['VND'];
      }
    }
    return { qty, unitVnd, totalVnd, unitKrw, totalKrw };
  };
  const pushTotals = (vnd, krw) => {
    if(Number.isFinite(vnd) && vnd>0){
      lines.push(`총금액: ${vndToMandong(vnd)}`);
      const krwConv = Number.isFinite(rates['VND']) ? vnd * rates['VND'] * 0.01 : NaN;
      if(Number.isFinite(krwConv)) lines.push(`원화금액: ${formatKRW(krwConv)}`);
      else if(Number.isFinite(krw)) lines.push(`원화금액: ${formatKRW(krw)}`);
      lines.push('');
    } else if(Number.isFinite(krw) && krw>0){
      lines.push(`총금액: ${formatKRW(krw)}`);
      lines.push('');
    } else {
      lines.push('');
    }
  };
  const qtySuffix = (lbl, qty) => {
    if(lbl==='객실') return `${qty}객실`;
    if(lbl==='대') return `${qty}대`;
    return `${qty}인`;
  };

  // 1) 크루즈
  for(const r of (groups['SH_R']||[])){
    const m = toMap(r.headers, r.row);
    const cruise = m[normalizeKey('크루즈')] || m[normalizeKey('크루즈명')] || '';
    const room = m[normalizeKey('객실종류')] || m[normalizeKey('객실명')] || '';
    let adults = num(m[normalizeKey('ADULT')]);
    if(!Number.isFinite(adults) || adults<=0){
      const a=num(m[normalizeKey('ADULT')]); const c=num(m[normalizeKey('CHILD')]); const t=num(m[normalizeKey('TODDLER')]||m[normalizeKey('TOODLER')]);
      const sum=[a,c,t].filter(Number.isFinite).reduce((x,y)=>x+y,0);
      adults = Number.isFinite(sum)&&sum>0? sum: 1;
    }
    const { qty, unitVnd, totalVnd, unitKrw, totalKrw } = computeAmounts(m, adults);
    // 차량 정보: SH_C 우선, 없으면 SH_RC, SH_P 순서로 찾아 사용(중복 사용 방지)
    let vehicleRow = null;
    const tryFindVehicle = (arr)=>{ if(!arr) return null; for(const vv of arr){ if(!usedVehicleRows.has(vv)) return vv; } return null; };
    vehicleRow = tryFindVehicle(groups['SH_C']) || tryFindVehicle(groups['SH_RC']) || tryFindVehicle(groups['SH_P']);
    let carLabel = '';
    let carAmounts = { qty: NaN, unitVnd: NaN, totalVnd: NaN, unitKrw: NaN, totalKrw: NaN };
    if(vehicleRow){
      usedVehicleRows.add(vehicleRow);
      const mv = toMap(vehicleRow.headers, vehicleRow.row);
      carLabel = mv[normalizeKey('분류')] || mv[normalizeKey('차량종류')] || mv[normalizeKey('경로')] || mv[normalizeKey('차량')] || mv[normalizeKey('차량종류')] || '';
      carAmounts = computeAmounts(mv, adults);
    }
    lines.push(`크루즈: ${cruise || '-'}`,'');
    lines.push(`객실명: ${room || '-'}`);
    if(Number.isFinite(unitVnd)) lines.push(`성인 1인 ${vndToMandong(unitVnd)} * ${qty}인 = ${vndToMandong(unitVnd*qty)}`,'');
    else if(Number.isFinite(totalVnd)) lines.push(`성인 ${qty}인 합계 ${vndToMandong(totalVnd)}`,'');
    else if(Number.isFinite(unitKrw)) lines.push(`성인 1인 ${formatKRW(unitKrw)} * ${qty}인 = ${formatKRW(unitKrw*qty)}`,'');
    else if(Number.isFinite(totalKrw)) lines.push(`성인 ${qty}인 합계 ${formatKRW(totalKrw)}`,'');
    else lines.push('');
    const vndSum = Number.isFinite(totalVnd)? totalVnd: (Number.isFinite(unitVnd)? unitVnd*qty: NaN);
    const krwSum = Number.isFinite(totalKrw)? totalKrw: (Number.isFinite(unitKrw)? unitKrw*qty: NaN);
    pushTotals(vndSum, krwSum);

    // 차량이 있으면 차량 정보 및 차량 금액을 크루즈 블록에 추가
    if(vehicleRow){
      lines.push(`차량: ${carLabel || '-'}`);
      if(Number.isFinite(carAmounts.unitVnd)) lines.push(`1대 ${vndToMandong(carAmounts.unitVnd)} * ${carAmounts.qty}대 = ${vndToMandong(carAmounts.unitVnd * carAmounts.qty)}`, '');
      else if(Number.isFinite(carAmounts.totalVnd)) lines.push(`합계 ${vndToMandong(carAmounts.totalVnd)}`, '');
      else if(Number.isFinite(carAmounts.unitKrw)) lines.push(`1대 ${formatKRW(carAmounts.unitKrw)} * ${carAmounts.qty}대 = ${formatKRW(carAmounts.unitKrw * carAmounts.qty)}`, '');
      else if(Number.isFinite(carAmounts.totalKrw)) lines.push(`합계 ${formatKRW(carAmounts.totalKrw)}`, '');
      else lines.push('');
      const carVndSum = Number.isFinite(carAmounts.totalVnd)? carAmounts.totalVnd : (Number.isFinite(carAmounts.unitVnd)? carAmounts.unitVnd * carAmounts.qty : NaN);
      const carKrwSum = Number.isFinite(carAmounts.totalKrw)? carAmounts.totalKrw : (Number.isFinite(carAmounts.unitKrw)? carAmounts.unitKrw * carAmounts.qty : NaN);
      pushTotals(carVndSum, carKrwSum);
    }
  }

  // 2) 호텔
  for(const r of (groups['SH_H']||[])){
    const m = toMap(r.headers, r.row);
    const hotel = m[normalizeKey('호텔명')] || '';
    const room = m[normalizeKey('객실명')] || m[normalizeKey('객실종류')] || '';
    const unitLabel = unitLabelFrom(m);
    const { qty, unitVnd, totalVnd, unitKrw, totalKrw } = computeAmounts(m);
    lines.push(`호텔: ${hotel || '-'}`,'');
    if(room) lines.push(`객실명: ${room}`);
    if(Number.isFinite(unitVnd)) lines.push(`1${unitLabel} ${vndToMandong(unitVnd)} * ${qtySuffix(unitLabel, qty)} = ${vndToMandong(unitVnd*qty)}`,'');
    else if(Number.isFinite(totalVnd)) lines.push(`합계 ${vndToMandong(totalVnd)}`,'');
    else if(Number.isFinite(unitKrw)) lines.push(`1${unitLabel} ${formatKRW(unitKrw)} * ${qtySuffix(unitLabel, qty)} = ${formatKRW(unitKrw*qty)}`,'');
    else if(Number.isFinite(totalKrw)) lines.push(`합계 ${formatKRW(totalKrw)}`,'');
    else lines.push('');
    const vndSum = Number.isFinite(totalVnd)? totalVnd: (Number.isFinite(unitVnd)? unitVnd*qty: NaN);
    const krwSum = Number.isFinite(totalKrw)? totalKrw: (Number.isFinite(unitKrw)? unitKrw*qty: NaN);
    pushTotals(vndSum, krwSum);
  }

  // 3) 공항 픽업/샌딩
  for(const r of (groups['SH_P']||[])){
    const m = toMap(r.headers, r.row);
    const route = m[normalizeKey('경로')] || m[normalizeKey('공항명')] || '';
    const unitLabel = unitLabelFrom(m);
    const { qty, unitVnd, totalVnd, unitKrw, totalKrw } = computeAmounts(m);
    lines.push(`공항: ${route || '-'}`,'');
    const timeInfo = [fmtDate(m[normalizeKey('일자')]), m[normalizeKey('시간')]||''].filter(Boolean).join(' ');
    if(timeInfo) lines.push(timeInfo);
    if(Number.isFinite(unitVnd)) lines.push(`1${unitLabel} ${vndToMandong(unitVnd)} * ${qtySuffix(unitLabel, qty)} = ${vndToMandong(unitVnd*qty)}`,'');
    else if(Number.isFinite(totalVnd)) lines.push(`합계 ${vndToMandong(totalVnd)}`,'');
    else if(Number.isFinite(unitKrw)) lines.push(`1${unitLabel} ${formatKRW(unitKrw)} * ${qtySuffix(unitLabel, qty)} = ${formatKRW(unitKrw*qty)}`,'');
    else if(Number.isFinite(totalKrw)) lines.push(`합계 ${formatKRW(totalKrw)}`,'');
    else lines.push('');
    const vndSum = Number.isFinite(totalVnd)? totalVnd: (Number.isFinite(unitVnd)? unitVnd*qty: NaN);
    const krwSum = Number.isFinite(totalKrw)? totalKrw: (Number.isFinite(unitKrw)? unitKrw*qty: NaN);
    pushTotals(vndSum, krwSum);
  }

  // 4) 렌터카
  for(const r of (groups['SH_RC']||[])){
    const m = toMap(r.headers, r.row);
    const car = m[normalizeKey('차량종류')] || '';
    const route = m[normalizeKey('경로')] || '';
    const unitLabel = unitLabelFrom(m);
    const { qty, unitVnd, totalVnd, unitKrw, totalKrw } = computeAmounts(m);
    lines.push(`렌터카: ${car || '-'}`,'');
    if(route) lines.push(route);
    if(Number.isFinite(unitVnd)) lines.push(`1${unitLabel} ${vndToMandong(unitVnd)} * ${qtySuffix(unitLabel, qty)} = ${vndToMandong(unitVnd*qty)}`,'');
    else if(Number.isFinite(totalVnd)) lines.push(`합계 ${vndToMandong(totalVnd)}`,'');
    else if(Number.isFinite(unitKrw)) lines.push(`1${unitLabel} ${formatKRW(unitKrw)} * ${qtySuffix(unitLabel, qty)} = ${formatKRW(unitKrw*qty)}`,'');
    else if(Number.isFinite(totalKrw)) lines.push(`합계 ${formatKRW(totalKrw)}`,'');
    else lines.push('');
    const vndSum = Number.isFinite(totalVnd)? totalVnd: (Number.isFinite(unitVnd)? unitVnd*qty: NaN);
    const krwSum = Number.isFinite(totalKrw)? totalKrw: (Number.isFinite(unitKrw)? unitKrw*qty: NaN);
    pushTotals(vndSum, krwSum);
  }

  // 5) 투어
  for(const r of (groups['SH_T']||[])){
    const m = toMap(r.headers, r.row);
    const tour = m[normalizeKey('투어명')] || '';
    const detail = m[normalizeKey('상세구분')] || '';
    const unitLabel = unitLabelFrom(m);
    const { qty, unitVnd, totalVnd, unitKrw, totalKrw } = computeAmounts(m);
    lines.push(`투어: ${tour || '-'}`,'');
    if(detail) lines.push(detail);
    if(Number.isFinite(unitVnd)) lines.push(`1${unitLabel} ${vndToMandong(unitVnd)} * ${qtySuffix(unitLabel, qty)} = ${vndToMandong(unitVnd*qty)}`,'');
    else if(Number.isFinite(totalVnd)) lines.push(`합계 ${vndToMandong(totalVnd)}`,'');
    else if(Number.isFinite(unitKrw)) lines.push(`1${unitLabel} ${formatKRW(unitKrw)} * ${qtySuffix(unitLabel, qty)} = ${formatKRW(unitKrw*qty)}`,'');
    else if(Number.isFinite(totalKrw)) lines.push(`합계 ${formatKRW(totalKrw)}`,'');
    else lines.push('');
    const vndSum = Number.isFinite(totalVnd)? totalVnd: (Number.isFinite(unitVnd)? unitVnd*qty: NaN);
    const krwSum = Number.isFinite(totalKrw)? totalKrw: (Number.isFinite(unitKrw)? unitKrw*qty: NaN);
    pushTotals(vndSum, krwSum);
  }

  lines.push('해당 환율은 참고용 네이버 환율로, 실제 결제하시는 금액과 차이가 있을 수 있습니다.^^');
  return lines.join('\n');
}

// 자연어 텍스트를 HTML로 변환하며 서비스별 SVG 아이콘을 삽입
function convertNaturalTextToHtmlWithIcons(text){
  const escape = (s)=> String(s||'').replace(/[&<>]/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const lines = String(text||'').split(/\r?\n/);
  const iconFor = (line)=>{
    if(/^크루즈\s*:/.test(line)) return '/icons/cruise.svg';
  if(/^호텔\s*:/.test(line)) return '/icons/hotel.svg';
    if(/^공항\s*:/.test(line)) return '/icons/airport.svg';
    if(/^렌터카\s*:/.test(line) || /^차량\s*:/.test(line)) return '/icons/car.svg';
    if(/^투어\s*:/.test(line)) return '/icons/tour.svg';
    return '';
  };
  const htmlParts = ['<div style="padding:16px; line-height:1.7">'];
  for(const raw of lines){
    const line = raw.trimEnd();
    if(line === ''){ htmlParts.push('<div style="height:10px"></div>'); continue; }
    const icon = iconFor(line);
    if(icon){
      const [label, rest] = line.split(':');
      htmlParts.push(`<div style="display:flex; align-items:center; gap:8px; font-weight:700; margin-top:6px"><img src="${icon}" alt="" width="20" height="20" /><span>${escape(label)}:</span><span>${escape((rest||'').trim())}</span></div>`);
    } else {
      htmlParts.push(`<div>${escape(line)}</div>`);
    }
  }
  htmlParts.push('</div>');
  return htmlParts.join('');
}
