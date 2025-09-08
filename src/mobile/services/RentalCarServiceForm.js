import React, { useState, useEffect } from 'react';
import { buildRowFromHeaders } from '../../utils/rowBuilder';
import { fetchSheetData } from '../../utils/googleSheets';
import { buildIndexMap } from '../../utils/headerUtils';

const FIXED_HEADERS = [
  { key: 'ID', label: 'ID', type: 'text', required: false },
  { key: '주문ID', label: '주문ID', type: 'text', required: true },
  { key: '차량코드', label: '차량코드', type: 'text', required: false },
  { key: '구분', label: '구분을 선택하세요.', type: 'text', required: false },
  { key: '분류', label: '분류를 선택하세요.', type: 'text', required: false },
  { key: '경로', label: '경로를 선택하세요.', type: 'text', required: false },
  { key: '차량종류', label: '차량종류를 선택하세요.', type: 'text', required: false },
  { key: '차량대수', label: '차량대수를 선택하세요.', type: 'number', required: false },
  { key: '승차일자', label: '승차일자를 선택하세요.', type: 'date', required: false },
  { key: '승차시간', label: '승차시간을 선택하세요.', type: 'text', required: false },
  { key: '목적지', label: '목적지를 정확하게 입력하세요.', type: 'text', required: false },
  { key: '경유지', label: '경유지를 정확하게 입력하세요.', type: 'text', required: false },
  { key: '승차인원', label: '승차인원을 입력하세요.', type: 'number', required: false },
  { key: '사용기간', label: '사용기간을 선택하세요.', type: 'text', required: false },
  { key: '금액', label: '금액을 선택하세요.', type: 'number', required: false },
  { key: '합계', label: '합계를 선택하세요.', type: 'number', required: false },
  { key: 'Email', label: '이메일 주소를 선택하세요.', type: 'email', required: true }
];

