import React, { useState, useEffect } from 'react';
import { fetchSheetData } from '../../utils/googleSheets';
import { buildIndexMap } from '../../utils/headerUtils';
import { buildRowFromHeaders } from '../../utils/rowBuilder';

const FIXED_HEADERS = [
  { key: 'ID', label: 'ID', type: 'text', required: false },
  { key: '주문ID', label: '주문ID', type: 'text', required: true },
  { key: '구분', label: '구분을 선택하세요.', type: 'text', required: false },
  { key: '분류', label: '분류를 선택하세요.', type: 'text', required: false },
  { key: '크루즈', label: '크루즈를 선택하세요.', type: 'text', required: false },
  { key: '차량종류', label: '차량종류를 선택하세요.', type: 'text', required: false },
  { key: '차량코드', label: '차량코드를 선택하세요.', type: 'text', required: false },
  { key: '차량수', label: '차량수를 선택하세요.', type: 'number', required: false },
  { key: '승차인원', label: '승차인원을 선택하세요.', type: 'number', required: false },
  { key: '승차일시', label: '승차일시를 선택하세요.', type: 'date', required: false },
  { key: '승차위치', label: '승차위치를 입력하세요.', type: 'text', required: false },
  { key: '하차위치', label: '하차위치를 입력하세요.', type: 'text', required: false },
  { key: '수량', label: '수량을 선택하세요.', type: 'number', required: false },
  { key: '금액', label: '금액을 선택하세요.', type: 'number', required: false },
  { key: '합계', label: '합계를 선택하세요.', type: 'number', required: false },
  { key: 'Email', label: '이메일 주소를 입력하세요.', type: 'email', required: true }
];

// reading uses proxy-aware fetchSheetData; no direct API keys here

