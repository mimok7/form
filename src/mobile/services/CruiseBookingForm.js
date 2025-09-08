  import React, { useState, useEffect } from 'react';
  import { buildRowFromHeaders } from '../../utils/rowBuilder';
  import { parseToIso } from '../../utils/dateUtils';


// 크루즈 예약 컬럼 정보 및 설정 (직접 코드에 저장)
const CRUISE_COLUMNS = [
  { key: 'ID', label: 'ID', type: 'text', required: false },
  { key: '주문ID', label: '주문ID', type: 'text', required: false },
  { key: '체크인', label: '체크인 날짜를 선택하세요.', type: 'date', required: false },
  { key: '일정', label: '일정를 선택하세요.', type: 'select', required: false },
  { key: '크루즈', label: '크루즈를 선택하세요.', type: 'text', required: false },
  { key: '객실종류', label: '객실을 선택하세요.', type: 'text', required: false },
  { key: '구분', label: '구분', type: 'text', required: false },
  { key: '객실비고', label: '결제 방식을 선택하세요. ', type: 'text', required: false },
  // ... 기존 컬럼 ...
  { key: '객실코드', label: '객실코드', type: 'text', required: false },
  { key: '금액', label: '금액', type: 'number', required: false },
  { key: 'ADULT', label: '성인수를 입력하세요.', type: 'number', required: false },
  { key: 'CHILD', label: '아동수를 입력하세요.', type: 'number', required: false },
  { key: 'TODDLER', label: '유아수를 입력하세요.', type: 'number', required: false },
  { key: 'EXTRA', label: '엑스트라수를 입력하세요.', type: 'number', required: false },
  { key: '승선인원', label: '승선인원(자동 계산)', type: 'number', required: false },
  { key: '인원수', label: '인원수(자동 계산)', type: 'number', required: false },
  { key: '객실수', label: '전체 객실수를 선택하세요.', type: 'number', required: false },
  { key: '승선도움', label: '승선도움을 원하시나요.', type: 'boolean', required: false },

  { key: '커넥팅룸', label: '커넥팅 룸 신청 여부를 선택하세요.', type: 'boolean', required: false },
    { key: 'Email', label: 'Email', type: 'email', required: false },
];