function RentalCarServiceForm({ formData, setFormData, headers = [], onServiceSubmitted }) {
  // 컬럼별 아이콘 매핑
  const iconMap = {
    차량코드: <span role="img" aria-label="code">🔑</span>,
    구분: <span role="img" aria-label="type">🔄</span>,
    분류: <span role="img" aria-label="category">🏷️</span>,
    경로: <span role="img" aria-label="route">🛣️</span>,
    차량종류: <span role="img" aria-label="car">🚗</span>,
    차량대수: <span role="img" aria-label="count">#️⃣</span>,
    승차인원: <span role="img" aria-label="person">👤</span>,
    승차일자: <span role="img" aria-label="date">📅</span>,
    승차시간: <span role="img" aria-label="time">⏰</span>,
    승차장소: <span role="img" aria-label="place">📍</span>,
    캐리어갯수: <span role="img" aria-label="luggage">🧳</span>,
    목적지: <span role="img" aria-label="destination">🎯</span>,
    경유지: <span role="img" aria-label="stop">🛑</span>,
    사용기간: <span role="img" aria-label="period">📆</span>,
    금액: <span role="img" aria-label="money">💰</span>,
    합계: <span role="img" aria-label="sum">➕</span>,
    Email: <span role="img" aria-label="email">✉️</span>
  };
  // 승차인원 빈값 허용 (1 이상 제한 제거)
  const handlePassengerChange = value => {
    const num = Number(value);
    if (value === '' || isNaN(num)) {
      setFormData(prev => ({ ...prev, 승차인원: '' }));
    } else {
      setFormData(prev => ({ ...prev, 승차인원: num }));
    }
  };

  // extract common formData fields to simplify deps
  const 구분 = (formData && formData['구분']) || '';
  const 경로 = (formData && formData['경로']) || '';
  const 차량종류 = (formData && formData['차량종류']) || '';

  // 차량코드 자동입력 (구분/경로/차량종류)
  useEffect(() => {
    async function fetchCarCode() {
      try {
        const rows = await fetchSheetData('rcar');
        if (rows.length < 2) return setFormData(prev => ({ ...prev, 차량코드: '' }));
        const header = rows[0];
        const idx = buildIndexMap(header, {
          code: ['코드', '차량코드', 'code'],
          gubun: ['구분', 'gubun'],
          route: ['경로', '노선', 'route'],
          type: ['차종', '차량종류', '차량타입', 'type']
        });
        if ([idx.code, idx.gubun, idx.route, idx.type].some(v => v === -1)) return setFormData(prev => ({ ...prev, 차량코드: '' }));
        const found = rows.slice(1).find(row => (
          (row[idx.gubun] || '') === 구분 &&
          (row[idx.route] || '') === 경로 &&
          (row[idx.type] || '') === 차량종류
        ));
        setFormData(prev => ({ ...prev, 차량코드: found ? (found[idx.code] || '') : '' }));
      } catch (e) {
        setFormData(prev => ({ ...prev, 차량코드: '' }));
      }
    }
    if (구분 && 경로 && 차량종류) {
      fetchCarCode();
    } else {
      setFormData(prev => ({ ...prev, 차량코드: '' }));
    }
  }, [구분, 경로, 차량종류, setFormData]);
  const [carTypeOptions, setCarTypeOptions] = useState([]);
  // 차량종류 옵션 동적 생성 (구분/분류/경로 조건)
  useEffect(() => {
    async function fetchCarTypeOptions() {
      try {
        const rows = await fetchSheetData('rcar');
        if (rows.length < 2) return setCarTypeOptions([]);
        const header = rows[0];
        const idx = buildIndexMap(header, {
          type: ['차종', '차량종류', '차량타입', 'type'],
          gubun: ['구분', 'gubun'],
          route: ['경로', '노선', 'route']
        });
        if (idx.type === -1 || idx.gubun === -1 || idx.route === -1) return setCarTypeOptions([]);
        // 조건 필터링: 구분 + 경로 기준으로 필터
      let filtered = rows.slice(1).filter(row => (row[idx.gubun] || '') === 구분 && (row[idx.route] || '') === 경로);
        const typeRaw = filtered.map(row => row[idx.type]).filter(v => v);
        setCarTypeOptions(Array.from(new Set(typeRaw)));
      } catch (e) {
        setCarTypeOptions([]);
      }
    }
  if (구분 && 경로) {
      fetchCarTypeOptions();
    } else {
      setCarTypeOptions([]);
    }
  }, [구분, 경로]);
  const [routeOptions, setRouteOptions] = useState([]);
  // 경로 옵션 동적 생성 (구분/분류 조건)
  useEffect(() => {
    async function fetchRouteOptions() {
      try {
        const rows = await fetchSheetData('rcar');
        if (rows.length < 2) return setRouteOptions([]);
        const header = rows[0];
        const idx = buildIndexMap(header, {
          route: ['경로', '노선', 'route'],
          gubun: ['구분', 'gubun']
        });
        if (idx.route === -1 || idx.gubun === -1) return setRouteOptions([]);
        // 조건 필터링 — 구분 기준으로 필터
  let filtered = rows.slice(1).filter(row => (row[idx.gubun] || '') === 구분);
        const routeRaw = filtered.map(row => row[idx.route]).filter(v => v);
        setRouteOptions(Array.from(new Set(routeRaw)));
      } catch (e) {
        setRouteOptions([]);
      }
    }
    if (구분) {
      fetchRouteOptions();
    } else {
      setRouteOptions([]);
    }
  }, [구분]);
  const [loading, setLoading] = useState(false);
  // navigate imported but not used in this form

  // 구분 기본값 왕복, 차량대수 기본값 1
  useEffect(() => {
    const cachedOrderId = window.localStorage.getItem('reservation_orderId') || `ORD-${Date.now()}`;
    const cachedEmail = window.localStorage.getItem('user_email') || '';
    setFormData(prev => ({
      ...prev,
      서비스ID: process.env.REACT_APP_SHEET_ID,
      주문ID: cachedOrderId,
      Email: cachedEmail,
      구분: prev['구분'] || '왕복 당일',
      차량대수: prev['차량대수'] || 1
    }));
  }, [setFormData]);

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
  // CSV 기준: 앱스스크립트는 클라이언트에서 'rcar'를 받아 SH_RC로 매핑함
  const payload = { service: 'rcar', row: rowData };
      if (!useProxy && appendToken) payload.token = appendToken;
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json || !json.success) throw new Error(json && json.error ? json.error : 'Append failed');
  alert('렌트카 서비스 정보가 저장되었습니다.');
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
      <h2 className="step-title">렌트카 서비스 정보</h2>
      <div style={{
        background: '#e8f6ff',
        border: '1px solid #cceeff',
        padding: '10px 12px',
        borderRadius: '8px',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '1.2rem' }} aria-hidden>ℹ️</div>
        <div>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>안내</div>
          <div>왕복은 픽업 드랍 각각 입력 저장 하셔야 합니다. ^^</div>
        </div>
      </div>
      <form className="sheet-columns-form" onSubmit={handleSubmit}>
        {FIXED_HEADERS
          .filter(col => col.key !== '서비스ID' && col.key !== '주문ID' && col.key !== 'ID' && col.key !== '차량코드' && col.key !== '사용기간' && col.key !== '금액' && col.key !== '합계')
          .map((col, idx) => (
            <div className="form-group" key={idx}>
              <label htmlFor={`shrc_${col.key}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {iconMap[col.key]}{col.label}
              </label>
              {col.key === '구분' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['왕복 당일', '왕복 다른날', '편도'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      style={{
                        backgroundColor: formData['구분'] === opt ? '#007bff' : '#f0f0f0',
                        color: formData['구분'] === opt ? '#fff' : '#333',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '6px 16px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleInputChange('구분', opt)}
                    >{opt}</button>
                  ))}
                </div>
              ) : col.key === '분류' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['픽업', '드랍'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      style={{
                        backgroundColor: formData['분류'] === opt ? '#007bff' : '#f0f0f0',
                        color: formData['분류'] === opt ? '#fff' : '#333',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '6px 16px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleInputChange('분류', opt)}
                    >{opt}</button>
                  ))}
                </div>
              ) : col.key === '경로' ? (
                <select
                  id={`shrc_경로`}
                  value={formData['경로'] || ''}
                  onChange={e => handleInputChange('경로', e.target.value)}
                  required={col.required}
                  disabled={routeOptions.length === 0}
                >
                  <option value="">경로 선택</option>
                  {routeOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : col.key === '차량종류' ? (
                <select
                  id={`shrc_차량종류`}
                  value={formData['차량종류'] || ''}
                  onChange={e => handleInputChange('차량종류', e.target.value)}
                  required={col.required}
                  disabled={carTypeOptions.length === 0}
                >
                  <option value="">차량종류 선택</option>
                  {carTypeOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : col.key === '차량대수' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1,2,3,4,5,6,7].map(num => (
                    <button
                      key={num}
                      type="button"
                      style={{
                        backgroundColor: String(formData['차량대수']) === String(num) ? '#007bff' : '#f0f0f0',
                        color: String(formData['차량대수']) === String(num) ? '#fff' : '#333',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleInputChange('차량대수', num)}
                    >{num}</button>
                  ))}
                </div>
              ) : col.key === '승차인원' ? (
                <input
                  type="number"
                  id={`shrc_승차인원`}
                  value={formData['승차인원'] || ''}
                  onChange={e => handlePassengerChange(e.target.value)}
                  onKeyPress={(e) => {
                    // 숫자, 백스페이스, 삭제, 화살표 키만 허용
                    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder={col.label}
                  required={col.required}
                  style={{
                    WebkitAppearance: 'auto',
                    MozAppearance: 'textfield',
                    appearance: 'auto'
                  }}
                />
              ) : col.key === '승차시간' ? (
                <input
                  type="time"
                  id={`shrc_승차시간`}
                  value={formData['승차시간'] || ''}
                  onChange={e => handleInputChange('승차시간', e.target.value)}
                  placeholder={col.label}
                  required={col.required}
                />
              ) : col.key === 'Email' ? (
                <input
                  type={col.type}
                  id={`shrc_${col.key}`}
                  value={formData[col.key] || ''}
                  readOnly
                  placeholder={col.label}
                  required={col.required}
                />
              ) : (
                <input
                  type={col.type}
                  id={`shrc_${col.key}`}
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

export default RentalCarServiceForm;
