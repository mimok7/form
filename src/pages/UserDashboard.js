import React, { useMemo, useState, useEffect } from 'react';
import { useSheetData } from '../utils/adminAPI';
import './AdminDashboard.css';

// 서비스 정의: 표시 이름과 시트명
const SERVICE_SHEETS = [
  { key: 'cruise', name: '크루즈', sheet: 'SH_R' },
  { key: 'car', name: '차량', sheet: 'SH_CC' },
  { key: 'sh_sp', name: '스하 차량', sheet: 'SH_SP' },
  { key: 'airport', name: '공항', sheet: 'SH_P' },
  { key: 'rental', name: '렌트카', sheet: 'SH_RC' },
  { key: 'tour', name: '투어', sheet: 'SH_T' },
  { key: 'hotel', name: '호텔', sheet: 'SH_H' },
];

function pickAllFields(headers = [], row = []) {
  return headers.map((h, i) => ({ label: h, value: row[i] }));
}

function tryParseDate(s) {
  if (!s) return null;
  if (s instanceof Date && !isNaN(s.getTime())) return s;
  const str = String(s).trim();
  
  // ISO 날짜 형식 시도
  const iso = Date.parse(str);
  if (!isNaN(iso)) return new Date(iso);
  
  // 다양한 구분자 형식 시도 (/, ., -)
  const parts = str.includes('/') ? str.split('/') : 
               str.includes('.') ? str.split('.') : 
               str.includes('-') ? str.split('-') : null;
  
  if (parts && parts.length === 3) {
    const p = parts.map(x => parseInt(x, 10));
    if (p.every(Number.isFinite)) {
      // YYYY-MM-DD 형식 (첫 번째 숫자가 4자리 이상)
      if (p[0] >= 1000) return new Date(p[0], p[1] - 1, p[2]);
      // DD-MM-YYYY 또는 MM-DD-YYYY 형식
      if (p[0] > 12) return new Date(p[2], p[1] - 1, p[0]); // DD-MM-YYYY
      return new Date(p[2], p[0] - 1, p[1]); // MM-DD-YYYY
    }
  }
  
  // 한국어 날짜 형식 시도 (2024년 8월 31일)
  const koreanDateMatch = str.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (koreanDateMatch) {
    const [, year, month, day] = koreanDateMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  return null;
}

export default function UserDashboard({ onBack }) {
  // 명시적으로 훅 반환값을 구조분해해서 사용합니다 (렌더링 안정성 개선)
  const { data: SH_M_data = [], headers: SH_M_headers = [], loading: SH_M_loading, error: SH_M_error } = useSheetData('SH_M') || {};
  const { data: SH_R_data = [], headers: SH_R_headers = [] } = useSheetData('SH_R') || {};
  const { data: SH_C_data = [], headers: SH_C_headers = [] } = useSheetData('SH_C') || {};
  const { data: SH_CC_data = [], headers: SH_CC_headers = [] } = useSheetData('SH_CC') || {};
  const { data: SH_P_data = [], headers: SH_P_headers = [] } = useSheetData('SH_P') || {};
  const { data: SH_SP_data = [], headers: SH_SP_headers = [] } = useSheetData('SH_SP') || {};
  const { data: SH_RC_data = [], headers: SH_RC_headers = [] } = useSheetData('SH_RC') || {};
  const { data: SH_T_data = [], headers: SH_T_headers = [] } = useSheetData('SH_T') || {};
  const { data: SH_H_data = [], headers: SH_H_headers = [] } = useSheetData('SH_H') || {};

  // sheetsMap 제거: 훅 의존성 경고를 줄이기 위해 개별 SH_* 값들을 직접 사용합니다.

  const [orderIdInput, setOrderIdInput] = useState('');
  const [searchedId, setSearchedId] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [popupView, setPopupView] = useState('basic'); // 'basic' or 'full'
  const [popupSearchedId, setPopupSearchedId] = useState(''); // 팝업 전용 검색 상태
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 기본 날짜 설정: 시작일은 3일 전, 종료일은 오늘
  useEffect(() => {
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    if (!startDate) {
      setStartDate(formatDate(threeDaysAgo));
    }
    if (!endDate) {
      setEndDate(formatDate(today));
    }
  }, [startDate, endDate]);

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setPopupView('basic');
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedUser(null);
    setPopupView('basic');
    setPopupSearchedId(''); // 팝업 닫을 때 검색 상태 초기화
  };

  const handleFullSearch = () => {
    if (selectedUser) {
      const key = selectedUser.orderId || selectedUser.email || selectedUser.name;
      setPopupSearchedId(key); // 팝업 전용 검색 상태만 변경
      setPopupView('full');
    }
  };

  function buildRecentUsersLocal(mHeaders, mData, startDate, endDate) {
    if (!mHeaders || !mData) return [];
    const headers = mHeaders;
    
    // 다양한 날짜 필드명을 검색 (SH_M 시트의 예약일 기준)
    const possibleDateFields = ['승차일자', '일자', '예약일', '날짜', 'Date', '예약일자'];
    let dateIdx = -1;
    for (const field of possibleDateFields) {
      dateIdx = headers.indexOf(field);
      if (dateIdx >= 0) break;
    }
    
    const mNameKoIdx = headers.indexOf('한글이름');
    const mNameEnIdx = headers.indexOf('영문이름');
    const mEmailIdx = headers.indexOf('이메일') >= 0 ? headers.indexOf('이메일') : headers.indexOf('Email');
    const mOrderIdIdx = headers.indexOf('주문ID');

    const users = [];
  mData.forEach((row) => {
      const dt = dateIdx >= 0 ? tryParseDate(row[dateIdx]) : null;
      
      // 날짜 범위 필터링
      if (startDate || endDate) {
        if (!dt) return; // 날짜가 없는 데이터는 필터링 시 제외
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start && dt < start) return;
        if (end && dt > end) return;
      }
      
      const orderId = mOrderIdIdx >= 0 ? row[mOrderIdIdx] : null;
      const nameKo = mNameKoIdx >= 0 ? row[mNameKoIdx] || '' : '';
      const nameEn = mNameEnIdx >= 0 ? row[mNameEnIdx] || '' : '';
      const email = mEmailIdx >= 0 ? row[mEmailIdx] || '' : '';
      const display = nameKo || nameEn || email || orderId || '알수없음';
      users.push({ orderId, name: display, englishName: nameEn, email, date: dt });
    });

    const map = new Map();
    users.forEach((u) => {
      const key = (u.email && String(u.email).trim()) || (u.orderId && String(u.orderId).trim()) || u.name;
      const exist = map.get(key);
      if (!exist || (u.date && (!exist.date || u.date > exist.date))) map.set(key, u);
    });

    const arr = Array.from(map.values());
    arr.sort((a, b) => {
      const ta = a.date ? a.date.getTime() : 0;
      const tb = b.date ? b.date.getTime() : 0;
      return tb - ta;
    });
    return arr;
  }

  const recentUsersGlobal = useMemo(() => buildRecentUsersLocal(SH_M_headers, SH_M_data, startDate, endDate), [SH_M_data, SH_M_headers, startDate, endDate]);

  // SH_M 시트의 예약일 기준으로 그룹화
  const usersByDate = useMemo(() => {
    const grouped = new Map();
    recentUsersGlobal.forEach(user => {
      // SH_M 시트의 예약일이 있는 경우 로컬 YYYY-MM-DD 형식으로 그룹화
      const dateKey = user.date ? 
        `${user.date.getFullYear()}-${String(user.date.getMonth() + 1).padStart(2, '0')}-${String(user.date.getDate()).padStart(2, '0')}` : 
        '예약일 없음';
      if (!grouped.has(dateKey)) grouped.set(dateKey, []);
      grouped.get(dateKey).push(user);
    });
    // 최신 날짜가 먼저 오도록 정렬 (예약일 없는 그룹은 마지막에)
    return Array.from(grouped.entries()).sort((a, b) => {
      if (a[0] === '예약일 없음') return 1;
      if (b[0] === '예약일 없음') return -1;
      return b[0].localeCompare(a[0]);
    });
  }, [recentUsersGlobal]);

  const resultsByService = useMemo(() => {
    if (!searchedId) return [];
    const q = searchedId.toString().trim().toLowerCase();
    if (!q) return [];
    const memberData = SH_M_data || [];
    const memberHeaders = SH_M_headers || [];
    const memberIdIdx = memberHeaders.indexOf('주문ID');
    const memberEmailIdx = memberHeaders.indexOf('이메일') >= 0 ? memberHeaders.indexOf('이메일') : memberHeaders.indexOf('Email');

    const groups = [];
    for (const svc of SERVICE_SHEETS) {
      const sheetKey = svc.sheet;
      const headers = (
        sheetKey === 'SH_R' ? SH_R_headers :
        sheetKey === 'SH_C' ? SH_C_headers :
        sheetKey === 'SH_CC' ? SH_CC_headers :
        sheetKey === 'SH_P' ? SH_P_headers :
        sheetKey === 'SH_SP' ? SH_SP_headers :
        sheetKey === 'SH_RC' ? SH_RC_headers :
        sheetKey === 'SH_T' ? SH_T_headers :
        sheetKey === 'SH_H' ? SH_H_headers : []
      );
      const rows = (
        sheetKey === 'SH_R' ? SH_R_data :
        sheetKey === 'SH_C' ? SH_C_data :
        sheetKey === 'SH_CC' ? SH_CC_data :
        sheetKey === 'SH_P' ? SH_P_data :
        sheetKey === 'SH_SP' ? SH_SP_data :
        sheetKey === 'SH_RC' ? SH_RC_data :
        sheetKey === 'SH_T' ? SH_T_data :
        sheetKey === 'SH_H' ? SH_H_data : []
      );
      if (!headers.length || !rows.length) continue;
      const idIdx = headers.indexOf('주문ID');
      const nameKoIdx = headers.indexOf('한글이름');
      const nameEnIdx = headers.indexOf('영문이름');
      const emailIdx = headers.indexOf('이메일') >= 0 ? headers.indexOf('이메일') : headers.indexOf('Email');

      const matched = rows.filter((row) => {
        const orderId = idIdx >= 0 ? (row[idIdx] || '') : '';
        const nmKo = nameKoIdx >= 0 ? (row[nameKoIdx] || '') : '';
        const nmEn = nameEnIdx >= 0 ? (row[nameEnIdx] || '') : '';
        const em = emailIdx >= 0 ? (row[emailIdx] || '') : '';

        if (orderId && String(orderId).trim() === searchedId) return true;
        if (em && String(em).trim().toLowerCase() === q) return true;
        if (nmKo && String(nmKo).toLowerCase().includes(q)) return true;
        if (nmEn && String(nmEn).toLowerCase().includes(q)) return true;

        if (orderId && memberIdIdx >= 0) {
          const mrow = memberData.find((mr) => mr[memberIdIdx] === orderId);
          if (mrow) {
            const memEmail = memberEmailIdx >= 0 ? (mrow[memberEmailIdx] || '') : '';
            const memNameKo = memberHeaders.indexOf('한글이름') >= 0 ? (mrow[memberHeaders.indexOf('한글이름')] || '') : '';
            const memNameEn = memberHeaders.indexOf('영문이름') >= 0 ? (mrow[memberHeaders.indexOf('영문이름')] || '') : '';
            if (memEmail && String(memEmail).trim().toLowerCase() === q) return true;
            if (memNameKo && String(memNameKo).toLowerCase().includes(q)) return true;
            if (memNameEn && String(memNameEn).toLowerCase().includes(q)) return true;
          }
        }

        return false;
      });

      if (matched.length > 0) {
  // SH_CC(차량) 서비스의 경우 승차일자별로 그룹화
  if (svc.key === 'car') {
          const dateIdx = headers.indexOf('승차일자');
          if (dateIdx >= 0) {
            const dateGroups = new Map();
            matched.forEach(row => {
              const dateValue = row[dateIdx] || '';
              const dateKey = dateValue ? tryParseDate(dateValue)?.toISOString().slice(0, 10) || dateValue : '승차일 없음';
              if (!dateGroups.has(dateKey)) dateGroups.set(dateKey, []);
              dateGroups.get(dateKey).push(row);
            });
            
            // 승차일별로 정렬하여 그룹 생성
            const sortedDateGroups = Array.from(dateGroups.entries()).sort((a, b) => {
              if (a[0] === '승차일 없음') return 1;
              if (b[0] === '승차일 없음') return -1;
              return b[0].localeCompare(a[0]);
            });
            
            sortedDateGroups.forEach(([dateKey, rows]) => {
              groups.push({ 
                service: svc, 
                headers, 
                rows, 
                dateGroup: dateKey,
                isDateGrouped: true 
              });
            });
          } else {
            groups.push({ service: svc, headers, rows: matched });
          }
        } else {
          groups.push({ service: svc, headers, rows: matched });
        }
      }
    }
    return groups;
  }, [searchedId, SH_M_data, SH_M_headers, SH_R_data, SH_R_headers, SH_C_data, SH_C_headers, SH_CC_data, SH_CC_headers, SH_P_data, SH_P_headers, SH_SP_data, SH_SP_headers, SH_RC_data, SH_RC_headers, SH_T_data, SH_T_headers, SH_H_data, SH_H_headers]);

  const memberInfo = useMemo(() => {
    if (!searchedId) return null;
  if (!SH_M_data || !SH_M_headers) return null;
  const headers = SH_M_headers;
  const rows = SH_M_data;
    const orderIdIdx = headers.indexOf('주문ID');
    const emailIdx = headers.indexOf('이메일') >= 0 ? headers.indexOf('이메일') : headers.indexOf('Email');
    const nameKoIdx = headers.indexOf('한글이름');
    const nameEnIdx = headers.indexOf('영문이름');
    const q = searchedId.toString().trim().toLowerCase();

    const found = rows.find((row) => {
      const oid = orderIdIdx >= 0 ? (row[orderIdIdx] || '') : '';
      const em = emailIdx >= 0 ? (row[emailIdx] || '') : '';
      const nk = nameKoIdx >= 0 ? (row[nameKoIdx] || '') : '';
      const ne = nameEnIdx >= 0 ? (row[nameEnIdx] || '') : '';
      if (oid && String(oid).trim() === searchedId) return true;
      if (em && String(em).trim().toLowerCase() === q) return true;
      if (nk && String(nk).toLowerCase().includes(q)) return true;
      if (ne && String(ne).toLowerCase().includes(q)) return true;
      return false;
    });

    if (!found) return null;
    const out = {};
    headers.forEach((h, idx) => { out[h] = found[idx]; });
    out.matchedCount = resultsByService ? resultsByService.reduce((s, g) => s + g.rows.length, 0) : 0;
    return out;
  }, [searchedId, SH_M_data, SH_M_headers, resultsByService]);

  // 특정 사용자(주문ID/이메일)에 대한 서비스 라벨 계산
  const getServiceLabelsFor = (orderId, email) => {
    const labels = [];
    const colorMap = {
      cruise: { bg: '#E0F2FE', color: '#075985', border: '#BAE6FD' },
      car: { bg: '#FEF3C7', color: '#92400e', border: '#FDE68A' },
      sh_sp: { bg: '#ECFCCB', color: '#365314', border: '#D1FAE5' },
      airport: { bg: '#FCE7F3', color: '#831843', border: '#FBCFE8' },
      rental: { bg: '#FFF7ED', color: '#7C2D12', border: '#FFE4C4' },
      tour: { bg: '#EEF2FF', color: '#4338CA', border: '#CDD7FF' },
      hotel: { bg: '#F3F4F6', color: '#111827', border: '#E5E7EB' }
    };

    for (const svc of SERVICE_SHEETS) {
      const sheetKey = svc.sheet;
      const headers = (
        sheetKey === 'SH_R' ? SH_R_headers :
        sheetKey === 'SH_C' ? SH_C_headers :
        sheetKey === 'SH_CC' ? SH_CC_headers :
        sheetKey === 'SH_P' ? SH_P_headers :
        sheetKey === 'SH_SP' ? SH_SP_headers :
        sheetKey === 'SH_RC' ? SH_RC_headers :
        sheetKey === 'SH_T' ? SH_T_headers :
        sheetKey === 'SH_H' ? SH_H_headers : []
      );
      const dataRows = (
        sheetKey === 'SH_R' ? SH_R_data :
        sheetKey === 'SH_C' ? SH_C_data :
        sheetKey === 'SH_CC' ? SH_CC_data :
        sheetKey === 'SH_P' ? SH_P_data :
        sheetKey === 'SH_SP' ? SH_SP_data :
        sheetKey === 'SH_RC' ? SH_RC_data :
        sheetKey === 'SH_T' ? SH_T_data :
        sheetKey === 'SH_H' ? SH_H_data : []
      );
      if (!headers.length || !dataRows.length) continue;
      const idIdx = headers.indexOf('주문ID');
      const emailIdx = headers.indexOf('이메일') >= 0 ? headers.indexOf('이메일') : headers.indexOf('Email');
      const found = dataRows.some(row => {
        const oid = idIdx >= 0 ? (row[idIdx] || '') : '';
        const em = emailIdx >= 0 ? (row[emailIdx] || '') : '';
        return (orderId && String(oid).trim() === String(orderId).trim()) ||
               (email && em && String(em).trim().toLowerCase() === String(email).trim().toLowerCase());
      });
      if (found) labels.push({ key: svc.key, name: svc.name, style: colorMap[svc.key] || { bg: '#EEF2FF', color: '#334155', border: '#c7d2fe' } });
    }
    return labels;
  };

  // 팝업 전용 검색 결과 계산
  const popupResultsByService = useMemo(() => {
    if (!popupSearchedId) return [];
    const q = popupSearchedId.toString().trim().toLowerCase();
    if (!q) return [];
    const memberData = SH_M_data || [];
    const memberHeaders = SH_M_headers || [];
    const memberIdIdx = memberHeaders.indexOf('주문ID');
    const memberEmailIdx = memberHeaders.indexOf('이메일') >= 0 ? memberHeaders.indexOf('이메일') : memberHeaders.indexOf('Email');

    const groups = [];
    for (const svc of SERVICE_SHEETS) {
      const sheetKey = svc.sheet;
      const headers = (
        sheetKey === 'SH_R' ? SH_R_headers :
        sheetKey === 'SH_C' ? SH_C_headers :
        sheetKey === 'SH_CC' ? SH_CC_headers :
        sheetKey === 'SH_P' ? SH_P_headers :
        sheetKey === 'SH_SP' ? SH_SP_headers :
        sheetKey === 'SH_RC' ? SH_RC_headers :
        sheetKey === 'SH_T' ? SH_T_headers :
        sheetKey === 'SH_H' ? SH_H_headers : []
      );
      const rows = (
        sheetKey === 'SH_R' ? SH_R_data :
        sheetKey === 'SH_C' ? SH_C_data :
        sheetKey === 'SH_CC' ? SH_CC_data :
        sheetKey === 'SH_P' ? SH_P_data :
        sheetKey === 'SH_SP' ? SH_SP_data :
        sheetKey === 'SH_RC' ? SH_RC_data :
        sheetKey === 'SH_T' ? SH_T_data :
        sheetKey === 'SH_H' ? SH_H_data : []
      );
      if (!headers.length || !rows.length) continue;
      const idIdx = headers.indexOf('주문ID');
      const nameKoIdx = headers.indexOf('한글이름');
      const nameEnIdx = headers.indexOf('영문이름');
      const emailIdx = headers.indexOf('이메일') >= 0 ? headers.indexOf('이메일') : headers.indexOf('Email');

      const matched = rows.filter((row) => {
        const orderId = idIdx >= 0 ? (row[idIdx] || '') : '';
        const nmKo = nameKoIdx >= 0 ? (row[nameKoIdx] || '') : '';
        const nmEn = nameEnIdx >= 0 ? (row[nameEnIdx] || '') : '';
        const em = emailIdx >= 0 ? (row[emailIdx] || '') : '';

        if (orderId && String(orderId).trim() === popupSearchedId) return true;
        if (em && String(em).trim().toLowerCase() === q) return true;
        if (nmKo && String(nmKo).toLowerCase().includes(q)) return true;
        if (nmEn && String(nmEn).toLowerCase().includes(q)) return true;

        if (orderId && memberIdIdx >= 0) {
          const mrow = memberData.find((mr) => mr[memberIdIdx] === orderId);
          if (mrow) {
            const memEmail = memberEmailIdx >= 0 ? (mrow[memberEmailIdx] || '') : '';
            const memNameKo = memberHeaders.indexOf('한글이름') >= 0 ? (mrow[memberHeaders.indexOf('한글이름')] || '') : '';
            const memNameEn = memberHeaders.indexOf('영문이름') >= 0 ? (mrow[memberHeaders.indexOf('영문이름')] || '') : '';
            if (memEmail && String(memEmail).trim().toLowerCase() === q) return true;
            if (memNameKo && String(memNameKo).toLowerCase().includes(q)) return true;
            if (memNameEn && String(memNameEn).toLowerCase().includes(q)) return true;
          }
        }

        return false;
      });

      if (matched.length > 0) {
        // SH_CC(차량) 서비스의 경우 승차일자별로 그룹화
        if (svc.key === 'car') {
          const dateIdx = headers.indexOf('승차일자');
          if (dateIdx >= 0) {
            const dateGroups = new Map();
            matched.forEach(row => {
              const dateValue = row[dateIdx] || '';
              const dateKey = dateValue ? tryParseDate(dateValue)?.toISOString().slice(0, 10) || dateValue : '승차일 없음';
              if (!dateGroups.has(dateKey)) dateGroups.set(dateKey, []);
              dateGroups.get(dateKey).push(row);
            });
            
            // 승차일별로 정렬하여 그룹 생성
            const sortedDateGroups = Array.from(dateGroups.entries()).sort((a, b) => {
              if (a[0] === '승차일 없음') return 1;
              if (b[0] === '승차일 없음') return -1;
              return b[0].localeCompare(a[0]);
            });
            
            sortedDateGroups.forEach(([dateKey, rows]) => {
              groups.push({ 
                service: svc, 
                headers, 
                rows, 
                dateGroup: dateKey,
                isDateGrouped: true 
              });
            });
          } else {
            groups.push({ service: svc, headers, rows: matched });
          }
        } else {
          groups.push({ service: svc, headers, rows: matched });
        }
      }
    }
    return groups;
  }, [popupSearchedId, SH_M_data, SH_M_headers, SH_R_data, SH_R_headers, SH_C_data, SH_C_headers, SH_CC_data, SH_CC_headers, SH_P_data, SH_P_headers, SH_SP_data, SH_SP_headers, SH_RC_data, SH_RC_headers, SH_T_data, SH_T_headers, SH_H_data, SH_H_headers]);

  const popupMemberInfo = useMemo(() => {
    if (!popupSearchedId) return null;
  if (!SH_M_data || !SH_M_headers) return null;
  const headers = SH_M_headers;
  const rows = SH_M_data;
    const orderIdIdx = headers.indexOf('주문ID');
    const emailIdx = headers.indexOf('이메일') >= 0 ? headers.indexOf('이메일') : headers.indexOf('Email');
    const nameKoIdx = headers.indexOf('한글이름');
    const nameEnIdx = headers.indexOf('영문이름');
    const q = popupSearchedId.toString().trim().toLowerCase();

    const found = rows.find((row) => {
      const oid = orderIdIdx >= 0 ? (row[orderIdIdx] || '') : '';
      const em = emailIdx >= 0 ? (row[emailIdx] || '') : '';
      const nk = nameKoIdx >= 0 ? (row[nameKoIdx] || '') : '';
      const ne = nameEnIdx >= 0 ? (row[nameEnIdx] || '') : '';
      if (oid && String(oid).trim() === popupSearchedId) return true;
      if (em && String(em).trim().toLowerCase() === q) return true;
      if (nk && String(nk).toLowerCase().includes(q)) return true;
      if (ne && String(ne).toLowerCase().includes(q)) return true;
      return false;
    });

    if (!found) return null;
    const out = {};
    headers.forEach((h, idx) => { out[h] = found[idx]; });
    out.matchedCount = popupResultsByService ? popupResultsByService.reduce((s, g) => s + g.rows.length, 0) : 0;
    return out;
  }, [popupSearchedId, SH_M_data, SH_M_headers, popupResultsByService]);

  return (
    <div className="service-dashboard">
      <div className="admin-header">
        <h1>예약일 별 현황 </h1>
        <div style={{ display: 'flex', gap: 12 }}>
          {onBack && (
            <button className="back-btn" onClick={onBack}>← 뒤로</button>
          )}
          <button className="home-btn" onClick={() => (window.location.href = '/admin')}>🏠 홈</button>
        </div>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="한글이름, 영문이름, 이메일을 입력하세요"
          value={orderIdInput}
          onChange={(e) => setOrderIdInput(e.target.value)}
          className="search-input"
        />
        <button className="refresh-btn" onClick={() => setSearchedId(orderIdInput.trim())}>🔍 조회</button>
        {searchedId && (
          <button className="cancel-btn" style={{ marginLeft: 8 }} onClick={() => { setOrderIdInput(''); setSearchedId(''); }}>초기화</button>
        )}
        
        {/* 날짜 범위 선택 */}
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>시작일:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>종료일:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          {(startDate || endDate) && (
            <button 
              className="cancel-btn" 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              style={{ padding: '6px 12px' }}
            >
              날짜 초기화
            </button>
          )}
        </div>
      </div>

      {searchedId ? (
        <div className="cards-container">
          <div className="cards-grid" style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div className="data-card">
              <div className="card-header"><h4>사용자 정보</h4></div>
              <div className="card-content">
                {SH_M_loading ? (
                  <div className="no-data">사용자 정보를 불러오는 중입니다...</div>
                ) : SH_M_error ? (
                  <div className="no-data">사용자 정보를 불러오는데 실패했습니다: {SH_M_error}</div>
                ) : memberInfo ? (
                  <table className="card-table">
                    <tbody>
                      {/* 서비스 라벨 */}
                      <tr className="card-row">
                        <th className="card-collabel">
                          <svg viewBox="0 0 24 24" className="label-icon" aria-hidden>
                            <circle cx="12" cy="12" r="8" fill="currentColor" />
                          </svg>
                          <span className="label-text">서비스</span>
                        </th>
                        <td className="card-colvalue">
                          {(() => {
                            const labels = getServiceLabelsFor(memberInfo['주문ID'], memberInfo['이메일'] || memberInfo['Email']);
                            return labels.length ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {labels.map((l, i) => (
                                  <span key={i} style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    background: l.style.bg,
                                    color: l.style.color,
                                    border: `1px solid ${l.style.border}`,
                                    borderRadius: 999,
                                    fontSize: 12
                                  }}>{l.name}</span>
                                ))}
                              </div>
                            ) : '-';
                          })()}
                        </td>
                      </tr>
                      {Object.entries(memberInfo)
                        .filter(([, v]) => v !== '' && v !== null && v !== undefined && !['matchedCount'].includes([0]))
                        .map(([k, v]) => (
                          <tr key={k} className="card-row">
                            <th className="card-collabel">
                              <svg viewBox="0 0 24 24" className="label-icon" aria-hidden>
                                <circle cx="12" cy="12" r="8" fill="currentColor" />
                              </svg>
                              <span className="label-text">{k}</span>
                            </th>
                            <td className="card-colvalue"><span title={v}>{v}</span></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data">사용자 정보를 찾을 수 없습니다.</div>
                )}
              </div>
            </div>
          </div>

          <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {SH_M_loading ? (
              <div className="no-data">데이터를 불러오는 중입니다...</div>
            ) : SH_M_error ? (
              <div className="no-data">데이터를 불러오는데 실패했습니다: {SH_M_error}</div>
            ) : resultsByService.length === 0 ? (
              <div className="no-data">조회된 예약 내역이 없습니다.</div>
            ) : (
              resultsByService.map((group, gidx) => (
                <React.Fragment key={gidx}>
                  <div className="date-header" style={{ margin: '8px 0' }}>
                    <h3>
                      {group.service.name}
                      {group.isDateGrouped && group.dateGroup && (
                        <span style={{ fontSize: '0.9em', fontWeight: 'normal', marginLeft: '8px' }}>
                          - {group.dateGroup}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="group-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {group.rows.map((row, idx) => {
                      const headers = group.headers;
                      const fields = pickAllFields(headers, row);
                      return (
                        <div key={idx} className="data-card">
                          <div className="card-header">
                            <h4>
                              {group.service.name} 예약
                              {group.isDateGrouped ? ` #${idx + 1}` : ''}
                            </h4>
                          </div>
                          <div className="card-content">
                            <table className="card-table">
                              <tbody>
                                {fields.map(({ label, value }, i) => (
                                  <tr key={i} className="card-row">
                                    <th className="card-collabel">
                                      <svg viewBox="0 0 24 24" className="label-icon" aria-hidden>
                                        <circle cx="12" cy="12" r="8" fill="currentColor" />
                                      </svg>
                                      <span className="label-text">{label}</span>
                                    </th>
                                    <td className="card-colvalue"><span title={String(value)}>{String(value)}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="cards-container">
          {SH_M_loading ? (
            <div className="no-data">데이터를 불러오는 중입니다...</div>
          ) : SH_M_error ? (
            <div className="no-data">데이터를 불러오는데 실패했습니다: {SH_M_error}</div>
          ) : usersByDate.length === 0 ? (
            <div className="no-data">예약 데이터가 없습니다.</div>
          ) : (
            usersByDate.map(([dateKey, users]) => (
              <div key={dateKey} className="group">
                <div className="date-header"><h3>{dateKey}</h3></div>
                <div className="group-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {users.map((u, i) => (
                    <div key={i} className="data-card">
                      <div className="card-header">
                        <h4>{u.name}</h4>
                        <div className="card-actions">
                          <button
                            className="view-btn"
                            onClick={() => handleViewUser(u)}
                          >
                            조회
                          </button>
                        </div>
                      </div>
                      <div className="card-content">
                        <table className="card-table">
                          <tbody>
                            {/* 서비스 라벨 */}
                            <tr className="card-row">
                              <th className="card-collabel">
                                <svg viewBox="0 0 24 24" className="label-icon" aria-hidden>
                                  <circle cx="12" cy="12" r="8" fill="currentColor" />
                                </svg>
                                <span className="label-text">서비스</span>
                              </th>
                              <td className="card-colvalue">
                                {(() => {
                                  const labels = getServiceLabelsFor(u.orderId, u.email);
                                  return labels.length ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                      {labels.map((l, i) => (
                                        <span key={i} style={{
                                          display: 'inline-block',
                                          padding: '2px 8px',
                                          background: l.style.bg,
                                          color: l.style.color,
                                          border: `1px solid ${l.style.border}`,
                                          borderRadius: 999,
                                          fontSize: 12
                                        }}>{l.name}</span>
                                      ))}
                                    </div>
                                  ) : '-';
                                })()}
                              </td>
                            </tr>
                            <tr className="card-row">
                              <th className="card-collabel">
                                <svg viewBox="0 0 24 24" className="label-icon" aria-hidden>
                                  <circle cx="12" cy="12" r="8" fill="currentColor" />
                                </svg>
                                <span className="label-text">영문이름</span>
                              </th>
                              <td className="card-colvalue">{u.englishName || '-'}</td>
                            </tr>
                            <tr className="card-row">
                              <th className="card-collabel">
                                <svg viewBox="0 0 24 24" className="label-icon" aria-hidden>
                                  <circle cx="12" cy="12" r="8" fill="currentColor" />
                                </svg>
                                <span className="label-text">예약일</span>
                              </th>
                              <td className="card-colvalue">{u.date instanceof Date ? 
                                `${u.date.getFullYear()}년 ${u.date.getMonth() + 1}월 ${u.date.getDate()}일` : 
                                '예약일 정보 없음'}</td>
                            </tr>
                            <tr className="card-row">
                              <th className="card-collabel">
                                <svg viewBox="0 0 24 24" className="label-icon" aria-hidden>
                                  <circle cx="12" cy="12" r="8" fill="currentColor" />
                                </svg>
                                <span className="label-text">이메일</span>
                              </th>
                              <td className="card-colvalue">{u.email || '-'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 팝업 모달 */}
      {showPopup && selectedUser && (
        <div className="popup-overlay" onClick={handleClosePopup}>
          <div className="popup-content large-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <div className="popup-tabs">
                <button 
                  className={`popup-tab ${popupView === 'basic' ? 'active' : ''}`}
                  onClick={() => setPopupView('basic')}
                >
                  기본 정보
                </button>
                <button 
                  className={`popup-tab ${popupView === 'full' ? 'active' : ''}`}
                  onClick={handleFullSearch}
                >
                  전체 조회
                </button>
              </div>
              <button className="popup-close-btn" onClick={handleClosePopup}>×</button>
            </div>
            <div className="popup-body">
              {popupView === 'basic' ? (
                <div className="popup-basic-info">
                  <h4>{selectedUser.name}님의 기본 정보</h4>
                  <table className="card-table">
                    <tbody>
                      <tr className="card-row">
                        <th className="card-collabel">
                          <svg viewBox="0 0 24 24" className="label-icon" aria-hidden>
                            <circle cx="12" cy="12" r="8" fill="currentColor" />
                          </svg>
                          <span className="label-text">이름</span>
                        </th>
                        <td className="card-colvalue">{selectedUser.name}</td>
                      </tr>
                      <tr className="card-row">
                        <th className="card-collabel">
                          <svg viewBox="0 0 24 24" className="label-icon" aria-hidden>
                            <circle cx="12" cy="12" r="8" fill="currentColor" />
                          </svg>
                          <span className="label-text">영문이름</span>
                        </th>
                        <td className="card-colvalue">{selectedUser.englishName || '-'}</td>
                      </tr>
                      <tr className="card-row">
                        <th className="card-collabel">
                          <svg viewBox="0 0 24 24" className="label-icon" aria-hidden>
                            <circle cx="12" cy="12" r="8" fill="currentColor" />
                          </svg>
                          <span className="label-text">이메일</span>
                        </th>
                        <td className="card-colvalue">{selectedUser.email || '-'}</td>
                      </tr>
                      <tr className="card-row">
                        <th className="card-collabel">
                          <svg viewBox="0 0 24 24" className="label-icon" aria-hidden>
                            <circle cx="12" cy="12" r="8" fill="currentColor" />
                          </svg>
                          <span className="label-text">주문 ID</span>
                        </th>
                        <td className="card-colvalue">{selectedUser.orderId || '-'}</td>
                      </tr>
                      <tr className="card-row">
                        <th className="card-collabel">
                          <svg viewBox="0 0 24 24" className="label-icon" aria-hidden>
                            <circle cx="12" cy="12" r="8" fill="currentColor" />
                          </svg>
                          <span className="label-text">예약일</span>
                        </th>
                        <td className="card-colvalue">{selectedUser.date instanceof Date ? 
                          `${selectedUser.date.getFullYear()}년 ${selectedUser.date.getMonth() + 1}월 ${selectedUser.date.getDate()}일` : 
                          '예약일 정보 없음'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="popup-full-search">
                  <h4>{selectedUser.name}님의 전체 예약 내역</h4>
                  
                  {/* 사용자 정보 섹션 */}
                  <div className="popup-user-info">
                    <h5>사용자 정보</h5>
                    {SH_M_loading ? (
                      <div className="no-data">사용자 정보를 불러오는 중입니다...</div>
                    ) : SH_M_error ? (
                      <div className="no-data">사용자 정보를 불러오는데 실패했습니다: {SH_M_error}</div>
                    ) : popupMemberInfo ? (
                      <table className="card-table">
                        <tbody>
                          {Object.entries(popupMemberInfo)
                            .filter(([k, v]) => v !== '' && v !== null && v !== undefined && !['matchedCount'].includes([0]) && !['만든사람', '만든일시'].includes(k))
                            .map(([k, v]) => (
                              <tr key={k} className="card-row">
                                <th className="card-collabel">
                                  <svg viewBox="0 0 24 24" className="label-icon" aria-hidden>
                                    <circle cx="12" cy="12" r="8" fill="currentColor" />
                                  </svg>
                                  <span className="label-text">{k}</span>
                                </th>
                                <td className="card-colvalue"><span title={v}>{v}</span></td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="no-data">사용자 정보를 찾을 수 없습니다.</div>
                    )}
                  </div>

                  {/* 예약 내역 섹션 */}
                  <div className="popup-bookings">
                    <h5>예약 내역</h5>
                    {SH_M_loading ? (
                      <div className="no-data">데이터를 불러오는 중입니다...</div>
                    ) : SH_M_error ? (
                      <div className="no-data">데이터를 불러오는데 실패했습니다: {SH_M_error}</div>
                    ) : popupResultsByService.length === 0 ? (
                      <div className="no-data">조회된 예약 내역이 없습니다.</div>
                    ) : (
                      popupResultsByService.map((group, gidx) => (
                        <div key={gidx} className="popup-service-group">
                          <h6>
                            {group.service.name}
                            {group.isDateGrouped && group.dateGroup && (
                              <span style={{ fontSize: '0.9em', fontWeight: 'normal', marginLeft: '8px' }}>
                                - {group.dateGroup}
                              </span>
                            )}
                          </h6>
                          <div className="popup-service-cards">
                            {group.rows.map((row, idx) => {
                              const headers = group.headers;
                              const fields = pickAllFields(headers, row);
                              return (
                                <div key={idx} className="popup-data-card">
                                  <div className="card-header">
                                    <h4>
                                      {group.service.name} 예약
                                      {group.isDateGrouped ? ` #${idx + 1}` : ''}
                                    </h4>
                                  </div>
                                  <div className="card-content">
                                    <table className="card-table">
                                      <tbody>
                                        {fields
                                          .filter(({ label }) => !['만든사람', '만들일시', '환율', '미환율', '수정자', '수정일시', '단위', '금액', '합계'].includes(label))
                                          .map(({ label, value }, i) => (
                                          <tr key={i} className="card-row">
                                            <th className="card-collabel">
                                              <svg viewBox="0 0 24 24" className="label-icon" aria-hidden>
                                                <circle cx="12" cy="12" r="8" fill="currentColor" />
                                              </svg>
                                              <span className="label-text">{label}</span>
                                            </th>
                                            <td className="card-colvalue">
                                              <span title={String(value)}>{String(value)}</span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="popup-footer">
              <button className="cancel-btn" onClick={handleClosePopup}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