function CruiseBookingForm({ formData, setFormData, headers = [], onServiceSubmitted }) {
  // local derived flags to simplify effect dependencies
  const hasRemark = Boolean(formData && formData['객실비고']);
  const hasEmail = Boolean(formData && formData['Email']);
  // 결제방식 캐시(localStorage)에서 자동 입력
  useEffect(() => {
    const cachedPayment = window.localStorage.getItem('payment_method') || '';
    if (cachedPayment && !hasRemark) {
      setFormData(prev => ({ ...prev, 객실비고: cachedPayment }));
    }
  }, [setFormData, hasRemark]);
  // 사용자 정보 페이지의 이메일을 자동으로 입력
  useEffect(() => {
    const userEmail = window.localStorage.getItem('user_email') || '';
    if (userEmail && !hasEmail) {
      setFormData(prev => ({ ...prev, Email: userEmail }));
    }
  }, [setFormData, hasEmail]);
  // 성인, 아동, 유아 값 변경 시 승선인원 자동입력 (deps 단순화)
  const adult = Number(formData['ADULT']) || 0;
  const child = Number(formData['CHILD']) || 0;
  const toddler = Number(formData['TODDLER']) || 0;
  useEffect(() => {
    // EXTRA는 승선인원 계산에서 제외
    const totalBoarding = adult + child + toddler;
    // 인원수 자동 계산 제거: 인원수는 사용자가 직접 입력하도록 비워둠
    setFormData(prev => ({ ...prev, 승선인원: totalBoarding }));
  }, [adult, child, toddler, setFormData]);
  // 객실코드와 금액을 6가지 조건으로 동시에 자동입력
  // slice common keys to simplify deps
  const 체크인 = formData && formData['체크인'];
  const 일정 = formData && formData['일정'];
  const 크루즈 = formData && formData['크루즈'];
  const 객실종류 = formData && formData['객실종류'];
  const 구분 = formData && formData['구분'];
  const 객실비고 = formData && formData['객실비고'];

  useEffect(() => {
    async function fetchCodeAndAmount() {
      if (!체크인 || !일정 || !크루즈 || !객실종류 || !구분 || !객실비고) {
        setFormData(prev => ({ ...prev, 객실코드: '', 금액: '' }));
        return;
      }
      try {
  const SHEET_ID = process.env.REACT_APP_SHEET_ID;
  const API_KEY = process.env.REACT_APP_API_KEY;
  const useProxy = (process.env.REACT_APP_USE_PROXY === 'true') || (typeof window !== 'undefined' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(window.location.origin));
  const readUrl = useProxy ? `/api/append?sheet=room` : `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/room?key=${API_KEY}`;
  const res = await fetch(readUrl);
        const data = await res.json();
        const rows = data.values || [];
        if (rows.length < 2) {
          setFormData(prev => ({ ...prev, 객실코드: '', 금액: '' }));
          return;
        }
  const header = rows[0].map(h => (h || '').toString().trim());
  const headerLower = header.map(h => h.toLowerCase());
  const findIndexCI = (targets) => headerLower.findIndex(h => targets.some(t => h === t));
  const idxStartDate = findIndexCI(['시작일자', 'startdate', 'start']);
  const idxEndDate = findIndexCI(['끝일자', 'enddate', 'end']);
  const idxSchedule = findIndexCI(['일정', 'schedule']);
  const idxCruise = findIndexCI(['크루즈', '크루즈명', 'cruise']);
  const idxRoomType = findIndexCI(['종류', 'type']);
  const idxGubun = findIndexCI(['구분', 'gubun']);
  const idxRemark = findIndexCI(['객실비고', '비고', 'remark']);
  const idxCode = findIndexCI(['코드', 'code']);
  const idxAmount = findIndexCI(['금액', 'amount']);
        if ([idxStartDate, idxEndDate, idxSchedule, idxCruise, idxRoomType, idxGubun, idxRemark, idxCode, idxAmount].includes(-1)) {
          setFormData(prev => ({ ...prev, 객실코드: '', 금액: '' }));
          return;
        }
        // 6가지 조건 모두 일치하는 row 찾기
  const found = rows.slice(1).find(row => {
          const start = row[idxStartDate];
          const end = row[idxEndDate];
          return (
            start && end && start <= 체크인 && 체크인 <= end &&
            row[idxSchedule] === 일정 &&
            row[idxCruise] === 크루즈 &&
            row[idxRoomType] === 객실종류 &&
            row[idxGubun] === 구분 &&
            row[idxRemark] === 객실비고
          );
        });
        if (found) {
          setFormData(prev => ({
            ...prev,
            객실코드: found[idxCode],
            금액: found[idxAmount]
          }));
        } else {
          setFormData(prev => ({ ...prev, 객실코드: '', 금액: '' }));
        }
      } catch (e) {
        setFormData(prev => ({ ...prev, 객실코드: '', 금액: '' }));
      }
    }
    fetchCodeAndAmount();
  }, [체크인, 일정, 크루즈, 객실종류, 구분, 객실비고, setFormData]);
  const [loading, setLoading] = useState(false);
  const [gubunOptions, setGubunOptions] = useState([]);
  const [cruiseOptions, setCruiseOptions] = useState([]);
  const [roomTypeOptions, setRoomTypeOptions] = useState([]);
  // navigate not used in this component

  // ID 자동생성, 주문ID 자동입력 (최초 렌더링 시)
  useEffect(() => {
    async function generateUniqueId() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let id = '';
      let tries = 0;
      // room 시트의 기존 ID 목록 fetch
      let existingIds = [];
      try {
        const SHEET_ID = process.env.REACT_APP_SHEET_ID;
        const API_KEY = process.env.REACT_APP_API_KEY;
  const useProxy = (process.env.REACT_APP_USE_PROXY === 'true') || (typeof window !== 'undefined' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(window.location.origin));
  const readUrl = useProxy ? `/api/append?sheet=room&range=A:A` : `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/room!A:A?key=${API_KEY}`;
  const res = await fetch(readUrl);
        const data = await res.json();
        existingIds = (data.values || []).slice(1).map(row => row[0]);
      } catch (e) {
        existingIds = [];
      }
      do {
        id = '';
        for (let i = 0; i < 8; i++) {
          id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        tries++;
        if (tries > 100) break;
      } while (existingIds.includes(id));
      return id;
    }
    // 주문ID: localStorage에 있으면 우선 사용, 없으면 기존 값 사용
    (async () => {
      const uniqueId = await generateUniqueId();
      const cachedOrderId = window.localStorage.getItem('reservation_orderId') || '';
      setFormData(prev => ({
        ...prev,
        ID: prev.ID || uniqueId,
        주문ID: cachedOrderId || prev.주문ID || prev.orderId || '',
      }));
    })();
  }, [setFormData]);

  // 체크인 옵션 개별 로드는 제거(미사용)

  // room 시트에서 크루즈/구분/객실종류 옵션 동적 로드 (체크인·일정·크루즈 기준 필터)
  const selCheckin = formData && formData['체크인'];
  const selSchedule = formData && formData['일정'];
  const selCruise = formData && formData['크루즈'];
  useEffect(() => {
    async function fetchCruiseOptions() {
      try {
        const SHEET_ID = process.env.REACT_APP_SHEET_ID;
        const API_KEY = process.env.REACT_APP_API_KEY;
  const useProxy = (process.env.REACT_APP_USE_PROXY === 'true') || (typeof window !== 'undefined' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(window.location.origin));
        const readUrl = useProxy ? `/api/append?sheet=room` : `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/room?key=${API_KEY}`;
        const res = await fetch(readUrl);
        const data = await res.json();
        const rows = data.values || [];
        if (rows.length < 2) {
          setCruiseOptions([]);
          return;
        }
  const header = rows[0].map(h => (h || '').toString().trim());
        const headerLower = header.map(h => h.toLowerCase());
        const findIndexCI = targets => headerLower.findIndex(h => targets.some(t => h === t));
        const idxCruise = findIndexCI(['크루즈', '크루즈명', 'cruise']);
        const idxSchedule = findIndexCI(['일정', 'schedule']);
        const idxStartDate = findIndexCI(['시작일자', 'startdate', 'start']);
        const idxEndDate = findIndexCI(['끝일자', 'enddate', 'end']);
        if (idxCruise === -1) {
          setCruiseOptions([]);
          return;
        }
  // 일정, 체크인(시작~끝)으로 필터
  const filtered = rows.slice(1).filter(row => {
          // 일정 필터
          if (idxSchedule !== -1 && selSchedule) {
            const v = (row[idxSchedule] || '').toString().trim();
            if (v !== (selSchedule || '').toString().trim()) return false;
          }
          // 체크인 날짜가 주어졌으면 시작일자~끝일자 사이인지 확인 (날짜 파싱 유틸 사용)
          if (selCheckin && idxStartDate !== -1 && idxEndDate !== -1) {
            const startRaw = row[idxStartDate];
            const endRaw = row[idxEndDate];
            const startIso = parseToIso(startRaw);
            const endIso = parseToIso(endRaw);
            const checkinIso = parseToIso(selCheckin);
            if (!(startIso && endIso && checkinIso && startIso <= checkinIso && checkinIso <= endIso)) return false;
          }
          return true;
        });
        const cruiseRaw = filtered.map(row => row[idxCruise]).filter(v => v);
        setCruiseOptions(Array.from(new Set(cruiseRaw.map(v => (v||'').toString().trim()))).sort());
        // 추가: 선택된 일정 + 크루즈 조건일 때만 구분/객실종류/비고 옵션을 채움 (조건이 없으면 빈 리스트)
  const idxGubun = findIndexCI(['구분','gubun']);
  const idxRoomType = findIndexCI(['종류','type']);
        // 필터 기준: filtered(이미 일정 및 체크인 기준은 적용됨)에서 크루즈까지 일치하는 항목만 사용
        const rowsForOthers = filtered.filter(r => {
          if (idxCruise !== -1 && selCruise) {
            const val = ('' + (r[idxCruise] || '')).toString().trim();
            const wanted = (selCruise || '').toString().trim();
            return val === wanted;
          }
          return false;
        });
        if (selSchedule && selCruise) {
          if (idxGubun !== -1) setGubunOptions(Array.from(new Set(rowsForOthers.map(r => (r[idxGubun]||'').toString().trim()).filter(Boolean))));
          if (idxRoomType !== -1) setRoomTypeOptions(Array.from(new Set(rowsForOthers.map(r => (r[idxRoomType]||'').toString().trim()).filter(Boolean))));
        } else {
          // 일정 또는 크루즈 선택이 없으면 관련 옵션을 비워 노출을 막음
          setGubunOptions([]);
          setRoomTypeOptions([]);
        }
      } catch (e) {
        setCruiseOptions([]);
      }
    }
    fetchCruiseOptions();
  }, [selCheckin, selSchedule, selCruise]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 크루즈 선택 시 캐시에 저장
    if (field === '크루즈') {
      window.localStorage.setItem('cruise_value', value);
    }
    // 일정 선택 시 캐시에 저장
    if (field === '일정') {
      window.localStorage.setItem('schedule_value', value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 승선도움, 커넥팅룸 저장 시 true/false로 변환
      const normalized = { ...formData };
      normalized['승선도움'] = normalized['승선도움'] === '예' ? true : false;
      normalized['커넥팅룸'] = normalized['커넥팅룸'] === '예' ? true : false;
      // 실제 시트 헤더 순서에 맞춰 row 생성용 매핑
  const fieldMap = {
        '주문ID': '주문ID',
        '체크인': '체크인',
        '일정': '일정',
        '일정일수': '일정',
        '크루즈': '크루즈',
        '객실종류': '객실종류',
        '구분': '구분',
        '객실비고': '객실비고',
        '객실코드': '객실코드',
        '금액': '금액',
        'ADULT': 'ADULT',
        'CHILD': 'CHILD',
        'TODDLER': 'TODDLER',
        'EXTRA': 'EXTRA',
        '승선인원': '승선인원',
        '인원수': '인원수',
        '객실수': '객실수',
        '승선도움': '승선도움',
        '커넥팅룸': '커넥팅룸',
        'Email': 'Email',
      };
      // 분할 저장 로직: 성인/아동/엑스트라 인원에 따라 생성
      const adultCount = Number(normalized['ADULT']) || 0;
      const childCount = Number(normalized['CHILD']) || 0;
      const extraCount = Number(normalized['EXTRA']) || 0;  // 저장 시에는 'ID' 컬럼을 제외하고 전송
  const baseHeaders = headers.length ? headers : CRUISE_COLUMNS.map(h => h.key);
  const headersForBuild = baseHeaders.filter(h => h !== 'ID');

      // 다중 객실종류 처리: 기본 객실종류 + 추가 선택 목록
      const 기본객실수 = Number(normalized['기본객실수']) || 1;
      const 추가객실목록 = Array.isArray(normalized['추가객실목록']) ? normalized['추가객실목록'] : [];
      
      // 전체 객실 목록 생성 (기본 + 추가)
      const allRooms = [];
      if (normalized['객실종류']) {
        for (let i = 0; i < 기본객실수; i++) {
          allRooms.push({ 객실종류: normalized['객실종류'], 객실번호: i + 1 });
        }
      }
      추가객실목록.forEach(extra => {
        for (let i = 0; i < extra.객실수; i++) {
          allRooms.push({ 객실종류: extra.객실종류, 객실번호: i + 1 });
        }
      });
      
      if (allRooms.length === 0) throw new Error('객실을 선택하세요.');

      // 인원 균등분배 로직
      const distributePersons = (totalCount, roomCount) => {
        const baseCount = Math.floor(totalCount / roomCount);
        const remainder = totalCount % roomCount;
        const result = [];
        for (let i = 0; i < roomCount; i++) {
          result.push(baseCount + (i < remainder ? 1 : 0));
        }
        return result;
      };

      const adultDistribution = distributePersons(adultCount, allRooms.length);
      const childDistribution = distributePersons(childCount, allRooms.length);
      const extraDistribution = distributePersons(extraCount, allRooms.length);

      // room 시트 데이터 로드(객실코드/금액 계산 용)
      const SHEET_ID = process.env.REACT_APP_SHEET_ID;
      const API_KEY = process.env.REACT_APP_API_KEY;
      const useProxyForRead = (process.env.REACT_APP_USE_PROXY === 'true') || (typeof window !== 'undefined' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(window.location.origin));
      const readUrlForRoom = useProxyForRead ? `/api/append?sheet=room` : `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/room?key=${API_KEY}`;
      let roomRows = [];
      let header = [];
      let headerLower = [];
      let idxStartDate = -1, idxEndDate = -1, idxSchedule = -1, idxCruise = -1, idxRoomType = -1, idxGubun = -1, idxRemark = -1, idxCode = -1, idxAmount = -1;
      try {
        const resRoom = await fetch(readUrlForRoom);
        const dataRoom = await resRoom.json();
        roomRows = dataRoom.values || [];
        if (roomRows.length >= 1) {
          header = roomRows[0].map(h => (h || '').toString().trim());
          headerLower = header.map(h => h.toLowerCase());
          const findIndexCI = (targets) => headerLower.findIndex(h => targets.some(t => h === t));
          idxStartDate = findIndexCI(['시작일자','startdate','start']);
          idxEndDate = findIndexCI(['끝일자','enddate','end']);
          idxSchedule = findIndexCI(['일정','schedule']);
          idxCruise = findIndexCI(['크루즈','크루즈명','cruise']);
          idxRoomType = findIndexCI(['종류','type']);
          idxGubun = findIndexCI(['구분','gubun']);
          idxRemark = findIndexCI(['객실비고','비고','remark']);
          idxCode = findIndexCI(['코드','code']);
          idxAmount = findIndexCI(['금액','amount']);
        }
      } catch (e) {
        // roomRows 비워둠 → 코드/금액 없이 저장
        roomRows = [];
      }

      const findCodeAmount = (roomType, gubun) => {
        if (!roomRows.length || [idxStartDate, idxEndDate, idxSchedule, idxCruise, idxRoomType, idxGubun, idxRemark, idxCode, idxAmount].some(i => i === -1)) {
          return { code: '', amount: '' };
        }
  const { 일정, 크루즈, 객실비고 } = normalized;
        const match = roomRows.slice(1).find(row => {
          const start = row[idxStartDate];
          const end = row[idxEndDate];
          const checkin = normalized['체크인'];
          return (
            start && end && start <= checkin && checkin <= end &&
            row[idxSchedule] === 일정 &&
            row[idxCruise] === 크루즈 &&
            row[idxRoomType] === roomType &&
            row[idxGubun] === gubun &&
            row[idxRemark] === 객실비고
          );
        });
        return match ? { code: match[idxCode], amount: match[idxAmount] } : { code: '', amount: '' };
      };

      const makeRowData = (gubun, count, roomType, roomIndex) => {
        // 구분별로 해당 인원 컬럼만 채우고 나머지는 비움
        const perRow = { ...normalized, 구분: gubun, 인원수: count, 객실종류: roomType };
        // ID 컬럼은 빈값으로 처리
        perRow['ID'] = '';
        if (gubun === '성인') {
          perRow['ADULT'] = count;
          perRow['CHILD'] = '';
          perRow['TODDLER'] = '';
          perRow['EXTRA'] = '';
        } else if (gubun === '아동') {
          perRow['CHILD'] = count;
          perRow['ADULT'] = '';
          perRow['TODDLER'] = '';
          perRow['EXTRA'] = '';
        } else if (gubun === '엑스트라') {
          perRow['EXTRA'] = count;
          perRow['ADULT'] = '';
          perRow['CHILD'] = '';
          perRow['TODDLER'] = '';
        }
        // 객실코드/금액 계산
  const { code, amount } = findCodeAmount(roomType, gubun);
        perRow['객실코드'] = code;
        perRow['금액'] = amount;
        return buildRowFromHeaders(headersForBuild, perRow, fieldMap);
      };

      const rowsToSave = [];
      allRooms.forEach((room, roomIndex) => {
        const adultCountForRoom = adultDistribution[roomIndex] || 0;
        const childCountForRoom = childDistribution[roomIndex] || 0;
        const extraCountForRoom = extraDistribution[roomIndex] || 0;
        
        if (adultCountForRoom > 0) {
          rowsToSave.push({ 
            label: `성인-${room.객실종류}-객실${room.객실번호}`, 
            data: makeRowData('성인', adultCountForRoom, room.객실종류, roomIndex) 
          });
        }
        if (childCountForRoom > 0) {
          rowsToSave.push({ 
            label: `아동-${room.객실종류}-객실${room.객실번호}`, 
            data: makeRowData('아동', childCountForRoom, room.객실종류, roomIndex) 
          });
        }
        if (extraCountForRoom > 0) {
          rowsToSave.push({ 
            label: `엑스트라-${room.객실종류}-객실${room.객실번호}`, 
            data: makeRowData('엑스트라', extraCountForRoom, room.객실종류, roomIndex) 
          });
        }
      });

      const appendUrl = process.env.REACT_APP_SHEET_APPEND_URL;
      const appendToken = process.env.REACT_APP_SHEET_APPEND_TOKEN;
  const useProxy = (process.env.REACT_APP_USE_PROXY === 'true') || (typeof window !== 'undefined' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(window.location.origin));
      const targetUrl = useProxy ? '/api/append' : appendUrl;
      if (!targetUrl) throw new Error('Append URL not configured. Set REACT_APP_SHEET_APPEND_URL in .env');
      // 분할된 각 행을 순차 저장
      let successCount = 0;
      for (const item of rowsToSave) {
        // buildRowFromHeaders returns an array aligned to headersForBuild (which excludes 'ID')
        // Ensure final row length equals baseHeaders.length (which includes 'ID') by prepending empty strings.
        const dataArray = Array.isArray(item.data) ? item.data : [item.data];
        const targetLen = Array.isArray(baseHeaders) ? baseHeaders.length : dataArray.length + 1;
        const paddingNeeded = Math.max(0, targetLen - dataArray.length);
        const rowWithEmptyId = Array(paddingNeeded).fill('').concat(dataArray);
        const payload = { service: 'cruise', row: rowWithEmptyId };
        if (!useProxy && appendToken) payload.token = appendToken;
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (!json || !json.success) {
          throw new Error(json && json.error ? json.error : 'Append failed');
        }
        successCount++;
      }

      alert(`크루즈 예약 정보가 저장되었습니다. (총 ${successCount}건)`);
  setFormData({});
  if (typeof onServiceSubmitted === 'function') onServiceSubmitted();
    } catch (err) {
      console.error('Save error:', err);
      alert('저장 중 오류가 발생했습니다: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // 계산: 현재 폼에서 선택된 전체 객실 수(기본 + 추가)
  const computeTotalRooms = () => {
    const 기본 = Number(formData['기본객실수']) || 0;
    const 추가 = Array.isArray(formData['추가객실목록']) ? formData['추가객실목록'].reduce((s, it) => s + (Number(it.객실수) || 0), 0) : 0;
    // 만약 기본 객실 수가 0이더라도 객실종류가 선택된 경우 기본 1로 간주
    const 기본대체 = 기본 > 0 ? 기본 : (formData['객실종류'] ? 1 : 0);
    return 기본대체 + 추가;
  };

  const totalRooms = computeTotalRooms();

  return (
    <div className="customer-info">
      <h2 className="step-title">크루즈 객실 정보</h2>
      {/* 상단 안내 문구 - 항상 표시 */}
      <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#e7f3ff', border: '1px solid #b6e0ff', borderRadius: '6px', color: '#084298', display: 'flex', alignItems: 'center', gap: '8px' }} role="status" aria-live="polite">
        <span aria-hidden style={{ fontSize: '18px' }}>ℹ️</span>
        <div>
          <div style={{ fontWeight: 600 }}>안내</div>
          <div style={{ fontSize: '13px' }}>각 목록의 선택값이 표시되지 않으면 조금만 기다려 주세요. 네트워크 속도에 따라 표시되는데 시간이 조금 더 걸릴 수 있습니다. ^^</div>
        </div>
      </div>
      <form className="sheet-columns-form" onSubmit={handleSubmit}>
  {CRUISE_COLUMNS.filter(col => col.key !== 'ID' && col.key !== '주문ID' && col.key !== '금액' && col.key !== '객실코드' && col.key !== '객실수' && col.key !== '구분' && col.key !== '인원수').map((col, idx) => (
          <React.Fragment key={idx}>
            <div className="form-group">
              <label htmlFor={`cruise_${col.key}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {(() => {
                  const iconMap = {
                    체크인: <span role="img" aria-label="calendar">📅</span>,
                    일정: <span role="img" aria-label="schedule">🗓️</span>,
                    크루즈: <span role="img" aria-label="ship">🚢</span>,
                    객실종류: <span role="img" aria-label="room">🏨</span>,
                    구분: <span role="img" aria-label="tag">🏷️</span>,
                    객실비고: <span role="img" aria-label="memo">📝</span>,
                    객실코드: <span role="img" aria-label="key">🔑</span>,
                    금액: <span role="img" aria-label="money">💰</span>,
                    ADULT: <span role="img" aria-label="adult">🧑</span>,
                    CHILD: <span role="img" aria-label="child">🧒</span>,
                    TODDLER: <span role="img" aria-label="baby">👶</span>,
                    EXTRA: <span role="img" aria-label="extra">👤</span>,
                    승선인원: <span role="img" aria-label="group">👥</span>,
                    인원수: <span role="img" aria-label="group">👥</span>,
                    객실수: <span role="img" aria-label="room">🏨</span>,
                    승선도움: <span role="img" aria-label="help">🦮</span>,
                    커넥팅룸: <span role="img" aria-label="connect">🔗</span>,
                    Email: <span role="img" aria-label="email">✉️</span>
                  };
                  return iconMap[col.key];
                })()}
                {col.label}
              </label>
              {/* ...existing code for input rendering... */}
              {col.key === '체크인' ? (
                <input
                  type="date"
                  id={`cruise_체크인`}
                  value={formData['체크인'] || ''}
                  onChange={e => handleInputChange('체크인', e.target.value)}
                  required={col.required}
                />
              ) : col.key === '일정' ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {["1박2일", "2박3일", "당일"].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      style={{
                        backgroundColor: formData['일정'] === opt ? '#28a745' : '#f0f0f0',
                        color: formData['일정'] === opt ? '#fff' : '#333',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleInputChange('일정', opt)}
                    >{opt}</button>
                  ))}
                </div>
              ) : col.key === '객실수' ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1,2,3,4,5,6,7].map(num => (
                    <button
                      key={num}
                      type="button"
                      style={{
                        backgroundColor: String(formData['객실수']) === String(num) ? '#007bff' : '#f0f0f0',
                        color: String(formData['객실수']) === String(num) ? '#fff' : '#333',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleInputChange('객실수', num)}
                    >{num}</button>
                  ))}
                </div>
              ) : col.key === '승선도움' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    style={{
                      backgroundColor: formData['승선도움'] === '아니오' || formData['승선도움'] === undefined ? '#007bff' : '#f0f0f0',
                      color: formData['승선도움'] === '아니오' || formData['승선도움'] === undefined ? '#fff' : '#333',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '6px 16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleInputChange('승선도움', '아니오')}
                  >아니오</button>
                  <button
                    type="button"
                    style={{
                      backgroundColor: formData['승선도움'] === '예' ? '#007bff' : '#f0f0f0',
                      color: formData['승선도움'] === '예' ? '#fff' : '#333',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '6px 16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleInputChange('승선도움', '예')}
                  >예</button>
                </div>
              ) : col.key === '커넥팅룸' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    style={{
                      backgroundColor: formData['커넥팅룸'] === '아니오' || formData['커넥팅룸'] === undefined ? '#007bff' : '#f0f0f0',
                      color: formData['커넥팅룸'] === '아니오' || formData['커넥팅룸'] === undefined ? '#fff' : '#333',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '6px 16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleInputChange('커넥팅룸', '아니오')}
                  >아니오</button>
                  <button
                    type="button"
                    style={{
                      backgroundColor: formData['커넥팅룸'] === '예' ? '#007bff' : '#f0f0f0',
                      color: formData['커넥팅룸'] === '예' ? '#fff' : '#333',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '6px 16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleInputChange('커넥팅룸', '예')}
                  >예</button>
                </div>
              ) : col.key === '구분' ? (
                <select
                  id={`cruise_구분`}
                  value={formData['구분'] || ''}
                  onChange={e => handleInputChange('구분', e.target.value)}
                  required={col.required}
                  disabled={gubunOptions.length === 0}
                >
                  <option value="">구분 선택</option>
                  {gubunOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : col.key === '크루즈' ? (
                <select
                  id={`cruise_크루즈`}
                  value={formData['크루즈'] || ''}
                  onChange={e => handleInputChange('크루즈', e.target.value)}
                  required={col.required}
                  disabled={cruiseOptions.length === 0}
                >
                  <option value="">크루즈 선택</option>
                  {cruiseOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : col.key === '객실종류' ? (
                <div>
                  <select
                    id={`cruise_객실종류`}
                    value={formData['객실종류'] || ''}
                    onChange={e => handleInputChange('객실종류', e.target.value)}
                    required={col.required}
                    disabled={roomTypeOptions.length === 0}
                  >
                    <option value="">객실종류 선택</option>
                    {roomTypeOptions.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                  
                  {/* 기본 객실의 객실수 */}
                  {formData['객실종류'] && (
                    <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#f8f9fa' }}>
                      <div style={{ fontWeight: 600, marginBottom: '6px' }}>{formData['객실종류']} - 객실수</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const current = Number(formData['기본객실수']) || 1;
                            if (current > 1) handleInputChange('기본객실수', current - 1);
                          }}
                          style={{ padding: '4px 8px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                        >◀</button>
                        <input
                          type="number"
                          value={formData['기본객실수'] || 1}
                          onChange={(e) => {
                            const val = Math.max(1, Math.min(10, Number(e.target.value) || 1));
                            handleInputChange('기본객실수', val);
                          }}
                          style={{ width: '60px', textAlign: 'center', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                          min="1"
                          max="20"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const current = Number(formData['기본객실수']) || 1;
                            if (current < 10) handleInputChange('기본객실수', current + 1);
                          }}
                          style={{ padding: '4px 8px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                        >▶</button>
                      </div>
                    </div>
                  )}

                  {/* 추가 객실 드롭다운 + 객실수 */}
                  {roomTypeOptions.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ marginBottom: '8px', fontWeight: 600 }}>추가 객실 (선택사항)</div>
                      
                      {/* 추가된 객실 목록 */}
                      {Array.isArray(formData['추가객실목록']) && formData['추가객실목록'].map((item, idx) => (
                        <div key={item.id || idx} style={{ marginBottom: '8px', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#f8f9fa' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600 }}>{item.객실종류}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentExtra = Array.isArray(formData['추가객실목록']) ? formData['추가객실목록'] : [];
                                const filtered = currentExtra.filter((_, i) => i !== idx);
                                handleInputChange('추가객실목록', filtered);
                              }}
                              style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
                            >삭제</button>
                          </div>
                          <div>
                            <span style={{ marginRight: '8px' }}>객실수:</span>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentExtra = Array.isArray(formData['추가객실목록']) ? formData['추가객실목록'] : [];
                                  const updated = currentExtra.map((entry, i) => 
                                    i === idx ? { ...entry, 객실수: Math.max(1, entry.객실수 - 1) } : entry
                                  );
                                  handleInputChange('추가객실목록', updated);
                                }}
                                style={{ padding: '2px 6px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}
                              >◀</button>
                              <input
                                type="number"
                                value={item.객실수}
                                onChange={(e) => {
                                  const val = Math.max(1, Math.min(10, Number(e.target.value) || 1));
                                  const currentExtra = Array.isArray(formData['추가객실목록']) ? formData['추가객실목록'] : [];
                                  const updated = currentExtra.map((entry, i) => 
                                    i === idx ? { ...entry, 객실수: val } : entry
                                  );
                                  handleInputChange('추가객실목록', updated);
                                }}
                                style={{ width: '40px', textAlign: 'center', padding: '2px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '11px' }}
                                min="1"
                                max="20"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const currentExtra = Array.isArray(formData['추가객실목록']) ? formData['추가객실목록'] : [];
                                  const updated = currentExtra.map((entry, i) => 
                                    i === idx ? { ...entry, 객실수: Math.min(10, entry.객실수 + 1) } : entry
                                  );
                                  handleInputChange('추가객실목록', updated);
                                }}
                                style={{ padding: '2px 6px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}
                              >▶</button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* 새로운 추가 객실 입력 필드 (항상 하나 표시) */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              const currentExtra = Array.isArray(formData['추가객실목록']) ? formData['추가객실목록'] : [];
                              const newEntry = { 객실종류: e.target.value, 객실수: 1, id: Date.now() };
                              handleInputChange('추가객실목록', [...currentExtra, newEntry]);
                              e.target.value = "";
                            }
                          }}
                          style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                        >
                          <option value="">추가할 객실종류 선택</option>
                          {roomTypeOptions.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ) : col.key === '객실비고' ? (
                <input
                  type="text"
                  id={`cruise_객실비고`}
                  value={formData['객실비고'] || ''}
                  onChange={e => handleInputChange('객실비고', e.target.value)}
                  placeholder={col.label}
                  required={col.required}
                  readOnly={true}
                />
              ) : col.key === '객실코드' ? (
                <input
                  type={col.type}
                  id={`cruise_객실코드`}
                  value={formData['객실코드'] || ''}
                  readOnly
                  placeholder={col.label}
                  required={col.required}
                />
              ) : col.key === '금액' ? (
                <input
                  type={col.type}
                  id={`cruise_금액`}
                  value={formData['금액'] !== undefined ? formData['금액'] : ''}
                  readOnly
                  placeholder={col.label}
                  required={col.required}
                  style={{ backgroundColor: '#f8f9fa', color: '#333', fontWeight: 'bold' }}
                />
              ) : (["ADULT", "CHILD", "TODDLER", "EXTRA"].includes(col.key) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const current = Number(formData[col.key]) || 0;
                      if (current > 0) handleInputChange(col.key, current - 1);
                    }}
                    style={{ padding: '6px 12px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                  >◀</button>
                  <input
                    type="number"
                    value={formData[col.key] || 0}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(20, Number(e.target.value) || 0));
                      handleInputChange(col.key, val);
                    }}
                    style={{ width: '80px', textAlign: 'center', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                    min="0"
                    max="20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const current = Number(formData[col.key]) || 0;
                      if (current < 20) handleInputChange(col.key, current + 1);
                    }}
                    style={{ padding: '6px 12px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                  >▶</button>
                </div>
              ) : (
                <input
                  type={col.type}
                  id={`cruise_${col.key}`}
                  value={col.key === 'Email' ? (formData['Email'] || '') : (formData[col.key] || '')}
                  onChange={e => handleInputChange(col.key, e.target.value)}
                  placeholder={col.label}
                  required={col.required}
                  readOnly={col.key === 'Email'}
                />
              ))}
            </div>
            {/* 금액 합계 표시 완전 삭제 */}
          </React.Fragment>
        ))}
        {totalRooms > 1 && (
          <div style={{ marginBottom: '8px', padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '6px', color: '#856404', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span aria-hidden style={{ fontSize: '18px' }}>⏳</span>
            <div>
              <div style={{ fontWeight: 600 }}>잠시만 기다려 주세요.</div>
              <div style={{ fontSize: '13px' }}>안내 아이콘이 바로 보이지 않을 수 있습니다. 네트워크 상황에 따라 시간이 걸릴 수 있어요. ^^</div>
            </div>
          </div>
        )}

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

export default CruiseBookingForm;
