import React, { useMemo, useState, useEffect } from 'react';
import { useSheetData } from '../utils/adminAPI';

// A4 인쇄용 스하차량 배차표 리포트  
function ReportSHCC({ onBack }) {
  // 시트 데이터 로드
  const { data = [], headers = [], loading, error, loadData: reload } = useSheetData('SH_CC') || {};

  // 보조 시트 (픽업/드랍 및 크루즈/선착장)
  const { data: shcData = [], headers: shcHeaders = [] } = useSheetData('SH_C') || {};
  const { data: shrData = [], headers: shrHeaders = [] } = useSheetData('SH_R') || {};
  const { data: cruiseRows = [], headers: cruiseHeaders = [] } = useSheetData('cruise') || {};

  const [selectedDate, setSelectedDate] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [language, setLanguage] = useState('ko'); // 'ko' or 'vi'

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

  // 다국어 텍스트
  const texts = {
    ko: {
      title: '스테이 하롱 셔틀 리무진 배차표',
      printDate: '출력일',
      selectDate: '날짜 선택',
      selectDatePlaceholder: '날짜를 선택하세요',
      print: '인쇄',
      preview: '미리보기',
      hidePreview: '미리보기 숨기기',
      back: '뒤로가기',
      refresh: '새로고침',
      vehicle: '차량',
      totalVehicles: '총',
      totalCount: '건',
      noData: '선택한 날짜에 해당하는 데이터가 없습니다.',
      selectDateMessage: '상단에서 날짜를 선택하여 배차표를 생성하세요.',
      loading: '데이터를 불러오는 중...',
      error: '오류',
      columns: {
        time: '시간',
        customer: '고객명',
        people: '인원',
        seat: '좌석',
        pickup: '승차위치',
        dropoff: '하차위치',
        cruise: '크루즈',
        pier: '선착장',
        category: '구분',
        note: '비고'
      }
    },
    vi: {
      title: 'Lịch Trình Xe Shuttle Limousine Stay Halong',
      printDate: 'Ngày in',
      selectDate: 'Chọn ngày',
      selectDatePlaceholder: 'Vui lòng chọn ngày',
      print: 'In',
      preview: 'Xem trước',
      hidePreview: 'Ẩn xem trước',
      back: 'Quay lại',
      refresh: 'Làm mới',
      vehicle: 'xe',
      totalVehicles: 'Tổng',
      totalCount: 'chuyến',
      noData: 'Không có dữ liệu cho ngày đã chọn.',
      selectDateMessage: 'Vui lòng chọn ngày ở trên để tạo lịch trình.',
      loading: 'Đang tải dữ liệu...',
      error: 'Lỗi',
      columns: {
        time: 'Thời gian',
        customer: 'Khách hàng',
        people: 'Số người',
        seat: 'Ghế',
        pickup: 'Điểm đón',
        dropoff: 'Điểm trả',
        cruise: 'Du thuyền',
        pier: 'Bến tàu',
        category: 'Loại',
        note: 'Ghi chú'
      }
    }
  };

  const t = texts[language];

  // 보조 조회 함수들
  const getCarFieldByOrderId = (orderId, fieldKey) => {
    if (!orderId) return '';
    const idxOrder = findIdx(shcHeaders, '주문ID');
    if (idxOrder === -1) return '';
    const row = (shcData || []).find(r => (r?.[idxOrder] || '') === orderId);
    if (!row) return '';
    const idxTarget = findIdx(shcHeaders, fieldKey);
    return idxTarget >= 0 ? (row[idxTarget] || '') : '';
  };

  const getCruiseNameByOrderId = (orderId) => {
    if (!orderId) return '';
    const idxOrder = findIdxCI(shrHeaders, ['주문id','주문ID','orderid']);
    if (idxOrder === -1) return '';
    const row = (shrData || []).find(r => (r?.[idxOrder] || '') === orderId);
    if (!row) return '';
    const idxCruise = findIdxCI(shrHeaders, ['크루즈','크루즈명','cruise']);
    return idxCruise >= 0 ? (row[idxCruise] || '') : '';
  };

  const getPierByCruiseName = (cruiseName) => {
    if (!cruiseName) return '';
    const idxCruise = findIdxCI(cruiseHeaders, ['크루즈','크루즈명','cruise']);
    if (idxCruise === -1) return '';
    const idxPier = findIdxCI(cruiseHeaders, ['선착장위치','선착장 위치','선착장','승선장','승선장소','pier','port']);
    if (idxPier === -1) return '';
    const row = (cruiseRows || []).find(r => (''+(r?.[idxCruise]||'')).trim() === (''+cruiseName).trim());
    return row ? (row[idxPier] || '') : '';
  };

  const getPierByOrderId = (orderId) => {
    const c = getCruiseNameByOrderId(orderId);
    return getPierByCruiseName(c);
  };

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

  // 날짜별 필터링된 데이터
  const filteredData = useMemo(() => {
    const idxDate = findIdx(headers, '승차일') !== -1 ? findIdx(headers, '승차일') : findIdx(headers, '승차일자');

    if (!selectedDate || idxDate === -1) return [];

    return (data || []).filter(row => {
      const rowDate = row[idxDate];
      if (!rowDate) return false;

      try {
        const rowYMD = toLocalYMD(new Date(rowDate));
        return rowYMD === selectedDate;
      } catch {
        return false;
      }
    });
  }, [data, headers, selectedDate]);

  // 차량별로 그룹화
  const groupedByVehicle = useMemo(() => {
    const idxVehicle = findIdx(headers, '차량번호');
    const idxOrderId = findIdx(headers, '주문ID');
    const idxTime = findIdx(headers, '승차시간') !== -1 ? findIdx(headers, '승차시간') : findIdx(headers, '시간');

    const groups = new Map();

    filteredData.forEach(row => {
      const vehicle = idxVehicle !== -1 ? (row[idxVehicle] || '미지정') : '미지정';
      
      if (!groups.has(vehicle)) {
        groups.set(vehicle, []);
      }
      
      const orderId = idxOrderId !== -1 ? row[idxOrderId] : '';
      const pickup = getCarFieldByOrderId(orderId, '승차위치');
      const dropoff = getCarFieldByOrderId(orderId, '하차위치');
      const cruiseName = getCruiseNameByOrderId(orderId);
      const pier = getPierByOrderId(orderId);

      groups.get(vehicle).push({
        row,
        extra: { pickup, dropoff, cruiseName, pier }
      });
    });

    // 차량별로 시간순 정렬
    for (const [, items] of groups.entries()) {
      items.sort((a, b) => {
        const timeA = idxTime !== -1 ? (a.row[idxTime] || '') : '';
        const timeB = idxTime !== -1 ? (b.row[idxTime] || '') : '';
        return timeA.localeCompare(timeB, 'ko');
      });
    }

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'ko'));
  }, [filteredData, headers, getCarFieldByOrderId, getCruiseNameByOrderId, getPierByOrderId]);

  // 컬럼 인덱스들
  const idxs = useMemo(() => ({
    name: findIdx(headers, '이름') !== -1 ? findIdx(headers, '이름') : findIdx(headers, '고객명'),
    email: findIdx(headers, 'Email'),
    orderId: findIdx(headers, '주문ID'),
    seatNo: findIdx(headers, '좌석번호'),
    carNo: findIdx(headers, '차량번호'),
    time: findIdx(headers, '승차시간') !== -1 ? findIdx(headers, '승차시간') : findIdx(headers, '시간'),
    route: findIdx(headers, '경로'),
    count: findIdx(headers, '인원') !== -1 ? findIdx(headers, '인원') : findIdx(headers, '명수'),
    category: findIdx(headers, '분류') !== -1 ? findIdx(headers, '분류') : findIdx(headers, '구분'),
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
        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .report-table-vertical {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .report-table th,
        .report-table td,
        .report-table-vertical th,
        .report-table-vertical td {
          border: 1px solid #ddd;
          padding: 6px;
          text-align: left;
          font-size: 11px;
        }
        .report-table th,
        .report-table-vertical th {
          background: #f8f9fa;
          font-weight: bold;
          text-align: center;
          width: 120px;
        }
        .report-table-vertical .field-name {
          font-weight: bold;
          background: #f8f9fa;
          width: 120px;
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
        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .report-table-vertical {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .report-table th,
        .report-table td,
        .report-table-vertical th,
        .report-table-vertical td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .report-table th,
        .report-table-vertical th {
          background: #f8f9fa;
          font-weight: bold;
          text-align: center;
          width: 120px;
        }
        .report-table-vertical .field-name {
          font-weight: bold;
          background: #f8f9fa;
          width: 120px;
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
    if (!selectedDate || groupedByVehicle.length === 0) return '';

      const formatDate = (dateStr) => {
        const d = (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateStr)) ? parseYMDToLocalDate(dateStr) : new Date(dateStr);
        if (language === 'vi') {
          return d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
        }
        return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
      };

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${formatDate(selectedDate)} ${t.title}</title>
        ${printStyles}
      </head>
      <body>
        <div class="print-content">
          <div class="report-header">
            <div class="report-title">${formatDate(selectedDate)} ${t.title}</div>
            <div class="report-date">${t.printDate}: ${new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'ko-KR')}</div>
          </div>
    `;

    groupedByVehicle.forEach(([vehicle, items]) => {
      html += `
        <div class="vehicle-section">
          <div class="vehicle-header">🚐 ${vehicle} (${items.length}${t.totalCount})</div>
      `;

      // 세로 테이블로 각 승객별 카드 형태
      items.forEach(({ row, extra }, index) => {
        const time = idxs.time !== -1 ? (row[idxs.time] || '') : '';
        const name = idxs.name !== -1 ? (row[idxs.name] || '') : '';
        const count = idxs.count !== -1 ? (row[idxs.count] || '') : '';
        const seat = idxs.seatNo !== -1 ? (row[idxs.seatNo] || '') : '';
        const category = idxs.category !== -1 ? (row[idxs.category] || '') : '';
        const route = idxs.route !== -1 ? (row[idxs.route] || '') : '';

        html += `
          <div class="passenger-card">
            <div class="passenger-header">${index + 1}. ${name} (${time})</div>
            <table class="report-table-vertical">
              <tr>
                <td class="field-name">${t.columns.time}</td>
                <td>${time}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.customer}</td>
                <td>${name}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.people}</td>
                <td>${count}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.seat}</td>
                <td>${seat}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.pickup}</td>
                <td>${extra.pickup || ''}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.dropoff}</td>
                <td>${extra.dropoff || ''}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.cruise}</td>
                <td>${extra.cruiseName || ''}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.pier}</td>
                <td>${extra.pier || ''}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.category}</td>
                <td>${category}</td>
              </tr>
              <tr>
                <td class="field-name">${t.columns.note}</td>
                <td>${route}</td>
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
    if (!selectedDate || groupedByVehicle.length === 0) {
      alert(language === 'vi' ? 'Vui lòng chọn ngày.' : '날짜를 선택해주세요.');
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

  // 사용 가능한 날짜 목록
  const availableDates = useMemo(() => {
    const idxDate = findIdx(headers, '승차일') !== -1 ? findIdx(headers, '승차일') : findIdx(headers, '승차일자');
    if (idxDate === -1) return [];

    const dates = new Set();
    data.forEach(row => {
      const dateVal = row[idxDate];
      if (dateVal) {
        try {
          const d = new Date(dateVal);
          const ymd = toLocalYMD(d);
          if (ymd) {
            // 오늘 이후(포함) 만 추가
            const todayYMD = toLocalYMD(new Date());
            if (ymd >= todayYMD) {
              dates.add(ymd);
            }
          }
        } catch (e) {
          // 무시
        }
      }
    });

    return Array.from(dates).sort();
  }, [data, headers]);

  const formatDateOption = (dateStr) => {
    const d = new Date(dateStr);
    if (language === 'vi') {
      return d.toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        weekday: 'long' 
      });
    }
    return d.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
    });
  };

  // availableDates가 로드되면 selectedDate가 비어있을 때 자동으로 첫 날짜를 선택
  useEffect(() => {
    if (!selectedDate && Array.isArray(availableDates) && availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
      // preview는 기본 true이므로 자동으로 미리보기가 보입니다
    }
  }, [availableDates, selectedDate]);

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
          
          {/* 언어 전환 버튼 */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => setLanguage('ko')}
              style={{ 
                padding: '6px 12px',
                background: language === 'ko' ? '#007bff' : '#e9ecef',
                color: language === 'ko' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              한글
            </button>
            <button 
              onClick={() => setLanguage('vi')}
              style={{ 
                padding: '6px 12px',
                background: language === 'vi' ? '#007bff' : '#e9ecef',
                color: language === 'vi' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Tiếng Việt
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label>
            {t.selectDate}:
            <select 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ marginLeft: '8px', padding: '6px 12px' }}
            >
              <option value="">{t.selectDatePlaceholder}</option>
              {availableDates.map(date => (
                <option key={date} value={date}>
                  {formatDateOption(date)}
                </option>
              ))}
            </select>
          </label>

          <button 
            onClick={handlePrint}
            disabled={!selectedDate || groupedByVehicle.length === 0}
            style={{ 
              padding: '8px 16px', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: selectedDate ? 'pointer' : 'not-allowed'
            }}
          >
            🖨️ {t.print}
          </button>

          <button 
            onClick={() => setShowPreview(!showPreview)}
            disabled={!selectedDate}
            style={{ 
              padding: '8px 16px', 
              background: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: selectedDate ? 'pointer' : 'not-allowed'
            }}
          >
            👁️ {showPreview ? t.hidePreview : t.preview}
          </button>
        </div>

        {selectedDate && (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            {language === 'vi' ? 'Ngày đã chọn' : '선택된 날짜'}: {formatDateOption(selectedDate)} | {t.totalVehicles} {groupedByVehicle.length}{t.vehicle} | {language === 'vi' ? 'Tổng số' : '총 건수'}: {filteredData.length}{t.totalCount}
          </div>
        )}
      </div>

      {/* 로딩/에러 상태 */}
      {loading && <div style={{ padding: '20px', textAlign: 'center' }}>{t.loading}</div>}
      {error && <div style={{ padding: '20px', color: 'red' }}>{t.error}: {error}</div>}

      {/* 미리보기 */}
      {showPreview && selectedDate && (
        <div 
          className="print-preview-area"
          style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}
          dangerouslySetInnerHTML={{ __html: generatePrintHTML() }}
        />
      )}

      {/* 데이터가 없는 경우 */}
      {!loading && !error && selectedDate && groupedByVehicle.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          {t.noData}
        </div>
      )}

      {/* 날짜 미선택 상태 */}
      {!loading && !error && !selectedDate && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          {t.selectDateMessage}
        </div>
      )}
    </div>
  );
}

export default ReportSHCC;