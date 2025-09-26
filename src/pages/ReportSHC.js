import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSheetData } from '../utils/adminAPI';

// A4 인쇄용 크루즈 차량 배차표 리포트  
function ReportSHC({ onBack }) {
  // 시트 데이터 로드
  const { data = [], headers = [], loading, error, loadData: reload } = useSheetData('SH_C') || {};

  // 보조 시트 (멤버 정보)
  const { data: memberData = [], headers: memberHeaders = [] } = useSheetData('SH_M') || {};
  const { data: cruiseRows = [], headers: cruiseHeaders = [] } = useSheetData('cruise') || {};
  const { data: shrData = [], headers: shrHeaders = [] } = useSheetData('SH_R') || {};

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  const findIdx = (hs, name) => (Array.isArray(hs) ? hs.indexOf(name) : -1);
  const findIdxCI = (hs, candidates) => {
    if (!Array.isArray(hs)) return -1;
    const H = hs.map(h => (h || '').toString().trim().toLowerCase());
    for (const c of candidates) {
      const idx = H.indexOf((c || '').toString().trim().toLowerCase());
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // 텍스트
  const t = {
    title: '크루즈 차량 배차표',
    printDate: '출력일',
    startDate: '시작일',
    endDate: '종료일',
    selectDatePlaceholder: '날짜를 선택하세요',
    print: '인쇄',
    preview: '미리보기',
    hidePreview: '미리보기 숨기기',
    back: '뒤로가기',
    refresh: '새로고침',
    vehicle: '차량',
    totalVehicles: '총',
    totalCount: '건',
    noData: '선택한 기간에 해당하는 데이터가 없습니다.',
    selectDateMessage: '상단에서 날짜 구간을 선택하여 배차표를 생성하세요.',
    loading: '데이터를 불러오는 중...',
    error: '오류',
    columns: {
      category: '구분',
      time: '시간',
      customer: '고객명',
      people: '인원',
      carType: '차량종류',
      carCount: '차량수',
      pickup: '승차위치',
      dropoff: '하차위치',
      cruise: '크루즈',
      pier: '선착장',
      classification: '분류',
      note: '비고'
    }
  };

  // 고객명 조회 함수
  const getCustomerNameByOrderId = useCallback((orderId) => {
    if (!orderId) return '';
    const idxOrder = findIdx(memberHeaders, '주문ID');
    if (idxOrder === -1) return '';
    const row = (memberData || []).find(r => (r?.[idxOrder] || '') === orderId);
    if (!row) return '';
    const idxName = findIdx(memberHeaders, '이름');
    return idxName >= 0 ? (row[idxName] || '') : '';
  }, [memberData, memberHeaders]);

  // 크루즈명으로 선착장 조회
  const getPierByCruiseName = useCallback((cruiseName) => {
    if (!cruiseName) return '';
    const idxCruise = findIdxCI(cruiseHeaders, ['크루즈','크루즈명','cruise']);
    if (idxCruise === -1) return '';
    const idxPier = findIdxCI(cruiseHeaders, ['선착장위치','선착장 위치','선착장','승선장','승선장소','pier','port']);
    if (idxPier === -1) return '';
    const row = (cruiseRows || []).find(r => (''+(r?.[idxCruise]||'')).trim() === (''+cruiseName).trim());
    return row ? (row[idxPier] || '') : '';
  }, [cruiseRows, cruiseHeaders]);

  // 주문ID로 크루즈명 조회 (SH_R에서)
  const getCruiseNameByOrderId = useCallback((orderId) => {
    if (!orderId) return '';
    const idxOrder = findIdxCI(shrHeaders, ['주문id','주문ID','orderid']);
    if (idxOrder === -1) return '';
    const row = (shrData || []).find(r => (r?.[idxOrder] || '') === orderId);
    if (!row) return '';
    const idxCruise = findIdxCI(shrHeaders, ['크루즈','크루즈명','cruise']);
    return idxCruise >= 0 ? (row[idxCruise] || '') : '';
  }, [shrData, shrHeaders]);

  // 주문ID로 선착장 조회
  const getPierByOrderId = useCallback((orderId) => {
    const cruiseName = getCruiseNameByOrderId(orderId);
    return getPierByCruiseName(cruiseName);
  }, [getCruiseNameByOrderId, getPierByCruiseName]);

  // 날짜 유틸: 로컬 기준 YYYY-MM-DD 변환 및 파싱
  const toLocalYMD = (d) => {
    if (!(d instanceof Date)) d = new Date(d);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const parseYMDToLocalDate = (ymd) => {
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(ymd)) return new Date(ymd);
    const [y, m, dd] = ymd.split('-').map(Number);
    return new Date(y, m - 1, dd);
  };

  // 날짜 구간별 필터링된 데이터
  const filteredData = useMemo(() => {
    const idxDate = findIdx(headers, '승차일시');
    
    if (!startDate || !endDate || idxDate === -1) return [];
    
    return (data || []).filter(row => {
      const rowDate = row[idxDate];
      if (!rowDate) return false;
      
      try {
        const rowYMD = toLocalYMD(new Date(rowDate));
        return rowYMD >= startDate && rowYMD <= endDate;
      } catch {
        return false;
      }
    });
  }, [data, headers, startDate, endDate]);

  // 차량별로 그룹화
  const groupedByVehicle = useMemo(() => {
    const idxCarType = findIdx(headers, '차량종류');
    const idxOrderId = findIdx(headers, '주문ID');
    const idxDateTime = findIdx(headers, '승차일시');

    const groups = new Map();

    filteredData.forEach(row => {
      const carType = idxCarType !== -1 ? (row[idxCarType] || '미지정') : '미지정';
      
      if (!groups.has(carType)) {
        groups.set(carType, []);
      }
      
      const orderId = idxOrderId !== -1 ? row[idxOrderId] : '';
      const customerName = getCustomerNameByOrderId(orderId);
      const pier = getPierByOrderId(orderId);

      groups.get(carType).push({
        row,
        extra: { customerName, pier }
      });
    });

    // 차량별로 시간순 정렬
    for (const [, items] of groups.entries()) {
      items.sort((a, b) => {
        const timeA = idxDateTime !== -1 ? (a.row[idxDateTime] || '') : '';
        const timeB = idxDateTime !== -1 ? (b.row[idxDateTime] || '') : '';
        return timeA.localeCompare(timeB, 'ko');
      });
    }

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'ko'));
  }, [filteredData, headers, getCustomerNameByOrderId, getPierByOrderId]);

  // 컬럼 인덱스들
  const idxs = useMemo(() => ({
    orderId: findIdx(headers, '주문ID'),
    category: findIdx(headers, '구분'),
    classification: findIdx(headers, '분류'),
    cruise: findIdx(headers, '크루즈'),
    carType: findIdx(headers, '차량종류'),
    carCode: findIdx(headers, '차량코드'),
    carCount: findIdx(headers, '차량수'),
    // 승차인원 컬럼은 시트마다 명칭이 다를 수 있으므로 여러 후보로 대소문자 구분 없이 찾음
    people: findIdxCI(headers, ['승차인원','인원','명수','인원수','passengers']),
    dateTime: findIdx(headers, '승차일시'),
    pickup: findIdx(headers, '승차위치'),
    dropoff: findIdx(headers, '하차위치'),
    email: findIdx(headers, 'Email'),
  }), [headers]);

  // 인쇄용 스타일
  const printStyles = `
    <style>
      @page {
        size: A4;
        margin: 20mm;
      }
      
      @media print {
        body { margin: 0; }
        .no-print { display: none !important; }
        .print-content { 
          font-family: 'Malgun Gothic', 'Arial Unicode MS', sans-serif;
          font-size: 12px;
          line-height: 1.4;
        }
        .report-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .report-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .report-date {
          font-size: 14px;
          color: #666;
        }
        .vehicle-section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        .vehicle-header {
          background: #f5f5f5;
          padding: 8px;
          font-weight: bold;
          border: 1px solid #ddd;
          margin-bottom: 5px;
        }
        .report-table-vertical {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .report-table-vertical th,
        .report-table-vertical td {
          border: 1px solid #ddd;
          padding: 6px;
          text-align: left;
          font-size: 11px;
          white-space: nowrap;
        }
        .report-table-vertical th {
          background: #f8f9fa;
          font-weight: bold;
          text-align: center;
          width: auto;
          min-width: 80px;
        }
        .report-table-vertical .field-name {
          font-weight: bold;
          background: #f8f9fa;
          width: auto;
          min-width: 80px;
          white-space: nowrap;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .passenger-card {
          border: 1px solid #ddd;
          margin-bottom: 15px;
          padding: 10px;
          page-break-inside: avoid;
        }
        .passenger-header {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 8px;
          padding-bottom: 5px;
          border-bottom: 1px solid #eee;
        }
      }
      
      @media screen {
        .print-content {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          padding: 20mm;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          font-family: 'Malgun Gothic', 'Arial Unicode MS', sans-serif;
        }
        .report-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .report-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .report-date {
          font-size: 14px;
          color: #666;
        }
        .vehicle-section {
          margin-bottom: 25px;
        }
        .vehicle-header {
          background: #f5f5f5;
          padding: 8px;
          font-weight: bold;
          border: 1px solid #ddd;
          margin-bottom: 5px;
        }
        .report-table-vertical {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .report-table-vertical th,
        .report-table-vertical td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          white-space: nowrap;
        }
        .report-table-vertical th {
          background: #f8f9fa;
          font-weight: bold;
          text-align: center;
          width: auto;
          min-width: 80px;
        }
        .report-table-vertical .field-name {
          font-weight: bold;
          background: #f8f9fa;
          width: auto;
          min-width: 80px;
          white-space: nowrap;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .passenger-card {
          border: 1px solid #ddd;
          margin-bottom: 15px;
          padding: 10px;
        }
        .passenger-header {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 8px;
          padding-bottom: 5px;
          border-bottom: 1px solid #eee;
        }
      }
    </style>
  `;

  // 인쇄용 HTML 생성
  const generatePrintHTML = () => {
    if (!startDate || !endDate || groupedByVehicle.length === 0) return '';

    const formatDate = (dateStr) => {
      const d = (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateStr)) ? parseYMDToLocalDate(dateStr) : new Date(dateStr);
      return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    };

    const periodTitle = startDate === endDate ? formatDate(startDate) : `${formatDate(startDate)} ~ ${formatDate(endDate)}`;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${periodTitle} ${t.title}</title>
        ${printStyles}
      </head>
      <body>
        <div class="print-content">
          <div class="report-header">
            <div class="report-title">${periodTitle} ${t.title}</div>
            <div class="report-date">${t.printDate}: ${new Date().toLocaleDateString('ko-KR')}</div>
          </div>
    `;

    groupedByVehicle.forEach(([carType, items]) => {
      html += `
        <div class="vehicle-section">
          <div class="vehicle-header">🚗 ${carType} (${items.length}${t.totalCount})</div>
      `;

      // 세로 테이블로 각 예약별 카드 형태
      items.forEach(({ row, extra }, index) => {
        const dateTime = idxs.dateTime !== -1 ? (row[idxs.dateTime] || '') : '';
        const time = dateTime ? new Date(dateTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '';
        const customerName = extra.customerName || '';
        const people = idxs.people !== -1 ? (row[idxs.people] || '') : '';
        const carCount = idxs.carCount !== -1 ? (row[idxs.carCount] || '') : '';
        const pickup = idxs.pickup !== -1 ? (row[idxs.pickup] || '') : '';
        const dropoff = idxs.dropoff !== -1 ? (row[idxs.dropoff] || '') : '';
        const cruise = idxs.cruise !== -1 ? (row[idxs.cruise] || '') : '';
        const pier = extra.pier || '';
        const category = idxs.category !== -1 ? (row[idxs.category] || '') : '';
        const classification = idxs.classification !== -1 ? (row[idxs.classification] || '') : '';

        html += `
          <div class="passenger-card">
            <div class="passenger-header">${index + 1}. ${customerName} (${time})</div>
            <table class="report-table-vertical">
              <tr>
                <td class="field-name">${t.columns.category}</td>
                <td>${category}</td>
              </tr>
              ${classification ? `
              <tr>
                <td class="field-name">${t.columns.classification}</td>
                <td>${classification}</td>
              </tr>
              ` : ''}
              <tr>
                <td class="field-name">${t.columns.time}</td>
                <td>${time}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.customer}</td>
                <td>${customerName}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.people}</td>
                <td>${people}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.carType}</td>
                <td>${carType}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.carCount}</td>
                <td>${carCount}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.pickup}</td>
                <td>${pickup}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.dropoff}</td>
                <td>${dropoff}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.cruise}</td>
                <td>${cruise}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.pier}</td>
                <td>${pier}</td>
              </tr>
            </table>
          </div>
        `;
      });

      html += `
        </div>
      `;
    });

    html += `
          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
            ${t.totalVehicles} ${groupedByVehicle.length}${t.vehicle}, ${filteredData.length}${t.totalCount}
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  };

  const handlePrint = () => {
    if (!startDate || !endDate || groupedByVehicle.length === 0) {
      alert('날짜 구간을 선택해주세요.');
      return;
    }

    // 미리보기가 꺼져있으면 임시로 켜기
    const wasPreviewOff = !showPreview;
    if (wasPreviewOff) {
      setShowPreview(true);
    }

    // 잠시 기다린 후 인쇄 (미리보기 렌더링 완료를 위해)
    setTimeout(() => {
      // 현재 페이지에서 미리보기 영역만 인쇄
      const printContent = document.querySelector('.print-preview-area');
      if (printContent) {
        const originalContents = document.body.innerHTML;
        const printContents = printContent.innerHTML;
        
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        
        // 미리보기가 원래 꺼져있었다면 다시 끄기
        if (wasPreviewOff) {
          setShowPreview(false);
        }
      }
    }, 100);
  };

  // 사용 가능한 날짜 범위
  const dateRange = useMemo(() => {
    const idxDate = findIdx(headers, '승차일시');
    if (idxDate === -1) return { min: '', max: '' };

    const dates = [];
    data.forEach(row => {
      const dateVal = row[idxDate];
      if (dateVal) {
        try {
          const ymd = toLocalYMD(new Date(dateVal));
          if (ymd) dates.push(ymd);
        } catch (e) {
          // 무시
        }
      }
    });

    if (dates.length === 0) return { min: '', max: '' };
    dates.sort();
    return { min: dates[0], max: dates[dates.length - 1] };
  }, [data, headers]);

  // 기본값을 오늘 날짜로 설정
  useEffect(() => {
    const today = toLocalYMD(new Date());
    if (!startDate) {
      setStartDate(today);
    }
    if (!endDate) {
      setEndDate(today);
    }
  }, [startDate, endDate]);

  return (
    <div style={{ padding: '20px' }}>
      {/* 컨트롤 패널 */}
      <div className="no-print" style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '15px' }}>
          <button onClick={onBack} style={{ padding: '8px 16px' }}>
            ← {t.back}
          </button>
          <button onClick={() => reload()} style={{ padding: '8px 16px' }}>
            🔄 {t.refresh}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label>
            {t.startDate}:
            <input 
              type="date"
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              min={dateRange.min}
              max={dateRange.max}
              style={{ marginLeft: '8px', padding: '6px 12px' }}
            />
          </label>
          
          <label>
            {t.endDate}:
            <input 
              type="date"
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              min={dateRange.min}
              max={dateRange.max}
              style={{ marginLeft: '8px', padding: '6px 12px' }}
            />
          </label>

          <button 
            onClick={handlePrint}
            disabled={!startDate || !endDate || groupedByVehicle.length === 0}
            style={{ 
              padding: '8px 16px', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: (startDate && endDate) ? 'pointer' : 'not-allowed'
            }}
          >
            🖨️ {t.print}
          </button>

          <button 
            onClick={() => setShowPreview(!showPreview)}
            disabled={!startDate || !endDate}
            style={{ 
              padding: '8px 16px', 
              background: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: (startDate && endDate) ? 'pointer' : 'not-allowed'
            }}
          >
            👁️ {showPreview ? t.hidePreview : t.preview}
          </button>
        </div>

        {startDate && endDate && (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            선택된 기간: {startDate} ~ {endDate} | {t.totalVehicles} {groupedByVehicle.length}{t.vehicle} | 총 건수: {filteredData.length}{t.totalCount}
          </div>
        )}
      </div>

      {/* 로딩/에러 상태 */}
      {loading && <div style={{ padding: '20px', textAlign: 'center' }}>{t.loading}</div>}
      {error && <div style={{ padding: '20px', color: 'red' }}>{t.error}: {error}</div>}

      {/* 미리보기 */}
      {showPreview && startDate && endDate && (
        <div 
          className="print-preview-area"
          style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}
          dangerouslySetInnerHTML={{ __html: generatePrintHTML() }}
        />
      )}

      {/* 데이터가 없는 경우 */}
      {!loading && !error && startDate && endDate && groupedByVehicle.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          {t.noData}
        </div>
      )}

      {/* 날짜 미선택 상태 */}
      {!loading && !error && (!startDate || !endDate) && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          {t.selectDateMessage}
        </div>
      )}
    </div>
  );
}

export default ReportSHC;