/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, eqeqeq */
import React, { useState } from 'react';
import '../MobileBookingForm.css';
import ReservationForm from './services/ReservationForm';
import CruiseBookingForm from './services/CruiseBookingForm';
import CarServiceForm from './services/CarServiceForm';
import AirportServiceForm from './services/AirportServiceForm';
import TourServiceForm from './services/TourServiceForm';
import HotelServiceForm from './services/HotelServiceForm';
import RentalCarServiceForm from './services/RentalCarServiceForm';

// 서비스별 컬럼값을 한 번만 fetch해서 context로 관리
const SERVICE_SHEET_MAP = {
  SH_M: 'SH_M', // 예약자 정보(마스터)
  SH_R: 'SH_R', // 크루즈 객실 예약
  SH_C: 'SH_C', // 차량 서비스
  SH_P: 'SH_P',
  SH_T: 'SH_T',
  SH_H: 'SH_H',
  SH_RC: 'SH_RC'
  // SH_CC: 'SH_CC' // 좌석/승차명단 등 별도 시트가 필요하면 추후 노출
};

const SHEET_ID = process.env.REACT_APP_SHEET_ID;
const API_KEY = process.env.REACT_APP_API_KEY;
// Respect explicit env toggle only. In development we may still want direct Apps Script calls,
// so do not default to proxy based on NODE_ENV.
const USE_PROXY = (process.env.REACT_APP_USE_PROXY === 'true') ||
  (typeof window !== 'undefined' && window.location && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(window.location.origin));

