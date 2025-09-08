import React, { useState, useEffect } from 'react';
import { buildRowFromHeaders } from '../../utils/rowBuilder';
import { parseToDate } from '../../utils/dateUtils';

const SHEET_ID = process.env.REACT_APP_SHEET_ID;
const API_KEY = process.env.REACT_APP_API_KEY;

const FIXED_HEADERS = [
  { key: 'ID', label: 'ID', type: 'text', required: false },
  { key: '주문ID', label: '주문ID', type: 'text', required: true },
  { key: '투어코드', label: '투어코드', type: 'text', required: false },
  { key: '투어명', label: '투어명을 선택하세요', type: 'text', required: false },
  { key: '투어종류', label: '투어종류를 선택하세요', type: 'text', required: false },
  { key: '상세구분', label: '상세구분', type: 'text', required: false },
  { key: '수량', label: '수량(자동)', type: 'number', required: false },
  { key: '시작일자', label: '시작일자를 선택하세요', type: 'date', required: false },
  { key: '종료일자', label: '종료일자를 선택하세요', type: 'date', required: false },
  { key: '배차', label: '배차(자동)', type: 'text', required: false },
  { key: '투어인원', label: '투어인원을 입력하세요', type: 'number', required: false },
  { key: '픽업위치', label: '투어시작 승차위치를 정확하게 입력하세요', type: 'text', required: false },
  { key: '드랍위치', label: '투어후 하차위치를 정확하게 입력하세요', type: 'text', required: false },
  { key: '금액', label: '금액', type: 'number', required: false },
  { key: '합계', label: '합계', type: 'number', required: false },
  { key: 'Email', label: '이메일 주소', type: 'email', required: true },
  { key: '메모', label: '메모', type: 'text', required: false },
  { key: '투어비고', label: '투어비고', type: 'text', required: false }
];

