import React, { useState, useMemo } from 'react';
import { useSheetData } from '../utils/adminAPI';
import './AdminDashboard.css';

// 서비스 정의
const SERVICES = [
  { key: 'cruise', name: '크루즈', sheet: 'SH_R', icon: '🚢', color: '#3B82F6', dateField: '체크인' },
  { key: 'vehicle', name: '차량', sheet: 'SH_C', icon: '🚗', color: '#A855F7', dateField: '승차일시' },
  { key: 'car', name: '스하차량', sheet: 'SH_CC', icon: '🚙', color: '#F59E0B', dateField: '승차일' },
  { key: 'airport', name: '공항', sheet: 'SH_P', icon: '✈️', color: '#10B981', dateField: '일자' },
  { key: 'hotel', name: '호텔', sheet: 'SH_H', icon: '🏨', color: '#F97316', dateField: '체크인날짜' },
  { key: 'tour', name: '투어', sheet: 'SH_T', icon: '📍', color: '#EF4444', dateField: '시작일자' },
  { key: 'rentcar', name: '렌트카', sheet: 'SH_RC', icon: '🚙', color: '#6366F1', dateField: '승차일자' },

];

// 날짜 파싱 함수
function tryParseDate(s) {
  if (!s) return null;
  if (s instanceof Date && !isNaN(s.getTime())) return s;
  const str = String(s).trim();
  
  const iso = Date.parse(str);
  if (!isNaN(iso)) return new Date(iso);
  
  const parts = str.includes('/') ? str.split('/') : 
               str.includes('.') ? str.split('.') : 
               str.includes('-') ? str.split('-') : null;
  
  if (parts && parts.length === 3) {
    const p = parts.map(x => parseInt(x, 10));
    if (p.every(Number.isFinite)) {
      if (p[0] >= 1000) return new Date(p[0], p[1] - 1, p[2]);
      if (p[0] > 12) return new Date(p[2], p[1] - 1, p[0]);
      return new Date(p[2], p[0] - 1, p[1]);
    }
  }
  
  const koreanDateMatch = str.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (koreanDateMatch) {
    const [, year, month, day] = koreanDateMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  return null;
}

// 날짜를 YYYY-MM-DD 형식으로 변환
function formatDate(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function UsageDateDashboard({ onBack }) {
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [endDate, setEndDate] = useState(formatDate(new Date()));
  const [serviceFilter, setServiceFilter] = useState('all');

  // 모든 시트 데이터 가져오기
  const { data: SH_M_data = [], headers: SH_M_headers = [] } = useSheetData('SH_M') || {};
  const { data: SH_R_data = [], headers: SH_R_headers = [] } = useSheetData('SH_R') || {};
  const { data: SH_C_data = [], headers: SH_C_headers = [] } = useSheetData('SH_C') || {};
  const { data: SH_CC_data = [], headers: SH_CC_headers = [] } = useSheetData('SH_CC') || {};
  const { data: SH_P_data = [], headers: SH_P_headers = [] } = useSheetData('SH_P') || {};
  const { data: SH_H_data = [], headers: SH_H_headers = [] } = useSheetData('SH_H') || {};
  const { data: SH_T_data = [], headers: SH_T_headers = [] } = useSheetData('SH_T') || {};
  const { data: SH_RC_data = [], headers: SH_RC_headers = [] } = useSheetData('SH_RC') || {};

  // 주문ID로 SH_M에서 고객 정보 조회
  const getMemberInfo = useMemo(() => {
    return (orderId) => {
      if (!orderId || !SH_M_data.length || !SH_M_headers.length) return null;
      
      const orderIdIdx = SH_M_headers.indexOf('주문ID');
      if (orderIdIdx === -1) return null;
      
      const memberRow = SH_M_data.find(row => String(row[orderIdIdx]).trim() === String(orderId).trim());
      if (!memberRow) return null;
      
      const emailIdx = SH_M_headers.indexOf('Email');
      const koreanNameIdx = SH_M_headers.indexOf('한글이름');
      const englishNameIdx = SH_M_headers.indexOf('영문이름');
      const phoneIdx = SH_M_headers.indexOf('전화번호');
      
      return {
        email: emailIdx >= 0 ? memberRow[emailIdx] : '',
        koreanName: koreanNameIdx >= 0 ? memberRow[koreanNameIdx] : '',
        englishName: englishNameIdx >= 0 ? memberRow[englishNameIdx] : '',
        phone: phoneIdx >= 0 ? memberRow[phoneIdx] : ''
      };
    };
  }, [SH_M_data, SH_M_headers]);

  // 모든 서비스 데이터를 날짜별로 집계
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reservationsByDate = useMemo(() => {
    const dateMap = new Map();

    SERVICES.forEach(service => {
      const sheetData = (
        service.sheet === 'SH_R' ? SH_R_data :
        service.sheet === 'SH_C' ? SH_C_data :
        service.sheet === 'SH_CC' ? SH_CC_data :
        service.sheet === 'SH_P' ? SH_P_data :
        service.sheet === 'SH_H' ? SH_H_data :
        service.sheet === 'SH_T' ? SH_T_data :
        service.sheet === 'SH_RC' ? SH_RC_data : []
      );

      const sheetHeaders = (
        service.sheet === 'SH_R' ? SH_R_headers :
        service.sheet === 'SH_C' ? SH_C_headers :
        service.sheet === 'SH_CC' ? SH_CC_headers :
        service.sheet === 'SH_P' ? SH_P_headers :
        service.sheet === 'SH_H' ? SH_H_headers :
        service.sheet === 'SH_T' ? SH_T_headers :
        service.sheet === 'SH_RC' ? SH_RC_headers : []
      );

      if (!sheetData.length || !sheetHeaders.length) return;

      const orderIdIdx = sheetHeaders.indexOf('주문ID');
      const dateIdx = sheetHeaders.indexOf(service.dateField);

      sheetData.forEach(row => {
        const orderId = orderIdIdx >= 0 ? row[orderIdIdx] : null;
        if (!orderId) return;

        const dateValue = dateIdx >= 0 ? row[dateIdx] : null;
        const parsedDate = tryParseDate(dateValue);
        if (!parsedDate) return;

        const dateKey = formatDate(parsedDate);
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, []);
        }

        const memberInfo = getMemberInfo ? getMemberInfo(orderId) : null;
        const customerName = memberInfo?.koreanName || '';

        // 행 데이터를 객체로 변환
        const rowData = {};
        sheetHeaders.forEach((header, idx) => {
          rowData[header] = row[idx];
        });

        dateMap.get(dateKey).push({
          service: service.key,
          serviceName: service.name,
          icon: service.icon,
          color: service.color,
          orderId,
          customerName,
          memberInfo,
          date: parsedDate,
          dateKey,
          rowData
        });
      });
    });

    // 날짜별로 정렬
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => b.localeCompare(a));
    const result = new Map();
    sortedDates.forEach(dateKey => {
      result.set(dateKey, dateMap.get(dateKey));
    });

    return result;
  }, [SH_M_data, SH_M_headers, SH_R_data, SH_R_headers, SH_C_data, SH_C_headers, 
      SH_CC_data, SH_CC_headers, SH_P_data, SH_P_headers, SH_H_data, SH_H_headers, 
      SH_T_data, SH_T_headers, SH_RC_data, SH_RC_headers, getMemberInfo]);

  // 날짜 범위 내의 예약 데이터
  const dateRangeReservations = useMemo(() => {
    if (!startDate || !endDate || !reservationsByDate) return [];
    
    const allReservations = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 날짜 범위 내의 모든 예약 수집
    reservationsByDate.forEach((reservations, dateKey) => {
      const checkDate = new Date(dateKey);
      if (checkDate >= start && checkDate <= end) {
        allReservations.push(...reservations);
      }
    });
    
    // 서비스 필터 적용
    if (serviceFilter === 'all') {
      return allReservations;
    }
    return allReservations.filter(r => r.service === serviceFilter);
  }, [reservationsByDate, startDate, endDate, serviceFilter]);

  // 서비스별로 그룹화
  const groupedByService = useMemo(() => {
    const grouped = {};
    
    if (!dateRangeReservations || dateRangeReservations.length === 0) {
      return grouped;
    }
    
    dateRangeReservations.forEach(res => {
      if (!grouped[res.service]) {
        grouped[res.service] = {
          serviceName: res.serviceName,
          icon: res.icon,
          color: res.color,
          items: []
        };
      }
      grouped[res.service].items.push(res);
    });
    
    return grouped;
  }, [dateRangeReservations]);

  // 날짜별로 그룹화 (범위가 넓을 때 사용)
  const groupedByDate = useMemo(() => {
    const grouped = {};
    
    if (!dateRangeReservations || dateRangeReservations.length === 0) {
      return grouped;
    }
    
    dateRangeReservations.forEach(res => {
      const dateKey = res.dateKey;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(res);
    });
    
    // 날짜 정렬 (최신순)
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    const result = {};
    sortedDates.forEach(date => {
      result[date] = grouped[date];
    });
    
    return result;
  }, [dateRangeReservations]);

  // 날짜 네비게이션
  const navigateDateRange = (direction) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (direction === 'next') {
      start.setDate(start.getDate() + diffDays + 1);
      end.setDate(end.getDate() + diffDays + 1);
    } else {
      start.setDate(start.getDate() - diffDays - 1);
      end.setDate(end.getDate() - diffDays - 1);
    }
    
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const goToToday = () => {
    const today = formatDate(new Date());
    setStartDate(today);
    setEndDate(today);
  };

  // 사용 가능한 날짜 목록
  const availableDates = useMemo(() => {
    return reservationsByDate ? Array.from(reservationsByDate.keys()) : [];
  }, [reservationsByDate]);

  // 예약 카드 렌더링 (간단한 스타일)
  const renderReservationCard = (reservation) => {
    const getServiceDetails = () => {
      const data = reservation.rowData;
      
      switch (reservation.service) {
        case 'cruise':
          return (
            <>
              {data['크루즈'] && <div><strong>크루즈:</strong> {data['크루즈']}</div>}
              {data['객실종류'] && <div><strong>객실:</strong> {data['객실종류']}</div>}
              {data['ADULT'] && <div><strong>인원:</strong> {data['ADULT']}</div>}
            </>
          );
        case 'vehicle':
          return (
            <>
              {data['차량종류'] && <div><strong>차량:</strong> {data['차량종류']}</div>}
              {data['승차위치'] && <div><strong>승차:</strong> {data['승차위치']}</div>}
              {data['하차위치'] && <div><strong>하차:</strong> {data['하차위치']}</div>}
            </>
          );
        case 'car':
          return (
            <>
              {data['차량번호'] && <div><strong>차량번호:</strong> {data['차량번호']}</div>}
              {data['좌석번호'] && <div><strong>좌석:</strong> {data['좌석번호']}</div>}
              {data['이름'] && <div><strong>이름:</strong> {data['이름']}</div>}
            </>
          );
        case 'airport':
          return (
            <>
              {data['공항명'] && <div><strong>공항:</strong> {data['공항명']}</div>}
              {data['항공편'] && <div><strong>항공편:</strong> {data['항공편']}</div>}
              {data['시간'] && <div><strong>시간:</strong> {data['시간']}</div>}
            </>
          );
        case 'hotel':
          return (
            <>
              {data['호텔명'] && <div><strong>호텔:</strong> {data['호텔명']}</div>}
              {data['객실종류'] && <div><strong>객실:</strong> {data['객실종류']}</div>}
              {data['일정'] && <div><strong>일정:</strong> {data['일정']}</div>}
            </>
          );
        case 'tour':
          return (
            <>
              {data['투어명'] && <div><strong>투어:</strong> {data['투어명']}</div>}
              {data['투어종류'] && <div><strong>종류:</strong> {data['투어종류']}</div>}
              {data['투어인원'] && <div><strong>인원:</strong> {data['투어인원']}</div>}
            </>
          );
        case 'rentcar':
          return (
            <>
              {data['차량종류'] && <div><strong>차량:</strong> {data['차량종류']}</div>}
              {data['승차일자'] && <div><strong>픽업일:</strong> {data['승차일자']}</div>}
              {data['사용기간'] && <div><strong>기간:</strong> {data['사용기간']}</div>}
            </>
          );
        default:
          return null;
      }
    };

    return (
      <div
        key={`${reservation.dateKey}-${reservation.orderId}-${reservation.service}`}
        style={{
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid #F3F4F6'
        }}>
          <span style={{ fontSize: '1.5rem' }}>{reservation.icon}</span>
          <h5 style={{
            fontWeight: 'bold',
            fontSize: '0.875rem',
            flex: 1,
            color: '#1F2937',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {reservation.serviceName}
          </h5>
          <span style={{
            padding: '4px 8px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '500',
            backgroundColor: reservation.color + '20',
            color: reservation.color
          }}>
            예정
          </span>
        </div>

        {/* 내용 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem', color: '#374151' }}>
          {reservation.customerName && (
            <div style={{
              fontWeight: 'bold',
              color: reservation.color,
              marginBottom: '4px',
              borderBottom: '1px solid #F3F4F6',
              paddingBottom: '4px'
            }}>
              {reservation.customerName}
            </div>
          )}

          {getServiceDetails()}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <button onClick={onBack} className="back-button">← 뒤로</button>
        <h2>📅 사용일별 현황</h2>
      </div>

      {/* 날짜 선택 및 필터 */}
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* 날짜 범위 선택 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigateDateRange('prev')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#F3F4F6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ◀ 이전
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #3B82F6',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              />
            </div>
            
            <span style={{ marginTop: '20px', fontWeight: 'bold', color: '#6B7280' }}>~</span>
            
            <div>
              <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #3B82F6',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              />
            </div>
          </div>

          <button
            onClick={goToToday}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            오늘
          </button>

          <button
            onClick={() => navigateDateRange('next')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#F3F4F6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            다음 ▶
          </button>
        </div>

        {/* 서비스 필터 버튼 */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setServiceFilter('all')}
            style={{
              padding: '8px 16px',
              backgroundColor: serviceFilter === 'all' ? '#3B82F6' : '#F3F4F6',
              color: serviceFilter === 'all' ? '#FFFFFF' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            전체
          </button>
          {SERVICES.map(service => (
            <button
              key={service.key}
              onClick={() => setServiceFilter(service.key)}
              style={{
                padding: '8px 16px',
                backgroundColor: serviceFilter === service.key ? service.color : '#F3F4F6',
                color: serviceFilter === service.key ? '#FFFFFF' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}
            >
              {service.icon} {service.name}
            </button>
          ))}
        </div>
      </div>

      {/* 예약 현황 - key를 사용하여 날짜 변경 시 강제 리렌더링 */}
      <div 
        key={`reservations-${startDate}-${endDate}-${serviceFilter}`}
        style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <h3 style={{ marginBottom: '16px', color: '#1F2937' }}>
          {startDate === endDate ? startDate : `${startDate} ~ ${endDate}`} - 총 {dateRangeReservations.length}건
        </h3>

        {dateRangeReservations.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6B7280'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
            <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
              데이터 로딩중....
            </div>
            {availableDates.length > 0 && (
              <div style={{ marginTop: '12px', fontSize: '0.875rem' }}>
                잠시 기다려 주세요.
              </div>
            )}
          </div>
        ) : (
          <div>
            {startDate === endDate ? (
              /* 단일 날짜: 서비스별로 그룹화하여 표시 */
              Object.entries(groupedByService).map(([serviceKey, group]) => (
                <div key={serviceKey} style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    padding: '8px 12px',
                    backgroundColor: `${group.color}10`,
                    borderRadius: '6px',
                    borderLeft: `4px solid ${group.color}`
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>{group.icon}</span>
                    <h4 style={{ margin: 0, color: group.color, fontSize: '1rem' }}>
                      {group.serviceName} ({group.items.length}건)
                    </h4>
                  </div>
                  
                  {/* 그리드 레이아웃으로 카드 표시 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '12px'
                  }}>
                    {group.items.map(reservation => renderReservationCard(reservation))}
                  </div>
                </div>
              ))
            ) : (
              /* 날짜 범위: 날짜별로 그룹화하여 표시 */
              Object.entries(groupedByDate).map(([dateKey, reservations]) => (
                <div key={dateKey} style={{ marginBottom: '32px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                    padding: '12px 16px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '8px',
                    borderLeft: `4px solid #3B82F6`
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>📅</span>
                    <h4 style={{ margin: 0, color: '#1F2937', fontSize: '1.125rem' }}>
                      {dateKey} ({reservations.length}건)
                    </h4>
                  </div>
                  
                  {/* 날짜별 예약들을 서비스별로 그룹화하여 표시 */}
                  {(() => {
                    const serviceGroups = {};
                    reservations.forEach(res => {
                      if (!serviceGroups[res.service]) {
                        serviceGroups[res.service] = {
                          serviceName: res.serviceName,
                          icon: res.icon,
                          color: res.color,
                          items: []
                        };
                      }
                      serviceGroups[res.service].items.push(res);
                    });
                    
                    return Object.entries(serviceGroups).map(([serviceKey, group]) => (
                      <div key={serviceKey} style={{ marginBottom: '16px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px',
                          padding: '6px 12px',
                          backgroundColor: `${group.color}10`,
                          borderRadius: '6px',
                          borderLeft: `3px solid ${group.color}`
                        }}>
                          <span style={{ fontSize: '1rem' }}>{group.icon}</span>
                          <h5 style={{ margin: 0, color: group.color, fontSize: '0.875rem' }}>
                            {group.serviceName} ({group.items.length}건)
                          </h5>
                        </div>
                        
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                          gap: '12px',
                          marginLeft: '12px'
                        }}>
                          {group.items.map(reservation => renderReservationCard(reservation))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 범위 내 날짜별 예약 건수 */}
      {availableDates.length > 0 && (
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '12px', color: '#1F2937' }}>날짜별 예약 현황</h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {availableDates.slice(0, 50).map(date => {
              const count = reservationsByDate.get(date)?.length || 0;
              const dateObj = new Date(date);
              const start = new Date(startDate);
              const end = new Date(endDate);
              const isInRange = dateObj >= start && dateObj <= end;
              
              return (
                <button
                  key={date}
                  onClick={() => {
                    setStartDate(date);
                    setEndDate(date);
                  }}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: isInRange ? '#3B82F6' : '#F3F4F6',
                    color: isInRange ? '#FFFFFF' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: isInRange ? '600' : '400'
                  }}
                >
                  {date} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default UsageDateDashboard;