function MobileBookingForm() {
  // 서비스별 컬럼값을 한 번만 fetch해서 공유
  const [serviceHeaders, setServiceHeaders] = useState({});
  // 쿼리스트링에서 사용자 정보 자동 입력
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const customerName = params.get('customerName') || '';
    const orderIdParam = params.get('orderId') || '';
    const email = params.get('email') || '';
    const phone = params.get('phone') || '';
    if (customerName || email || phone) {
      setFormData(prev => ({
        ...prev,
        customerName,
        email,
        phone
      }));
    }
    if (orderIdParam) {
      setFormData(prev => ({ ...prev, orderId: orderIdParam }));
    }
  }, []);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState({});
  const [appendLogMap, setAppendLogMap] = useState({});
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    checkInDate: '',
    checkOutDate: '',
    adults: 1,
    children: 0,
    specialRequests: '',
    serviceSpecific: {}
  });
  // 모든 서비스 컬럼값을 최초 1회만 fetch
    React.useEffect(() => {
    async function fetchAllHeaders() {
        const newHeaders = {};
        const useProxy = USE_PROXY;
        for (const [serviceId, sheetName] of Object.entries(SERVICE_SHEET_MAP)) {
          const url = useProxy ? `/api/append?sheet=${encodeURIComponent(sheetName)}&range=1:1` : `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!1:1?key=${API_KEY}`;
          const res = await fetch(url);
          // When calling direct Google API we expect JSON, but proxy may return text; handle both
          const text = await res.text();
          let data;
          try { data = JSON.parse(text); } catch (e) { data = { values: [] }; }
      newHeaders[serviceId] = Array.isArray(data.values) && data.values.length ? data.values[0] : [];
        }
        setServiceHeaders(newHeaders);
      }
      fetchAllHeaders();
    }, []);

  // Helper to mark a service as submitted for the current orderId and local UI
  const getMasterOrderId = () => {
    try {
      const localId = (typeof window !== 'undefined' && window.localStorage)
        ? (window.localStorage.getItem('reservation_orderId') || '')
        : '';
      return (formData.orderId || formData['주문ID'] || localId || '').toString();
    } catch (_) {
      return (formData.orderId || formData['주문ID'] || '').toString();
    }
  };

  const markServiceSubmitted = (serviceId) => {
    setSubmitted(prev => ({ ...prev, [serviceId]: true }));
    const master = getMasterOrderId();
    if (!master) return;
    setAppendLogMap(prev => {
      const next = { ...prev };
      const arr = Array.isArray(next[master]) ? [...next[master]] : [];
      if (!arr.includes(serviceId)) arr.push(serviceId);
      next[master] = arr;
      return next;
    });
    // 저장 완료 후 서비스 선택 화면으로 돌아가 배지를 바로 보여줌
    try {
      setCurrentStep(0);
      // 선택 강조 해제 (선택 유지 원하면 이 줄을 제거)
      setSelectedService('');
    } catch (_) {}
  };

  // Fetch APPEND_LOG and build mapping of master orderId -> submitted sheets
  React.useEffect(() => {
    async function fetchAppendLog() {
      try {
        const useProxy = USE_PROXY;
        const url = useProxy ? `/api/append?sheet=APPEND_LOG&range=1:1000` : `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/APPEND_LOG!A:Z?key=${API_KEY}`;
        const res = await fetch(url);
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { data = { values: [] }; }
        const rows = Array.isArray(data.values) ? data.values : [];

        // first collect master orderIds from SH_M rows
        const masters = new Set();
        rows.forEach(r => {
          const sheet = r[2];
          const lastCol = r[r.length - 1];
          if (sheet === 'SH_M' && typeof lastCol === 'string') {
            try {
              const arr = JSON.parse(lastCol);
              if (Array.isArray(arr) && arr.length) masters.add(arr[0]);
            } catch (e) {
              // ignore
            }
          }
        });

        const map = {};
        rows.forEach(r => {
          const sheet = r[2];
          const status = (r[3] || '').toString().toLowerCase();
          const event = (r[4] || '').toString();
          const lastCol = r[r.length - 1];
          if (status === 'ok' && event === 'appended' && typeof lastCol === 'string') {
            try {
              const arr = JSON.parse(lastCol);
              if (!Array.isArray(arr)) return;
              let master = null;
              if (sheet === 'SH_M') {
                master = arr[0];
              } else {
                for (const v of arr) {
                  if (masters.has(v)) { master = v; break; }
                }
              }
              if (master) {
                map[master] = map[master] || [];
                if (!map[master].includes(sheet)) map[master].push(sheet);
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        });
        setAppendLogMap(map);
      } catch (e) {
        // ignore fetch errors silently
      }
    }
    fetchAppendLog();
  }, []);

  // whenever appendLogMap or current orderId changes, set submitted badges for that order
  React.useEffect(() => {
    const master = getMasterOrderId();
    // 마스터 주문ID가 없으면 기존 표시를 유지 (초기 로컬 체크 유지)
    if (!master) return;
    const arr = appendLogMap[master] || [];
    const newSubmitted = {};
    arr.forEach(s => { newSubmitted[s] = true; });
    setSubmitted(newSubmitted);
  }, [appendLogMap, formData.orderId, formData['주문ID']]);

  const services = [
    { id: 'SH_M', name: '예약자 정보', icon: '👤', color: '#10B981' },
    { id: 'SH_R', name: '크루즈 예약', icon: '🚢', color: '#059669' },
    { id: 'SH_C', name: '차량 서비스', icon: '🚗', color: '#DC2626' },
    { id: 'SH_P', name: '공항 서비스', icon: '✈️', color: '#7C2D12' },
    { id: 'SH_T', name: '투어 예약', icon: '🗺️', color: '#9333EA' },
    { id: 'SH_H', name: '호텔 예약', icon: '🏩', color: '#DB2777' },
    { id: 'SH_RC', name: '렌트카 예약', icon: '🚙', color: '#EA580C' }
  ];

  const steps = [
    { title: '서비스 선택', icon: '🔍' },
    { title: '고객 정보', icon: '👤' },
    { title: '예약 정보', icon: '📅' },
    { title: '추가 정보', icon: '📝' },
    { title: '확인', icon: '✅' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceSpecificChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      serviceSpecific: { ...prev.serviceSpecific, [field]: value }
    }));
  };

  const submitBooking = async () => {
    setLoading(true);
    try {
      // SH_M 시트에 저장할 데이터 구성
      const rowData = [
        formData.orderId,
        formData.regDate,
        formData.email,
        formData.koreanName,
        formData.englishName,
        formData.nickname
      ];
      // append via proxy or direct append URL depending on environment; proxy will inject server token
      const appendUrl = process.env.REACT_APP_SHEET_APPEND_URL;
      const appendToken = process.env.REACT_APP_SHEET_APPEND_TOKEN;
      const useProxy = USE_PROXY;
      const target = useProxy ? '/api/append' : appendUrl;
      const body = useProxy ? { service: 'SH_M', row: rowData } : { service: 'SH_M', row: rowData, token: appendToken };
      await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      alert(`예약이 접수되었습니다!\n주문ID: ${formData.orderId}`);
      setFormData({
        orderId: '',
        regDate: '',
        email: '',
        koreanName: '',
        englishName: '',
        nickname: ''
      });
      setCurrentStep(0);
      setSelectedService('');
    } catch (error) {
      alert('예약 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendConfirmation = async () => {
    if (!formData.email || !formData.orderId) {
      alert('이메일과 주문ID가 필요합니다. 먼저 저장해주세요.');
      return;
    }

    const confirmed = window.confirm('예약 확인서를 이메일로 발송하시겠습니까?');
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch('/api/sendConfirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          orderId: formData.orderId,
          customerName: formData.customerName || formData.한글이름 || formData.koreanName,
          checkInDate: formData.checkInDate || formData.체크인,
          checkOutDate: formData.checkOutDate || formData.체크아웃,
          adults: formData.adults,
          children: formData.children,
          serviceName: services.find(s => s.id === selectedService)?.name,
          specialRequests: formData.specialRequests || formData.기타요청사항
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('예약 확인서가 이메일로 발송되었습니다! 📧\n예약이 완료되었습니다.');
        // 예약 완료 후 초기화
        setFormData({});
        setCurrentStep(0);
        setSelectedService('');
      } else {
        throw new Error(result.error || '이메일 발송 실패');
      }
    } catch (error) {
      console.error('Confirmation email error:', error);
      alert('이메일 발송 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return selectedService !== '';
      case 1: return formData.customerName && formData.email && formData.phone;
      case 2: return formData.checkInDate && formData.checkOutDate;
      default: return true;
    }
  };

  // 모든 시트의 ID 자동생성 및 주문ID 자동입력 공통 함수
  const fetchOrderIds = async (sheetName) => {
  const useProxy = USE_PROXY;
    const url = useProxy ? `/api/append?sheet=${encodeURIComponent(sheetName)}&range=A:A` : `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!A:A?key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.values || []).map(row => row[0]);
  };

  const generateUniqueId = async (sheetName) => {
    const existingIds = await fetchOrderIds(sheetName);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let newId = '';
    let tries = 0;
    do {
      newId = '';
      for (let i = 0; i < 8; i++) {
        newId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      tries++;
      if (tries > 100) throw new Error('ID 생성 실패: 중복 회피 불가');
    } while (existingIds.includes(newId));
    return newId;
  };

  // 주문ID 자동입력 (사용자 주문ID 불러오기)
    const fetchUserOrderId = async (userEmail) => {
      // 예시: SH_M 시트에서 해당 이메일의 주문ID 조회
    const useProxy = USE_PROXY;
      const url = useProxy ? `/api/append?sheet=SH_M&range=A:F` : `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/SH_M!A:F?key=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.values) return '';
      const header = data.values[0];
      const orderIdIdx = header.indexOf('주문ID');
      const emailIdx = header.indexOf('Email');
      const found = data.values.find(row => row[emailIdx] === userEmail);
      return found ? found[orderIdIdx] : '';
    };
  // 폼 초기화 시 각 시트의 ID, 주문ID 자동 입력 (공통 적용)
  React.useEffect(() => {
    async function setAutoIds() {
      if (currentStep === 1 && selectedService) {
        const sheetName = selectedService;
        const uniqueId = await generateUniqueId(sheetName);
        let userOrderId = '';
        if (formData.email) {
            userOrderId = await fetchUserOrderId(formData.email); // Use the updated function
        }
        setFormData(prev => ({
          ...prev,
          id: uniqueId,
          orderId: userOrderId
        }));
      }
    }
    setAutoIds();
  }, [currentStep, selectedService, formData.email]);

  return (
    <div className="mobile-booking-form">
      <div className="form-content">
        {currentStep === 0 && (
          <div className="service-selection">
            <h2 className="step-title">예약 서비스를 선택하세요</h2>
            <div className="services-grid">
              {services.map(service => (
                <div
                  key={service.id}
                  className={`service-card ${selectedService === service.id ? 'selected' : ''} ${submitted[service.id] ? 'submitted' : ''}`}
                  onClick={() => {
                    setSelectedService(service.id);
                    setCurrentStep(1);
                  }}
                  style={{ '--service-color': service.color }}
                >
                  <div className="service-icon">{service.icon}</div>
                  <div className="service-name">{service.name}</div>
                  {submitted[service.id] && <div className="service-submitted-badge" aria-hidden="true">✓</div>}
                </div>
              ))}
            </div>
            
            {Object.values(submitted).some(val => val) && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid rgba(0,0,0,0.1)'
              }}>
                <button
                  onClick={handleSendConfirmation}
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? '#95a5a6' : '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '16px 48px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  {loading ? '처리중...' : '✅ 예약완료'}
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 1 && selectedService === 'SH_M' && (
          <ReservationForm formData={formData} setFormData={setFormData} headers={serviceHeaders['SH_M'] || []} onServiceSubmitted={() => markServiceSubmitted('SH_M')} />
        )}
        {currentStep === 1 && selectedService === 'SH_R' && (
          <CruiseBookingForm formData={formData} setFormData={setFormData} headers={serviceHeaders['SH_R'] || []} onServiceSubmitted={() => markServiceSubmitted('SH_R')} />
        )}
        {currentStep === 1 && selectedService === 'SH_C' && (
          <CarServiceForm formData={formData} setFormData={setFormData} headers={serviceHeaders['SH_C'] || []} onServiceSubmitted={() => markServiceSubmitted('SH_C')} />
        )}
        {currentStep === 1 && selectedService === 'SH_P' && (
          <AirportServiceForm formData={formData} setFormData={setFormData} headers={serviceHeaders['SH_P'] || []} onServiceSubmitted={() => markServiceSubmitted('SH_P')} />
        )}
        {currentStep === 1 && selectedService === 'SH_T' && (
          <TourServiceForm formData={formData} setFormData={setFormData} headers={serviceHeaders['SH_T'] || []} onServiceSubmitted={() => markServiceSubmitted('SH_T')} />
        )}
        {currentStep === 1 && selectedService === 'SH_H' && (
          <HotelServiceForm formData={formData} setFormData={setFormData} headers={serviceHeaders['SH_H'] || []} onServiceSubmitted={() => markServiceSubmitted('SH_H')} />
        )}
        {currentStep === 1 && selectedService === 'SH_RC' && (
          <RentalCarServiceForm formData={formData} setFormData={setFormData} headers={serviceHeaders['SH_RC'] || []} onServiceSubmitted={() => markServiceSubmitted('SH_RC')} />
        )}

        {currentStep === 2 && (
          <div className="booking-info">
            <h2 className="step-title">예약 정보를 선택해주세요</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="checkInDate">체크인 날짜 *</label>
                <input type="date" id="checkInDate" value={formData.checkInDate}
                  onChange={(e) => handleInputChange('checkInDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]} required />
              </div>
              <div className="form-group">
                <label htmlFor="checkOutDate">체크아웃 날짜 *</label>
                <input type="date" id="checkOutDate" value={formData.checkOutDate}
                  onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
                  min={formData.checkInDate || new Date().toISOString().split('T')[0]} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="adults">성인</label>
                <select id="adults" value={formData.adults} onChange={(e) => handleInputChange('adults', parseInt(e.target.value))}>
                  {[1,2,3,4,5,6].map(num => <option key={num} value={num}>{num}명</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="children">아동</label>
                <select id="children" value={formData.children} onChange={(e) => handleInputChange('children', parseInt(e.target.value))}>
                  {[0,1,2,3,4].map(num => <option key={num} value={num}>{num}명</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="service-specific">
            <h2 className="step-title">{services.find(s => s.id === selectedService)?.name} 추가 정보</h2>
            <div className="form-group">
              <label htmlFor="specialRequests">특별 요청사항</label>
              <textarea id="specialRequests" value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                placeholder="추가 요청사항이나 특별한 요구사항을 입력해주세요" rows="3" />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="confirmation">
            <h2 className="step-title">예약 정보를 확인해주세요</h2>
            <div className="confirmation-card">
              <div className="confirmation-section">
                <h3>서비스 정보</h3>
                <div className="confirmation-item">
                  <span className="service-badge" style={{ backgroundColor: services.find(s => s.id === selectedService)?.color }}>
                    {services.find(s => s.id === selectedService)?.icon} {services.find(s => s.id === selectedService)?.name}
                  </span>
                </div>
              </div>
              <div className="confirmation-section">
                <h3>고객 정보</h3>
                <div className="confirmation-item">
                  <span className="label">성함:</span><span className="value">{formData.customerName}</span>
                </div>
                <div className="confirmation-item">
                  <span className="label">이메일:</span><span className="value">{formData.email}</span>
                </div>
                <div className="confirmation-item">
                  <span className="label">연락처:</span><span className="value">{formData.phone}</span>
                </div>
              </div>
              <div className="confirmation-section">
                <h3>예약 정보</h3>
                <div className="confirmation-item">
                  <span className="label">체크인:</span><span className="value">{formData.checkInDate}</span>
                </div>
                <div className="confirmation-item">
                  <span className="label">체크아웃:</span><span className="value">{formData.checkOutDate}</span>
                </div>
                <div className="confirmation-item">
                  <span className="label">인원:</span><span className="value">성인 {formData.adults}명, 아동 {formData.children}명</span>
                </div>
              </div>
              {formData.specialRequests && (
                <div className="confirmation-section">
                  <h3>특별 요청사항</h3>
                  <div className="special-requests">{formData.specialRequests}</div>
                </div>
              )}
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginTop: '24px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                style={{
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                ← 이전
              </button>
              <button
                onClick={handleSendConfirmation}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#95a5a6' : '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '16px 48px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {loading ? '처리중...' : '✅ 예약완료'}
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">예약을 처리하고 있습니다...</div>
        </div>
      )}
    </div>
  );
}

export default MobileBookingForm;