function CarServiceForm({ formData, setFormData, headers = [], onServiceSubmitted }) {
  // 차량수 기본값 1로 설정
  useEffect(() => {
    // 최초 마운트 시에만 기본값 주입
    setFormData(prev => (prev['차량수'] ? prev : { ...prev, 차량수: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFormData]);
  // 금액 자동입력: 구분, 일정(캐시), 크루즈, 종류, 승차인원 5가지 조건 만족하는 금액
  // slice frequently used fields to simplify deps
  const 차량코드 = (formData && formData['차량코드']) || '';
  const 크루즈 = (formData && formData['크루즈']) || '';
  const 구분 = (formData && formData['구분']) || '';
  const 차량종류 = (formData && formData['차량종류']) || '';

  useEffect(() => {
    async function fetchCarAmount() {
      try {
  const code = 차량코드 || '';
        if (!code) {
          setFormData(prev => ({ ...prev, 금액: '' }));
          return;
        }
        const rows = await fetchSheetData('car');
        if (rows.length < 2) {
          setFormData(prev => ({ ...prev, 금액: '' }));
          return;
        }
        const header = rows[0];
        const idx = buildIndexMap(header, {
          code: ['코드', '차량코드', 'code'],
          amount: ['금액', 'amount']
        });
        if (idx.code === -1 || idx.amount === -1) {
          setFormData(prev => ({ ...prev, 금액: '' }));
          return;
        }
        const found = rows.slice(1).find(row => (row[idx.code] || '') === code);
        setFormData(prev => ({ ...prev, 금액: found ? (found[idx.amount] || '') : '' }));
      } catch (e) {
        setFormData(prev => ({ ...prev, 금액: '' }));
      }
    }
    fetchCarAmount();
  }, [차량코드, setFormData]);
  // 차량코드 자동입력: 구분, 일정(캐시), 크루즈, 종류 4가지 조건 만족하는 코드
  useEffect(() => {
    async function fetchCarCode() {
      try {
      const cachedSchedule = window.localStorage.getItem('schedule_value') || '';
      const cruise = 크루즈;
      const gubun = 구분;
      const type = 차량종류;
        if (!gubun || !cachedSchedule || !cruise || !type) {
          setFormData(prev => ({ ...prev, 차량코드: '' }));
          return;
        }
        const rows = await fetchSheetData('car');
        if (rows.length < 2) {
          setFormData(prev => ({ ...prev, 차량코드: '' }));
          return;
        }
        const header = rows[0];
        const idx = buildIndexMap(header, {
          gubun: ['구분', 'gubun'],
          schedule: ['일정', 'schedule'],
          cruise: ['크루즈', 'cruise'],
          type: ['종류', '차량종류', '차종', 'type'],
          code: ['코드', '차량코드', 'code']
        });
        const found = rows.slice(1).find(row =>
          (idx.gubun === -1 || (row[idx.gubun] || '') === gubun) &&
          (idx.schedule === -1 || (row[idx.schedule] || '') === cachedSchedule) &&
          (idx.cruise === -1 || (row[idx.cruise] || '') === cruise) &&
          (idx.type === -1 || (row[idx.type] || '') === type)
        );
        setFormData(prev => ({ ...prev, 차량코드: (found && idx.code !== -1) ? (found[idx.code] || '') : '' }));
      } catch (e) {
        setFormData(prev => ({ ...prev, 차량코드: '' }));
      }
    }
    fetchCarCode();
  }, [구분, 크루즈, 차량종류, setFormData]);
  const [carTypeOptions, setCarTypeOptions] = useState([]);

  // 차량종류 목록 fetch: 구분, 일정(캐시), 크루즈 조건 만족하는 유일값만
  useEffect(() => {
    async function fetchCarTypes() {
      try {
        const cachedSchedule = window.localStorage.getItem('schedule_value') || '';
        const cruise = 크루즈;
        const gubun = 구분;
        const rows = await fetchSheetData('car');
        if (rows.length < 2) return setCarTypeOptions([]);
        const header = rows[0];
        const idx = buildIndexMap(header, {
          gubun: ['구분', 'gubun'],
          schedule: ['일정', 'schedule'],
          cruise: ['크루즈', 'cruise'],
          type: ['종류', '차량종류', '차종', 'type']
        });
        let filtered = rows.slice(1);
        if (idx.gubun !== -1 && gubun) filtered = filtered.filter(row => (row[idx.gubun] || '') === gubun);
        if (idx.schedule !== -1 && cachedSchedule) filtered = filtered.filter(row => (row[idx.schedule] || '') === cachedSchedule);
        if (idx.cruise !== -1 && cruise) filtered = filtered.filter(row => (row[idx.cruise] || '') === cruise);
        if (idx.type !== -1) {
          const types = filtered.map(row => row[idx.type]).filter(v => v);
          setCarTypeOptions(Array.from(new Set(types)));
        } else {
          setCarTypeOptions([]);
        }
      } catch (e) {
        setCarTypeOptions([]);
      }
    }
    fetchCarTypes();
  }, [구분, 크루즈]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    // 캐시에서 주문ID, 이메일 자동 입력 (간단 초기화)
    const cachedOrderId = window.localStorage.getItem('reservation_orderId') || `ORD-${Date.now()}`;
    const cachedEmail = window.localStorage.getItem('user_email') || '';
    setFormData(prev => ({
      ...prev,
      서비스ID: process.env.REACT_APP_SHEET_ID,
      주문ID: cachedOrderId,
      Email: cachedEmail
    }));
  }, [setFormData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 수량 수립 규칙:
      // - 차량종류에 '셔틀'이 포함되어 있으면 기본적으로 '승차인원'을 수량으로 사용
      // - 단, 차량종류에 '스테이하롱' 또는 '리무진' 또는 '단독'이 포함된 경우에는 '차량수'를 사용
      // - '셔틀'이 포함되어 있지 않으면 '차량수'를 사용
      const typeRaw = (formData['차량종류'] || '').toString().trim().toLowerCase();
      const overrideKeywords = ['스테이하롱', '리무진', '단독'].map(s => s.toLowerCase());
      const hasShuttle = typeRaw.includes('셔틀');
      const hasOverride = overrideKeywords.some(k => typeRaw.includes(k));
      let computedQuantity;
      if (hasShuttle && !hasOverride) {
        computedQuantity = Number(formData['승차인원']) || Number(formData['차량수']) || 1;
      } else {
        computedQuantity = Number(formData['차량수']) || 1;
      }

      // 만들어질 행에는 수량 필드를 반영한 계산된 formData를 사용
      const computedFormData = { ...formData, 수량: computedQuantity };

      // 실제 시트 헤더 순서에 맞춰 row 생성
      const fieldMap = {
        'ID': 'ID',
        '주문ID': '주문ID',
        '구분': '구분',
        '분류': '분류',
        '크루즈': '크루즈',
        '차량종류': '차량종류',
        '차량코드': '차량코드',
        '차량수': '차량수',
        '승차인원': '승차인원',
        '승차일시': '승차일시',
        '승차위치': '승차위치',
        '하차위치': '하차위치',
        '수량': '수량',
        '금액': '금액',
        '합계': '합계',
        'Email': 'Email',
      };
      const rowData = buildRowFromHeaders(headers.length ? headers : FIXED_HEADERS.map(h => h.key), computedFormData, fieldMap);
      
      const appendUrl = process.env.REACT_APP_SHEET_APPEND_URL;
      const appendToken = process.env.REACT_APP_SHEET_APPEND_TOKEN;
  const useProxy = (process.env.REACT_APP_USE_PROXY === 'true') || (typeof window !== 'undefined' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(window.location.origin));
      const targetUrl = useProxy ? '/api/append' : appendUrl;
      if (!targetUrl) throw new Error('Append URL not configured. Set REACT_APP_SHEET_APPEND_URL in .env');
  // 서버(Apps Script)에서 'car'를 SH_C로 매핑함
  const payload = { service: 'car', row: rowData };
      if (!useProxy && appendToken) payload.token = appendToken;
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json || !json.success) throw new Error(json && json.error ? json.error : 'Append failed');
  alert('차량 서비스 정보가 저장되었습니다.');
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
      <h2 className="step-title">크루즈 차량 정보</h2>
      {/* 상단 안내 문구 - 항상 표시 */}
      <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#e7f3ff', border: '1px solid #b6e0ff', borderRadius: '6px', color: '#084298', display: 'flex', alignItems: 'center', gap: '8px' }} role="status" aria-live="polite">
        <span aria-hidden style={{ fontSize: '18px' }}>ℹ️</span>
        <div>
          <div style={{ fontWeight: 600 }}>안내</div>
          <div style={{ fontSize: '13px' }}> 왕복은 픽업 샌딩 2번 입력하시고 각각 저장하셔야 합니다. ^^</div>
        </div>
      </div>
      <form className="sheet-columns-form" onSubmit={handleSubmit}>
        {FIXED_HEADERS
            .filter(col => {
              // 기본적으로 제외할 열
              const exclude = ['서비스ID', '주문ID', 'ID', '차량코드', '금액', '합계', '크루즈', '수량'];
              if (exclude.includes(col.key)) return false;
              const gubun = formData['분류'];
              // 픽업이면 하차위치 숨김
              if (col.key === '하차위치' && gubun === '픽업') return false;
              // 드랍이면 승차위치 숨김
              if (col.key === '승차위치' && gubun === '드랍') return false;
              return true;
            })
          .map((col, idx) => (
            <div className="form-group" key={idx}>
              <label htmlFor={`shc_${col.key}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* 심플 아이콘 조건별 표시 */}
                {col.key === '구분' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="4" y="4" width="8" height="8" rx="2" stroke="#6f42c1" strokeWidth="2"/></svg>
                )}
                {col.key === '분류' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#007bff" strokeWidth="2"/></svg>
                )}
                {col.key === '크루즈' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="10" rx="6" ry="3" stroke="#17a2b8" strokeWidth="2"/><rect x="6" y="3" width="4" height="5" rx="2" fill="#17a2b8"/></svg>
                )}
                {col.key === '차량종류' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="6" rx="2" stroke="#ffc107" strokeWidth="2"/><rect x="6" y="4" width="4" height="3" rx="1.5" fill="#ffc107"/></svg>
                )}
                {col.key === '차량코드' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" rx="2" stroke="#343a40" strokeWidth="2"/></svg>
                )}
                {col.key === '차량수' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="6" rx="2" stroke="#007bff" strokeWidth="2"/><rect x="7" y="4" width="4" height="3" rx="1.5" fill="#007bff"/></svg>
                )}
                {col.key === '승차인원' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="4" y="4" width="8" height="8" rx="2" stroke="#28a745" strokeWidth="2"/><text x="8" y="11" textAnchor="middle" fontSize="8" fill="#28a745">승</text></svg>
                )}
                {col.key === '승차일시' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="10" rx="2" stroke="#007bff" strokeWidth="2"/><rect x="5" y="1" width="6" height="2" rx="1" fill="#007bff"/></svg>
                )}
                {col.key === '승차위치' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#fd7e14" strokeWidth="2"/><rect x="7" y="7" width="2" height="2" rx="1" fill="#fd7e14"/></svg>
                )}
                {col.key === '하차위치' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#20c997" strokeWidth="2"/><rect x="7" y="7" width="2" height="2" rx="1" fill="#20c997"/></svg>
                )}
                {col.key === '수량' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="6" rx="2" stroke="#007bff" strokeWidth="2"/></svg>
                )}
                {col.key === '금액' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#28a745" strokeWidth="2"/><text x="8" y="11" textAnchor="middle" fontSize="8" fill="#28a745">₩</text></svg>
                )}
                {col.key === '합계' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="4" y="4" width="8" height="8" rx="2" stroke="#343a40" strokeWidth="2"/><text x="8" y="11" textAnchor="middle" fontSize="8" fill="#343a40">Σ</text></svg>
                )}
                {col.key === 'Email' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="8" rx="2" stroke="#343a40" strokeWidth="2"/><path d="M2 4l6 5 6-5" stroke="#343a40" strokeWidth="2"/></svg>
                )}
                {col.label}
              </label>
              {col.key === '구분' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    style={{
                      backgroundColor: formData['구분'] === '왕복' ? '#007bff' : '#f0f0f0',
                      color: formData['구분'] === '왕복' ? '#fff' : '#333',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '6px 16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleInputChange('구분', '왕복')}
                  >왕복</button>
                  <button
                    type="button"
                    style={{
                      backgroundColor: formData['구분'] === '편도' ? '#007bff' : '#f0f0f0',
                      color: formData['구분'] === '편도' ? '#fff' : '#333',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '6px 16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleInputChange('구분', '편도')}
                  >편도</button>
                </div>
              ) : col.key === '분류' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    style={{
                      backgroundColor: formData['분류'] === '픽업' ? '#007bff' : '#f0f0f0',
                      color: formData['분류'] === '픽업' ? '#fff' : '#333',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '6px 16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleInputChange('분류', '픽업')}
                  >픽업</button>
                  <button
                    type="button"
                    style={{
                      backgroundColor: formData['분류'] === '드랍' ? '#007bff' : '#f0f0f0',
                      color: formData['분류'] === '드랍' ? '#fff' : '#333',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '6px 16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleInputChange('분류', '드랍')}
                  >드랍</button>
                </div>
              ) : col.key === '차량종류' ? (
                <select
                  id={`shc_차량종류`}
                  value={formData['차량종류'] || ''}
                  onChange={e => handleInputChange('차량종류', e.target.value)}
                  required={col.required}
                >
                  <option value="">차량종류 선택</option>
                  {carTypeOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : col.key === '금액' ? (
                <input
                  type={col.type}
                  id={`shc_금액`}
                  value={String(formData['금액'])}
                  readOnly
                  placeholder={col.label}
                  required={col.required}
                  style={{ backgroundColor: '#f8f9fa', color: '#333', fontWeight: 'bold' }}
                />
              ) : col.key === '차량수' || col.key === '승차인원' ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1,2,3,4,5,6,7].map(num => (
                    <button
                      key={num}
                      type="button"
                      style={{
                        backgroundColor: String(formData[col.key]) === String(num) ? '#007bff' : '#f0f0f0',
                        color: String(formData[col.key]) === String(num) ? '#fff' : '#333',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleInputChange(col.key, num)}
                    >{num}</button>
                  ))}
                </div>
              ) : (col.key === '승차위치' || col.key === '하차위치') ? (
                <div>
                  <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#e7f3ff', border: '1px solid #b6e0ff', borderRadius: '6px', color: '#084298', display: 'flex', alignItems: 'center', gap: '8px' }} role="status" aria-live="polite">
                    <span aria-hidden style={{ fontSize: '16px' }}>ℹ️</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>위치 입력 안내</div>
                      <div style={{ fontSize: '13px' }}>{formData['분류'] === '픽업' ? '픽업 선택 시 승차 위치만 입력하세요.' : formData['분류'] === '드랍' ? '드랍 선택 시 하차 위치만 입력하세요.' : '픽업이면 승차 위치, 드랍이면 하차 위치를 입력하세요.'}</div>
                    </div>
                  </div>
                  <input
                    type={col.type}
                    id={`shc_${col.key}`}
                    value={formData[col.key] || ''}
                    onChange={e => handleInputChange(col.key, e.target.value)}
                    placeholder={col.label}
                    required={col.required}
                  />
                </div>
              ) : (
                <input
                  type={col.type}
                  id={`shc_${col.key}`}
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

export default CarServiceForm;
