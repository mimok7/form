import React, { useState, useEffect } from 'react';
import { buildRowFromHeaders } from '../../utils/rowBuilder';
import { getAirportRoutesByType } from '../../utils/airportRoute';
import { getAirportCarTypes } from '../../utils/airportCarType';
import { getAirportCarPrice } from '../../utils/airportCarPrice';
const FIXED_HEADERS = [
  { key: 'ID', label: 'ID', type: 'text', required: false },
  { key: '주문ID', label: '주문ID', type: 'text', required: true },
  { key: '구분', label: '구분을 선택하세요.', type: 'text', required: false },
  { key: '분류', label: '분류를 선택하세요.', type: 'text', required: false },
  { key: '경로', label: '경로를 선택하세요.', type: 'text', required: false },
  { key: '차량코드', label: '차량코드를 선택하세요.', type: 'text', required: false },
  { key: '차량종류', label: '차량종류를 선택하세요.', type: 'text', required: false },
  { key: '일자', label: '일자를 선택하세요.', type: 'date', required: false },
  { key: '시간', label: '시간을 선택하세요.', type: 'text', required: false },
  { key: '공항명', label: '공항명을 선택하세요.', type: 'text', required: false },
  { key: '항공편', label: '항공편을 선택하세요.', type: 'text', required: false },
  { key: '승차인원', label: '승차인원을 선택하세요.', type: 'number', required: false },
  { key: '캐리어수량', label: '캐리어수량을 선택하세요.', type: 'number', required: false },
  { key: '패스트', label: '패스트를 선택하세요.', type: 'text', required: false },
  { key: '장소명', label: '장소명을 입력하세요.', type: 'text', required: false },
  { key: '경유지', label: '경유지를 선택하세요.', type: 'text', required: false },
  { key: '경유지대기시간', label: '경유지대기시간을 선택하세요.', type: 'number', required: false },
  { key: '차량수', label: '차량수를 선택하세요.', type: 'number', required: false },
  { key: '금액', label: '금액을 선택하세요.', type: 'number', required: false },
  { key: '합계', label: '합계를 선택하세요.', type: 'number', required: false },
  { key: 'Email', label: '이메일 주소', type: 'email', required: true },

];

const LABEL_ICONS = {
  '승차인원': '👤',
  '캐리어수량': '🧳',
  '차량수': '🚗',
  '시간': '⏰',
  '장소명': '📍',
  '공항명': '✈️',
  '경로': '🛣️',
  '차량종류': '🚙',
  '차량코드': '🔑',
  '금액': '💰',
  '패스트': '⚡',
  '분류': '🔄',
  '구분': '🏷️',
  'ID': '🆔',
  '주문ID': '📝',
  '서비스ID': '🗂️',
  '일자': '📅',
  '항공편': '🛫',
  '경유지': '🔁',
  '경유지대기시간': '⏳',
  '합계': '🧮',
  'Email': '📧',
};

const SHEET_ID = process.env.REACT_APP_SHEET_ID;
// API_KEY not used in this module

