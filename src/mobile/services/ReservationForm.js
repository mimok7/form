import React, { useState, useEffect } from 'react';
import FormLabel from './FormLabel';
import { buildRowFromHeaders } from '../../utils/rowBuilder';

const FIXED_HEADERS = [
  { key: '주문ID', label: '주문 번호', type: 'text', required: true },
  { key: '예약일', label: '예약일을 선택하세요.', type: 'date', required: true },
  { key: 'Email', label: '이메일 주소를 입력하세요', type: 'email', required: true },
  { key: '결제방식', label: '결제방식을 선택하세요', type: 'text', required: true },
  { key: '한글이름', label: '한글 이름을 입력하세요', type: 'text', required: true },
  { key: '영문이름', label: '영문 이름을 여권과 동일하게 입력하세요(대문자로만)', type: 'text', required: true },
  { key: '닉네임', label: '닉네임을 입력하세요', type: 'text', required: false },
  { key: '카톡ID', label: '카카오톡 ID를 입력하세요', type: 'text', required: false }
];

function ReservationForm({ formData, setFormData, headers = [], onServiceSubmitted }) {
  const [loading, setLoading] = useState(false);
  // 캐시(localStorage)에서 주문ID를 우선적으로 가져옴
  const getInitialOrderId = () => {
    const cachedId = window.localStorage.getItem('reservation_orderId');
    if (cachedId) return cachedId;
    if (formData.주문ID) return formData.주문ID;
    return '';
  };
  const [orderId, setOrderId] = useState(getInitialOrderId());
  const SHEET_ID = process.env.REACT_APP_SHEET_ID;

  // 주문ID 생성 함수
  function generateUniqueId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  useEffect(() => {
    // 주문ID가 없으면 새로 생성, 있으면 그대로 사용
    let email = formData.Email || window.localStorage.getItem('user_email') || '';
    if (!orderId) {
      const newId = generateUniqueId();
      setOrderId(newId);
      window.localStorage.setItem('reservation_orderId', newId);
      if (email) window.localStorage.setItem('user_email', email);
      setFormData(prev => ({
        ...prev,
        서비스ID: SHEET_ID,
        주문ID: newId,
        예약일: new Date().toISOString().slice(0, 10),
        Email: email
      }));
    } else {
      window.localStorage.setItem('reservation_orderId', orderId);
      if (email) window.localStorage.setItem('user_email', email);
      setFormData(prev => ({
        ...prev,
        서비스ID: SHEET_ID,
        주문ID: orderId,
        예약일: new Date().toISOString().slice(0, 10),
        Email: email
      }));
    }
  }, [orderId, SHEET_ID, setFormData, formData.Email]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 이메일 입력 시 캐시에 저장
    if (field === 'Email') {
      window.localStorage.setItem('user_email', value);
    }
    // 결제방식 입력 시 캐시에 저장
    if (field === '결제방식') {
      window.localStorage.setItem('payment_method', value);
    }
  };

  const handleNewOrderId = () => {
    const newId = generateUniqueId();
    setOrderId(newId);
    window.localStorage.setItem('reservation_orderId', newId);
    setFormData(prev => ({ ...prev, 주문ID: newId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 실제 시트 헤더(headers) 순서에 맞춰 row 생성
      const fieldMap = {
        '주문ID': '주문ID',
        '예약일': '예약일',
        'Email': 'Email',
        '결제방식': '결제방식',
        '한글이름': '한글이름',
        '영문이름': '영문이름',
        '닉네임': '닉네임',
        '카톡ID': '카톡ID',
      };
      const rowData = buildRowFromHeaders(headers.length ? headers : FIXED_HEADERS.map(h => h.key), formData, fieldMap);
      
      // 서버(또는 Apps Script 웹앱)에 서비스 키와 행 데이터를 보내도록 변경
  // Use proxy only when explicitly enabled via REACT_APP_USE_PROXY
  const useProxy = (process.env.REACT_APP_USE_PROXY === 'true') || (typeof window !== 'undefined' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(window.location.origin));
      const APPEND_URL = useProxy ? '/api/append' : process.env.REACT_APP_SHEET_APPEND_URL;
      // When using the proxy, do not include a client-side token. The proxy will inject the server token.
      const APPEND_TOKEN = useProxy ? '' : process.env.REACT_APP_SHEET_APPEND_TOKEN;
      if (!APPEND_URL) throw new Error('REACT_APP_SHEET_APPEND_URL or proxy must be configured.');
  // 서버(Apps Script)에서 'user'를 SH_M으로 매핑함
  const payload = { service: 'user', row: rowData };
      if (APPEND_TOKEN) payload.token = APPEND_TOKEN;
      const res = await fetch(APPEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`서버 응답 오류: ${res.status} ${txt}`);
      }
  alert('예약 정보가 저장되었습니다.');
      setFormData({});
      if (typeof onServiceSubmitted === 'function') onServiceSubmitted();
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다. ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };  return (
    <div className="customer-info">
      <style>{`
        /* 영문이름 입력창의 placeholder만 노란색으로 설정 (클래스 기반) */
        .eng-placeholder::placeholder,
        .eng-placeholder::-webkit-input-placeholder,
        .eng-placeholder:-ms-input-placeholder,
        .eng-placeholder::-ms-input-placeholder,
        .eng-placeholder::-moz-placeholder {
          color: #ffc107 !important;
          opacity: 1 !important;
        }
      `}</style>
      <h2 className="step-title">예약자 정보 </h2>
      <div style={{marginBottom:'10px', color:'#888', fontSize:'0.95rem', fontWeight:'normal'}}>
        * 예약일, 이메일주소, 한글이름, 영문이름은 필수 입력입니다.
      </div>
      <form className="sheet-columns-form" onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <label htmlFor="reservation_주문ID" style={{ fontWeight: 'bold', fontSize: '1rem' }}>주문ID</label>
          <input
            type="text"
            id="reservation_주문ID"
            value={orderId}
            readOnly
            style={{ fontWeight: 'bold', background: '#f8f9fa', color: '#007bff', width: '140px', fontSize: '1.1rem', letterSpacing: '1px', textAlign: 'center', border: '1.5px solid #007bff', borderRadius: '5px', padding: '4px 8px' }}
          />
          <button type="button" onClick={handleNewOrderId} style={{ padding: '6px 12px', borderRadius: '4px', background: '#28a745', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '0.95rem' }}>새로생성</button>
        </div>
        {FIXED_HEADERS.filter(col => col.key !== '주문ID').map((col, idx) => (
          <div className="form-group" key={idx}>
            <FormLabel
              htmlFor={`reservation_${col.key}`}
              col={col}
              icon={
                col.key === 'Email' ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{marginRight:'2px'}}>
                    <rect x="2" y="4" width="12" height="8" rx="2" stroke="#007bff" strokeWidth="2"/>
                    <path d="M2 4l6 5 6-5" stroke="#007bff" strokeWidth="2"/>
                  </svg>
                ) : col.key === '한글이름' ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{marginRight:'2px'}}>
                    <circle cx="8" cy="8" r="7" stroke="#28a745" strokeWidth="2"/>
                    <text x="8" y="11" textAnchor="middle" fontSize="8" fill="#28a745">가</text>
                  </svg>
                ) : col.key === '영문이름' ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{marginRight:'2px'}}>
                    <circle cx="8" cy="8" r="7" stroke="#007bff" strokeWidth="2"/>
                    <text x="8" y="11" textAnchor="middle" fontSize="8" fill="#007bff">A</text>
                  </svg>
                ) : col.key === '닉네임' ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{marginRight:'2px'}}>
                    <rect x="3" y="3" width="10" height="10" rx="5" stroke="#fd7e14" strokeWidth="2"/>
                    <text x="8" y="11" textAnchor="middle" fontSize="8" fill="#fd7e14">N</text>
                  </svg>
                ) : col.key === '카톡ID' ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{marginRight:'2px'}}>
                    <ellipse cx="8" cy="8" rx="7" ry="6" stroke="#6f42c1" strokeWidth="2"/>
                    <text x="8" y="11" textAnchor="middle" fontSize="8" fill="#6f42c1">K</text>
                  </svg>
                ) : col.key === '예약일' ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{marginRight:'2px'}}>
                    <rect x="2" y="4" width="12" height="10" rx="2" stroke="#ffc107" strokeWidth="2"/>
                    <rect x="5" y="1" width="6" height="2" rx="1" fill="#ffc107"/>
                  </svg>
                ) : null
              }
            />
            {col.key === '결제방식' ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  style={{
                    backgroundColor: formData['결제방식'] === '신용카드' ? '#007bff' : '#f0f0f0',
                    color: formData['결제방식'] === '신용카드' ? '#fff' : '#333',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '6px 16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleInputChange('결제방식', '신용카드')}
                >신용카드</button>
                <button
                  type="button"
                  style={{
                    backgroundColor: formData['결제방식'] === '베트남동' ? '#007bff' : '#f0f0f0',
                    color: formData['결제방식'] === '베트남동' ? '#fff' : '#333',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '6px 16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleInputChange('결제방식', '베트남동')}
                >베트남동</button>
              </div>
            ) : col.key === 'Email' ? (
              <input
                type="email"
                id={`reservation_${col.key}`}
                value={formData[col.key] || ''}
                onChange={e => handleInputChange(col.key, e.target.value)}
                placeholder={col.label}
                required={col.required}
                title="올바른 이메일 주소를 입력하세요."
              />
            ) : col.key === '영문이름' ? (
              <input
                type={col.type}
                id={`reservation_${col.key}`}
                className="eng-placeholder"
                value={formData[col.key] || ''}
                onChange={e => {
                  const raw = (e.target.value || '').toString().toUpperCase();
                  const filtered = raw.replace(/[^A-Z\s]/g, '');
                  handleInputChange(col.key, filtered);
                }}
                onBlur={e => {
                  const v = (e.target.value || '').toString().trim().replace(/\s+/g, ' ');
                  handleInputChange(col.key, v);
                }}
                placeholder={'HONG GILDONG 형식으로 입력하세요'}
                required={col.required}
              />
            ) : (
              <input
                type={col.type}
                id={`reservation_${col.key}`}
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
              backgroundColor: '#6c757d',
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

export default ReservationForm;