function TourServiceForm({ formData, setFormData, headers = [], onServiceSubmitted }) {
  // 컬럼별 아이콘 매핑
  const iconMap = {
    투어코드: <span role="img" aria-label="code">🔑</span>,
    투어명: <span role="img" aria-label="tour">🗺️</span>,
    투어종류: <span role="img" aria-label="type">🏷️</span>,
    상세구분: <span role="img" aria-label="detail">🔎</span>,
    수량: <span role="img" aria-label="count">#️⃣</span>,
    시작일자: <span role="img" aria-label="start">📅</span>,
    종료일자: <span role="img" aria-label="end">📅</span>,
    투어인원: <span role="img" aria-label="person">👤</span>,
    배차: <span role="img" aria-label="car">🚗</span>,
    픽업위치: <span role="img" aria-label="pickup">📍</span>,
    드랍위치: <span role="img" aria-label="drop">📍</span>,
    금액: <span role="img" aria-label="money">💰</span>,
    합계: <span role="img" aria-label="sum">➕</span>,
    Email: <span role="img" aria-label="email">✉️</span>,
    투어비고: <span role="img" aria-label="memo">📝</span>
  };

  const [loading, setLoading] = useState(false);
  const [tourNameOptions, setTourNameOptions] = useState([]);
  const [tourTypeOptions, setTourTypeOptions] = useState([]);
  // const [tourDispatchOptions, setTourDispatchOptions] = useState([]); // 미사용 제거
  const [nameToTypes, setNameToTypes] = useState({});
  const [nameTypeToDispatch, setNameTypeToDispatch] = useState({});
  const [masterHeader, setMasterHeader] = useState([]);
  const [masterRows, setMasterRows] = useState([]);

  useEffect(() => {
    // 캐시에서 주문ID, 이메일 자동 입력
    const cachedOrderId = window.localStorage.getItem('reservation_orderId') || `ORD-${Date.now()}`;
    const cachedEmail = window.localStorage.getItem('user_email') || '';
    setFormData(prev => ({
      ...prev,
      서비스ID: SHEET_ID,
      주문ID: cachedOrderId,
      Email: cachedEmail
    }));
  }, [setFormData]);

  // 투어명/투어종류 옵션 로드 (tour 시트에서 해당 컬럼 값을 목록으로)
  useEffect(() => {
    async function fetchTourMaster() {
  const useProxy = (process.env.REACT_APP_USE_PROXY === 'true') || (typeof window !== 'undefined' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(window.location.origin));
  const url = useProxy ? `/api/append?sheet=tour` : `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/tour?key=${API_KEY}`;
  const res = await fetch(url);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (e) { data = { values: [] }; }
        try {
        const rows = data.values || [];
        if (rows.length < 2) {
          setTourNameOptions([]);
          setTourTypeOptions([]);
          setNameToTypes({});
          setNameTypeToDispatch({});
          return;
        }
  const header = rows[0].map(h => (h || '').toString());
        // find header indexes case-insensitively and trim
        const findIndexCI = (arr, target) => arr.findIndex(h => h && h.toString().trim().toLowerCase().includes(target));
        let idxName = findIndexCI(header, '투어명');
  let idxType = findIndexCI(header, '투어종류');
  let idxDispatch = findIndexCI(header, '배차');
        if (idxName === -1) {
          idxName = header.findIndex(h => h && h.trim().length > 0);
        }

        const nameSet = new Set();
        const map = {};
        const dispatchMapLocal = {};

        rows.slice(1).forEach(r => {
          const nm = idxName !== -1 ? r[idxName] : '';
          if (!nm) return;
          nameSet.add(nm);
          const tp = idxType !== -1 ? r[idxType] : '';
          if (tp) {
            if (!map[nm]) map[nm] = new Set();
            map[nm].add(tp);
          }
          if (idxDispatch !== -1) {
            const dispatchVal = r[idxDispatch] || '';
            const key = `${nm}||${tp}`;
            if (dispatchVal) {
              if (!dispatchMapLocal[key]) dispatchMapLocal[key] = new Set();
              dispatchMapLocal[key].add(dispatchVal);
            }
          }
        });

  setTourNameOptions(Array.from(nameSet).sort());
        const mapped = Object.fromEntries(Object.entries(map).map(([k, v]) => [k, Array.from(v).sort()]));
        setNameToTypes(mapped);
        const dispatchMapped = Object.fromEntries(Object.entries(dispatchMapLocal).map(([k, v]) => [k, Array.from(v).sort()]));
  setNameTypeToDispatch(dispatchMapped);
  // store raw rows/header for code lookup
  setMasterHeader(header);
  setMasterRows(rows.slice(1));
  setTourTypeOptions([]);
      } catch (e) {
        console.error('fetchTourMaster error', e);
        setTourNameOptions([]);
        setTourTypeOptions([]);
        setNameToTypes({});
        setNameTypeToDispatch({});
      }
    }
    fetchTourMaster();
  }, [setFormData]);

  // 결제방식 캐시 조회 (여러 키를 시도)
  const getCachedPaymentMethod = () => {
  const keys = ['payment_method', 'payment', '결제방식', '결제', 'payMethod', 'pay_method', 'pay_type', 'paymentMethod'];
    for (let k of keys) {
      const v = window.localStorage.getItem(k);
      if (v) return v;
    }
    return '';
  };

  // 투어코드 자동 채우기: 투어명, 투어종류, 배차, 결제방식(캐시)에 따라 검색
  const selName = formData['투어명'] || '';
  const selType = formData['투어종류'] || '';
  const selDispatch = formData['배차'] || '';
  const payment = getCachedPaymentMethod();
  const startVal = formData['시작일자'] || '';
  const endVal = formData['종료일자'] || '';
  useEffect(() => {
    if (!masterHeader || masterHeader.length === 0 || masterRows.length === 0) return;
    const name = selName;
    const type = selType;
    const dispatch = selDispatch;

    // helper to find column index case-insensitively
    const findIdx = (candidates) => {
      const normalized = masterHeader.map(h => (h || '').toString().trim().toLowerCase());
      for (let cand of candidates) {
        const idx = normalized.findIndex(h => h === cand.toString().trim().toLowerCase());
        if (idx !== -1) return idx;
      }
      return -1;
    };

  const idxName = findIdx(['투어명', 'tour name', 'tourname']);
  const idxType = findIdx(['투어종류', '투어 유형', '투어형식', 'type']);
  const idxDispatch = findIdx(['배차', 'dispatch']);
  const idxPay = findIdx(['결제방식', 'payment', '결제']);
  const idxCode = findIdx(['코드', '투어코드', 'code']);
  const idxStart = findIdx(['시작일자', 'start']);
  const idxEnd = findIdx(['종료일자', 'end']);

    const norm = s => (s || '').toString().trim();
    let foundCode = '';
  const formStartDate = startVal ? parseToDate(startVal) : null;
  const formEndDate = endVal ? parseToDate(endVal) : null;
    for (let r of masterRows) {
      const vName = idxName !== -1 ? norm(r[idxName]) : '';
      const vType = idxType !== -1 ? norm(r[idxType]) : '';
      const vDispatch = idxDispatch !== -1 ? norm(r[idxDispatch]) : '';
      const vPay = idxPay !== -1 ? norm(r[idxPay]) : '';
      // match non-empty conditions (normalize both sides)
      if (name && norm(name) !== vName) continue;
      if (type && norm(type) !== vType) continue;
      if (dispatch && norm(dispatch) !== vDispatch) continue;
      if (payment && idxPay !== -1 && norm(payment) !== vPay) continue;

      // if master provides start/end date columns, apply date-range filtering
      if ((formStartDate || formEndDate) && idxStart !== -1 && idxEnd !== -1) {
        const rawRowStart = r[idxStart] || '';
        const rawRowEnd = r[idxEnd] || '';
        if (!rawRowStart || !rawRowEnd) continue;
        const rowStart = parseToDate(rawRowStart);
        const rowEnd = parseToDate(rawRowEnd);
        if (!rowStart || !rowEnd) continue;
        // ensure form dates fall within master row start/end if provided
        if (formStartDate && (formStartDate < rowStart || formStartDate > rowEnd)) continue;
        if (formEndDate && (formEndDate < rowStart || formEndDate > rowEnd)) continue;
      }

      // if passes, get code
      if (idxCode !== -1) {
        foundCode = r[idxCode] || '';
        if (foundCode) break;
      }
    }
    setFormData(prev => ({ ...prev, 투어코드: foundCode }));
  }, [selName, selType, selDispatch, startVal, endVal, masterHeader, masterRows, payment, setFormData]);

  // 캐시된 결제방식을 투어비고에 자동 입력 (읽기 전용으로 보여줌)
  useEffect(() => {
    function applyPayment() {
      const pay = getCachedPaymentMethod();
      if (pay) {
        setFormData(prev => ({ ...prev, 투어비고: `결제방식: ${pay}` }));
      }
    }
    applyPayment();
    // storage 이벤트(다중 탭) 처리
    const onStorage = (e) => {
      if (!e.key) return;
      const keys = ['payment_method', 'payment', '결제방식', '결제', 'payMethod', 'pay_method', 'pay_type', 'paymentMethod'];
      if (keys.includes(e.key)) applyPayment();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [setFormData]);

  // 투어명 변경 시 해당 투어명의 종류만 노출되도록 필터링
  useEffect(() => {
    const selectedName = selName;
    const options = selectedName && nameToTypes[selectedName] ? nameToTypes[selectedName] : [];
    setTourTypeOptions(options.slice().sort());
    // 현재 선택된 투어종류가 옵션에 없으면 초기화
    if (selType && !options.includes(selType)) {
      setFormData(prev => ({ ...prev, 투어종류: '' }));
    }
  }, [selName, selType, nameToTypes, setFormData]);

  // 투어명 또는 투어종류 변경 시 배차 옵션 갱신
  useEffect(() => {
    const nm = selName;
    const tp = selType;
    const key = `${nm}||${tp}`;
    const opts = nameTypeToDispatch[key] || [];
    // 자동 입력: 옵션이 있으면 첫번째로 채우고, 없으면 초기화
    if (opts && opts.length > 0) {
      const first = opts.slice().sort()[0];
      setFormData(prev => ({ ...prev, 배차: first }));
    } else {
      setFormData(prev => ({ ...prev, 배차: '' }));
    }
  }, [selName, selType, nameTypeToDispatch, setFormData]);

  // 투어종류에서 첫 숫자를 추출하여 수량에 자동 설정 (사용자가 이미 수량을 입력한 경우 덮어쓰기 하지 않음)
  useEffect(() => {
    const tp = selType || '';
    const m = tp.match(/\d+/);
    if (m) {
      const num = Number(m[0]);
      setFormData(prev => ({ ...prev, 수량: prev['수량'] ? prev['수량'] : num }));
    }
  }, [selType, setFormData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
  // 실제 시트 헤더 순서에 맞춰 row 생성
  const fieldMap = Object.fromEntries(FIXED_HEADERS.map(h => [h.key, h.key]));
  const rowData = buildRowFromHeaders(headers.length ? headers : FIXED_HEADERS.map(h => h.key), formData, fieldMap);
      
      const appendUrl = process.env.REACT_APP_SHEET_APPEND_URL;
      const appendToken = process.env.REACT_APP_SHEET_APPEND_TOKEN;
  const useProxy = (process.env.REACT_APP_USE_PROXY === 'true') || (typeof window !== 'undefined' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(window.location.origin));
      const targetUrl = useProxy ? '/api/append' : appendUrl;
      if (!targetUrl) throw new Error('Append URL not configured. Set REACT_APP_SHEET_APPEND_URL in .env');
  // CSV 기준: 앱스스크립트는 클라이언트에서 'tour'를 받아 SH_T로 매핑함
  const payload = { service: 'tour', row: rowData };
      if (!useProxy && appendToken) payload.token = appendToken;
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json || !json.success) throw new Error(json && json.error ? json.error : 'Append failed');
  alert('투어 서비스 정보가 저장되었습니다.');
  setFormData({});
  if (typeof onServiceSubmitted === 'function') onServiceSubmitted();
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다: ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };  return (
    <div className="customer-info">
      <h2 className="step-title">투어 서비스 정보</h2>
      <form className="sheet-columns-form" onSubmit={handleSubmit}>
        {/* 투어명 */}
        <div className="form-group">
          <label htmlFor="sht_투어명" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {iconMap['투어명']}투어명
          </label>
          <select
            id="sht_투어명"
            value={formData['투어명'] || ''}
            onChange={e => handleInputChange('투어명', e.target.value)}
            required={FIXED_HEADERS.find(col => col.key === '투어명').required}
            disabled={tourNameOptions.length === 0}
          >
            <option value="">투어명 선택</option>
            {tourNameOptions.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {/* 투어종류 */}
        <div className="form-group">
          <label htmlFor="sht_투어종류" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {iconMap['투어종류']}투어종류
          </label>
          <select
            id="sht_투어종류"
            value={formData['투어종류'] || ''}
            onChange={e => handleInputChange('투어종류', e.target.value)}
            required={FIXED_HEADERS.find(col => col.key === '투어종류').required}
            disabled={tourTypeOptions.length === 0}
          >
            <option value="">투어종류 선택</option>
            {tourTypeOptions.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
  {/* 배차는 UI에서 숨김 처리됨 */}
        {/* 나머지 필드 */}
        {FIXED_HEADERS
          .filter(col => col.key !== '서비스ID' && col.key !== '주문ID' && col.key !== 'ID' && col.key !== '투어명' && col.key !== '투어종류' && col.key !== '배차' && col.key !== '수량' && col.key !== '상세구분' && col.key !== '금액' && col.key !== '합계' && col.key !== '투어코드' && col.key !== '투어비고')
          .map((col, idx) => (
            <div className="form-group" key={idx}>
              <label htmlFor={`sht_${col.key}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {iconMap[col.key]}{col.label}
              </label>
              {col.key === '투어코드' ? (
                <input
                  type={col.type}
                  id={`sht_${col.key}`}
                  value={formData[col.key] || ''}
                  readOnly
                  placeholder={col.label}
                  required={col.required}
                />
              ) : col.key === '수량' ? (
                <input
                  type={col.type}
                  id={`sht_${col.key}`}
                  value={formData[col.key] || ''}
                  readOnly
                  placeholder={col.label}
                  required={col.required}
                />
              ) : col.key === '투어비고' ? (
                <input
                  type={col.type}
                  id={`sht_${col.key}`}
                  value={formData[col.key] || ''}
                  readOnly
                  placeholder={col.label}
                  required={col.required}
                />
              ) : col.key === 'Email' ? (
                <input
                  type={col.type}
                  id={`sht_${col.key}`}
                  value={formData[col.key] || ''}
                  readOnly
                  placeholder={col.label}
                  required={col.required}
                />
              ) : col.key === '투어인원' ? (
                <input
                  type="number"
                  id={`sht_${col.key}`}
                  value={formData[col.key] || ''}
                  onChange={e => {
                    // keep digits only
                    const raw = (e.target.value || '').toString().replace(/\D+/g, '');
                    if (raw === '') {
                      handleInputChange(col.key, '');
                      return;
                    }
                    let num = Number(raw);
                    if (isNaN(num)) num = '';
                    // clamp to 1..20
                    if (num !== '') {
                      if (num < 1) num = 1;
                      if (num > 20) num = 20;
                    }
                    handleInputChange(col.key, num === '' ? '' : String(num));
                  }}
                  inputMode="numeric"
                  pattern="\d*"
                  min="1"
                  max="20"
                  step="1"
                  placeholder={col.label}
                  required={col.required}
                />
              ) : (
                <input
                  type={col.type}
                  id={`sht_${col.key}`}
                  value={formData[col.key] || ''}
                  onChange={e => handleInputChange(col.key, e.target.value)}
                  placeholder={col.label}
                  required={col.required}
                />
              )}
            </div>
          ))}
        <div className="form-footer-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
          <button
            type="button"
            style={{
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 18px',
              fontSize: '1.1rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
            }}
            onClick={() => window.location.href = '/'}
          >홈</button>
          <button
            type="submit"
            style={{
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 18px',
              fontSize: '1.1rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
            }}
            disabled={loading}
          >
            {loading ? '저장중...' : '저장 및 전송'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TourServiceForm;