function AirportServiceForm({ formData, setFormData, headers = [], onServiceSubmitted }) {
  // frequently-used fields sliced out to keep deps simple for hooks
  const 분류 = (formData && formData['분류']) || '';
  const 경로 = (formData && formData['경로']) || '';
  const 차량종류 = (formData && formData['차량종류']) || '';
  const 차량코드 = (formData && formData['차량코드']) || '';

  // 금액 자동입력: 경로/분류/차종/코드 값이 모두 선택되면 금액값 자동 입력
  useEffect(() => {
    async function fetchCarPrice() {
      const type = 분류;
      const route = 경로;
      const carType = 차량종류;
      const code = 차량코드;
      if (type && route && carType && code) {
        try {
          const price = await getAirportCarPrice(type, route, carType, code);
          setFormData(prev => ({ ...prev, 금액: price }));
        } catch (e) {
          setFormData(prev => ({ ...prev, 금액: '' }));
        }
      } else {
        setFormData(prev => ({ ...prev, 금액: '' }));
      }
    }
    fetchCarPrice();
  }, [분류, 경로, 차량종류, 차량코드, setFormData]);
  const [carTypeOptions, setCarTypeOptions] = useState([]);
  const [routeOptions, setRouteOptions] = useState([]);
  const [timeError, setTimeError] = useState('');
  const [validTime, setValidTime] = useState(true);
  // 구분, 분류 기본값 설정
  useEffect(() => {
    // set defaults only on first render
    if (!formData['구분']) {
      setFormData(prev => ({ ...prev, 구분: '왕복' }));
    }
    if (!formData['분류']) {
      setFormData(prev => ({ ...prev, 분류: '픽업' }));
    }
  }, [formData, setFormData]);

  // 분류값 변경 시 경로 목록 갱신
  useEffect(() => {
    async function fetchRoutes() {
      const type = 분류 || '픽업';
      const routes = await getAirportRoutesByType(type);
      setRouteOptions(routes);
    }
    fetchRoutes();
  }, [분류]);

  // 경로/분류값 변경 시 차량종류 목록 갱신
  useEffect(() => {
    async function fetchCarTypes() {
      const type = 분류 || '픽업';
      const route = 경로 || '';
      if (route) {
        const carTypes = await getAirportCarTypes(type, route);
        setCarTypeOptions(carTypes);
      } else {
        setCarTypeOptions([]);
      }
    }
    fetchCarTypes();
  }, [분류, 경로]);
  const [loading, setLoading] = useState(false);
  // navigate from react-router not used here

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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 실제 시트 헤더 순서에 맞춰 row 생성
      const fieldMap = {
        'ID': 'ID',
        '주문ID': '주문ID',
        '구분': '구분',
        '분류': '분류',
        '경로': '경로',
        '차량코드': '차량코드',
        '차량종류': '차량종류',
        '일자': '일자',
        '시간': '시간',
        '공항명': '공항명',
        '항공편': '항공편',
        '승차인원': '승차인원',
        '캐리어수량': '캐리어수량',
        '패스트': '패스트',
        '장소명': '장소명',
        '경유지': '경유지',
        '경유지대기시간': '경유지대기시간',
        '차량수': '차량수',
        '금액': '금액',
        '합계': '합계',
        'Email': 'Email',
      };
      const rowData = buildRowFromHeaders(headers.length ? headers : FIXED_HEADERS.map(h => h.key), formData, fieldMap);
      
      const appendUrl = process.env.REACT_APP_SHEET_APPEND_URL;
      const appendToken = process.env.REACT_APP_SHEET_APPEND_TOKEN; // direct mode token
  const useProxy = (process.env.REACT_APP_USE_PROXY === 'true') || (typeof window !== 'undefined' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(window.location.origin));
      const targetUrl = useProxy ? '/api/append' : appendUrl;
      if (!targetUrl) throw new Error('Append URL not configured. Set REACT_APP_SHEET_APPEND_URL in .env');
  // 서버(Apps Script)에서 'airport'를 SH_P로 매핑함
  const payload = { service: 'airport', row: rowData };
      if (!useProxy && appendToken) payload.token = appendToken;
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json || !json.success) throw new Error(json && json.error ? json.error : 'Append failed');
  alert('공항 서비스 정보가 저장되었습니다.');
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
      <h2 className="step-title">공항 픽업/샌딩 정보</h2>
      <form className="sheet-columns-form" onSubmit={handleSubmit}>
        {formData['구분'] === '왕복' && (
          <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#e7f3ff', border: '1px solid #b6e0ff', borderRadius: '6px', color: '#084298', display: 'flex', alignItems: 'center', gap: '8px' }} role="status" aria-live="polite">
            <span aria-hidden style={{ fontSize: '18px' }}>ℹ️</span>
            <div>
              <div style={{ fontWeight: 600 }}>안내</div>
              <div style={{ fontSize: '12px' }}>필요한 서비스을 픽업/샌딩으로 각각 입력하시고 저장하세요(경로가 변경되지 않으면 조금만 기다려 주세요 네트워크 상태에 따라 시간이 걸립니다.).</div>
            </div>
          </div>
        )}
        {FIXED_HEADERS
          .filter(col => col.key !== '서비스ID' && col.key !== '주문ID' && col.key !== 'ID' && col.key !== '장소명' && col.key !== '구분' && col.key !== '차량코드' && col.key !== '금액' && col.key !== '합계' && col.key !== '패스트')
          .map((col, idx) => (
            <React.Fragment key={col.key}>
              <div className="form-group">
                <label htmlFor={`shp_${col.key}`} style={{ fontWeight: 'normal', fontSize: '12px' }}>
                  {(LABEL_ICONS[col.key] || '📄')} {col.label}
                </label>
                {['승차인원', '캐리어수량', '차량수'].includes(col.key) ? (
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    {[1,2,3,4,5,6,7].map(num => (
                      <button
                        key={num}
                        type="button"
                        style={{
                          backgroundColor: String(formData[col.key]) === String(num) ? '#007bff' : '#f0f0f0',
                          color: String(formData[col.key]) === String(num) ? '#fff' : '#333',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          padding: '4px 12px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleInputChange(col.key, num)}
                      >{num}</button>
                    ))}
                  </div>
                ) : col.key === '분류' ? (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
                    {['픽업', '샌딩'].map(opt => (
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
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleInputChange('분류', opt)}
                      >{opt}</button>
                    ))}
                  </div>
                ) : col.key === '구분' ? (
                  <input
                    type="text"
                    id={`shp_${col.key}`}
                    value={"공항"}
                    readOnly
                    style={{ background: '#f0f0f0', color: '#888' }}
                  />
                ) : col.key === '시간' ? (
                  <>
                    <input
                      type="time"
                      id={`shp_${col.key}`}
                      value={formData[col.key] || ''}
                      onChange={e => {
                        const val = e.target.value; // HH:MM
                        handleInputChange(col.key, val);
                        // validate: disallow times between 22:01 and 07:59 (inclusive)
                        if (!val) {
                          setTimeError('');
                          setValidTime(true);
                          return;
                        }
                        const [hhStr, mmStr] = val.split(':');
                        const hh = parseInt(hhStr, 10);
                        const mm = parseInt(mmStr, 10);
                        if (Number.isNaN(hh) || Number.isNaN(mm)) {
                          setTimeError('올바른 시간을 입력하세요.');
                          setValidTime(false);
                          return;
                        }
                        const minutes = hh * 60 + mm;
                        // Block when minutes >= 22:01 (22*60 + 1) OR minutes <= 07:59 (7*60 + 59)
                        const blockStart = 22 * 60 + 1; // 22:01
                        const blockEnd = 7 * 60 + 59; // 07:59
                        if (minutes >= blockStart || minutes <= blockEnd) {
                          setTimeError('오후 10시 1분(22:01)부터 오전 7시 59분(07:59)까지는 운행하지 않습니다.');
                          setValidTime(false);
                        } else {
                          setTimeError('');
                          setValidTime(true);
                        }
                      }}
                      required={col.required}
                    />
                    {timeError ? (
                      <div style={{ fontSize: '12px', color: '#b71c1c', marginTop: '6px' }} role="alert">
                        {timeError}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
                        ※ 참고: 오후 10시 1분(22:01)부터 오전 7시 59분(07:59)까지는 운행하지 않습니다.
                      </div>
                    )}
                  </>
                ) : col.key === '경로' ? (
                  <select
                    id={`shp_${col.key}`}
                    value={formData[col.key] || ''}
                    onChange={e => handleInputChange(col.key, e.target.value)}
                    required={col.required}
                  >
                    <option value="">경로 선택</option>
                    {routeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : col.key === '차량종류' ? (
                  <select
                    id={`shp_${col.key}`}
                    value={formData[col.key] || ''}
                    onChange={e => handleInputChange(col.key, e.target.value)}
                    required={col.required}
                  >
                    <option value="">차량종류 선택</option>
                    {carTypeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : col.key === '차량코드' ? (
                  <input
                    type="text"
                    id={`shp_${col.key}`}
                    value={formData[col.key] || ''}
                    readOnly
                    style={{ background: '#f0f0f0', color: '#888' }}
                  />
                ) : col.key === '금액' ? (
                  <input
                    type="number"
                    id={`shp_${col.key}`}
                    value={formData[col.key] || ''}
                    readOnly
                    style={{ background: '#f0f0f0', color: '#888' }}
                  />
                ) : col.key === '공항명' ? (
                  <select
                    id={`shp_${col.key}`}
                    value={formData[col.key] || ''}
                    onChange={e => handleInputChange(col.key, e.target.value)}
                    required={col.required}
                  >
                    <option value="">공항명 선택</option>
                    <option value="노이바이 국제선">노이바이 국제선</option>
                    <option value="깟바 국제선">깟바 국제선</option>
                    <option value="노이바이 국내선">노이바이 국내선</option>
                    <option value="깟바 국내선">깟바 국내선</option>
                  </select>
                ) : col.key === 'Email' ? (
                  <input
                    type="email"
                    id={`shp_${col.key}`}
                    value={formData['Email'] || ''}
                    readOnly
                    style={{ background: '#f0f0f0', color: '#888' }}
                  />
                ) : col.key === '경유지대기시간' ? (
                  <input
                    type="number"
                    id={`shp_${col.key}`}
                    value={formData['경유지대기시간'] || ''}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === '') return handleInputChange('경유지대기시간', '');
                      const n = parseInt(v, 10);
                      handleInputChange('경유지대기시간', Number.isFinite(n) ? Math.max(0, n) : '');
                    }}
                    min={0}
                    step={1}
                    placeholder="분"
                    required={col.required}
                  />
                ) : (
                  <input
                    type={col.type}
                    id={`shp_${col.key}`}
                    value={formData[col.key] || ''}
                    onChange={e => handleInputChange(col.key, e.target.value)}
                    placeholder={col.label}
                    required={col.required}
                  />
                )}
              </div>
              {col.key === '시간' && (
                <div className="form-group">
                  <label htmlFor="shp_장소명" style={{ fontSize: '12px' }}>📍 장소명을 입력하세요.</label>
                  <input
                    type="text"
                    id="shp_장소명"
                    value={formData['장소명'] || ''}
                    onChange={e => handleInputChange('장소명', e.target.value)}
                    placeholder="장소명을 입력하세요."
                    required={FIXED_HEADERS.find(h => h.key === '장소명').required}
                  />
                </div>
              )}
              {col.key === '캐리어수량' && (
                <div className="form-group">
                  <label htmlFor="shp_패스트" style={{ fontSize: '12px' }}>⚡ 패스트를 선택하세요.</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <button
                      type="button"
                      style={{ backgroundColor: formData['패스트'] === true ? '#007bff' : '#f0f0f0', color: formData['패스트'] === true ? '#fff' : '#333', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 16px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                      onClick={() => handleInputChange('패스트', true)}
                    >예</button>
                    <button
                      type="button"
                      style={{ backgroundColor: formData['패스트'] === false ? '#007bff' : '#f0f0f0', color: formData['패스트'] === false ? '#fff' : '#333', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 16px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                      onClick={() => handleInputChange('패스트', false)}
                    >아니오</button>
                  </div>
                </div>
              )}
            </React.Fragment>
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
              fontSize: '14px',
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
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
            }}
            disabled={loading || !validTime}
          >
            {loading ? '저장중...' : '저장 및 전송'}
          </button>
        </div>
      </form>
    </div>
  );
}
export default AirportServiceForm;
