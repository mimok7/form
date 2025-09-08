import React, { useState, useEffect } from 'react';
import FormLabel from './FormLabel';
import { buildRowFromHeaders } from '../../utils/rowBuilder';
import { parseToIso, parseToDate } from '../../utils/dateUtils';

const SHEET_ID = process.env.REACT_APP_SHEET_ID;
const API_KEY = process.env.REACT_APP_API_KEY;

const FIXED_HEADERS = [
  { key: 'ID', label: 'ID', type: 'text', required: false },
  { key: '주문ID', label: '주문ID', type: 'text', required: true },
  { key: '호텔코드', label: '호텔코드', type: 'text', required: false },
  { key: '호텔명', label: '호텔명을 선택하세요.', type: 'text', required: false },
  { key: '객실명', label: '객실명을 선택하세요.', type: 'text', required: false },
  { key: '객실종류', label: '구분을 선택하세요.', type: 'text', required: false },
  { key: '객실수', label: '객실수를 선택하세요.', type: 'number', required: false },
  { key: '체크인날짜', label: '체크인날짜를 선택하세요.', type: 'date', required: false },
  { key: '체크아웃날짜', label: '체크아웃날짜를 선택하세요.', type: 'date', required: false },
  { key: '일정', label: '일정(자동)을 선택하세요.', type: 'text', required: false },
  { key: '조식서비스', label: '조식서비스를 선택하세요.', type: 'text', required: false },
  { key: 'ADULT', label: '성인수를 선택하세요.', type: 'number', required: false },
  { key: 'CHILD', label: '아동수를 선택하세요.', type: 'number', required: false },
  { key: 'TOODLER', label: '유아수를 선택하세요.', type: 'number', required: false },
  { key: '엑스트라베드', label: '엑스트라 베드를 선택하세요.', type: 'number', required: false },
  { key: '투숙인원 비고', label: '투숙인원(자동)', type: 'text', required: false },
  { key: '금액', label: '금액', type: 'number', required: false },
  { key: '합계', label: '합계', type: 'number', required: false },
  { key: 'Email', label: '이메일 주소', type: 'email', required: true }
];

function HotelServiceForm({ formData, setFormData, headers = [], onServiceSubmitted }) {
  // 컬럼별 아이콘 매핑
  const iconMap = {
    호텔코드: <span role="img" aria-label="code">🔑</span>,
    호텔명: <span role="img" aria-label="hotel">🏨</span>,
    객실명: <span role="img" aria-label="room">🚪</span>,
    객실종류: <span role="img" aria-label="type">🏷️</span>,
    객실수: <span role="img" aria-label="count">#️⃣</span>,
    일정: <span role="img" aria-label="schedule">🗓️</span>,
    체크인날짜: <span role="img" aria-label="checkin">📅</span>,
    체크아웃날짜: <span role="img" aria-label="checkout">📅</span>,
    조식서비스: <span role="img" aria-label="breakfast">🥐</span>,
    ADULT: <span role="img" aria-label="adult">🧑</span>,
    CHILD: <span role="img" aria-label="child">🧒</span>,
    TOODLER: <span role="img" aria-label="baby">👶</span>,
    엑스트라베드: <span role="img" aria-label="bed">🛏️</span>,
  "투숙인원 비고": <span role="img" aria-label="memo">📝</span>,
  금액: <span role="img" aria-label="money">💰</span>,
    합계: <span role="img" aria-label="sum">➕</span>,
    Email: <span role="img" aria-label="email">✉️</span>
  };
  const [loading, setLoading] = useState(false);
  
  const [hotelNameOptions, setHotelNameOptions] = useState([]);
  const [nameToRooms, setNameToRooms] = useState({});
  const [roomNameOptions, setRoomNameOptions] = useState([]);
  const [nameRoomToTypes, setNameRoomToTypes] = useState({});
  const [roomTypeOptions, setRoomTypeOptions] = useState([]);

  // Generate an 8-char unique ID containing at least one uppercase, one lowercase and one digit
  const generateUniqueId = (length = 8) => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const all = upper + lower + digits;
    // ensure at least one of each
    const arr = [];
    arr.push(upper[Math.floor(Math.random() * upper.length)]);
    arr.push(lower[Math.floor(Math.random() * lower.length)]);
    arr.push(digits[Math.floor(Math.random() * digits.length)]);
    for (let i = 3; i < length; i++) {
      arr.push(all[Math.floor(Math.random() * all.length)]);
    }
    // shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  };

  useEffect(() => {
    // 캐시에서 주문ID, 이메일 자동 입력 및 ID 자동 생성
    const cachedOrderId = window.localStorage.getItem('reservation_orderId') || `ORD-${Date.now()}`;
    const cachedEmail = window.localStorage.getItem('user_email') || '';
    setFormData(prev => ({
      ...prev,
      서비스ID: SHEET_ID,
  ID: prev.ID || generateUniqueId(8),
  주문ID: cachedOrderId,
  Email: cachedEmail,
  객실수: prev['객실수'] || 1
    }));
  }, [setFormData]);

  // hotel 시트에서 호텔명 목록 로드
  useEffect(() => {
    async function fetchHotelNames() {
      try {
  const useProxy = (process.env.REACT_APP_USE_PROXY === 'true') || (typeof window !== 'undefined' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(window.location.origin));
  const readUrl = useProxy ? `/api/append?sheet=hotel` : `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/hotel?key=${API_KEY}`;
  const res = await fetch(readUrl);
  const data = await res.json();
        const rows = data.values || [];
        if (rows.length < 2) {
          setHotelNameOptions([]);
          return;
        }
        const header = rows[0].map(h => (h || '').toString());
        const findIndexCI = (arr, target) => arr.findIndex(h => h && h.toString().trim().toLowerCase().includes(target));
        let idxHotel = findIndexCI(header, '호텔명');
        if (idxHotel === -1) {
          idxHotel = findIndexCI(header, 'hotel');
        }
        // 객실명 컬럼 인덱스
        let idxRoom = findIndexCI(header, '객실명');
        if (idxRoom === -1) {
          idxRoom = findIndexCI(header, 'room');
        }
        // 객실종류(종류) 컬럼 인덱스
        let idxType = findIndexCI(header, '종류');
        if (idxType === -1) {
          idxType = findIndexCI(header, 'type');
        }
        if (idxHotel === -1) {
          setHotelNameOptions([]);
          setNameToRooms({});
          return;
        }
        const setNames = new Set();
        const roomsMap = {};
        const typeMap = {};
        rows.slice(1).forEach(r => {
          const hotelVal = r[idxHotel] || '';
          const roomVal = idxRoom !== -1 ? (r[idxRoom] || '') : '';
          const typeVal = idxType !== -1 ? (r[idxType] || '') : '';
          if (hotelVal) {
            setNames.add(hotelVal);
            if (roomVal) {
              if (!roomsMap[hotelVal]) roomsMap[hotelVal] = new Set();
              roomsMap[hotelVal].add(roomVal);
            }
            // map hotel||room -> 종류
            const key = `${hotelVal}||${roomVal}`;
            if (typeVal) {
              if (!typeMap[key]) typeMap[key] = new Set();
              typeMap[key].add(typeVal);
            }
          }
        });
        setHotelNameOptions(Array.from(setNames).sort((a, b) => a.toString().localeCompare(b.toString(), 'ko')));
        // convert sets to sorted arrays
  const mapped = Object.fromEntries(Object.entries(roomsMap).map(([k, v]) => [k, Array.from(v).sort((a, b) => a.toString().localeCompare(b.toString(), 'ko'))]));
  setNameToRooms(mapped);
  const mappedTypes = Object.fromEntries(Object.entries(typeMap).map(([k, v]) => [k, Array.from(v).sort((a, b) => a.toString().localeCompare(b.toString(), 'ko'))]));
  setNameRoomToTypes(mappedTypes);
      } catch (e) {
        console.error('fetchHotelNames error', e);
        setHotelNameOptions([]);
      }
    }
    fetchHotelNames();
  }, []);

  // selected 호텔명에 따라 객실명 옵션 갱신
  const selectedHotel = formData['호텔명'] || '';
  const selectedRoom = formData['객실명'] || '';
  const selectedType = formData['객실종류'] || '';
  useEffect(() => {
    const options = selectedHotel && nameToRooms[selectedHotel] ? nameToRooms[selectedHotel] : [];
    setRoomNameOptions(options.slice());
    if (selectedRoom && !options.includes(selectedRoom)) {
      setFormData(prev => ({ ...prev, 객실명: '' }));
    }
    // also update 객실종류 options when 호텔명 changes
    const key = `${selectedHotel}||${selectedRoom || ''}`;
    const types = key && nameRoomToTypes[key] ? nameRoomToTypes[key] : [];
    setRoomTypeOptions(types.slice());
    if (selectedType && !types.includes(selectedType)) {
      setFormData(prev => ({ ...prev, 객실종류: '' }));
    }
  }, [selectedHotel, selectedRoom, selectedType, nameToRooms, nameRoomToTypes, setFormData]);

  // 체크인/체크아웃 날짜 변경 시 일정 자동 계산 (예: 1박2일)
  const start = formData['체크인날짜'] || '';
  const end = formData['체크아웃날짜'] || '';
  useEffect(() => {
    let schedule = '';
    if (start && end) {
      // Use parseToDate utility to support various input formats
      const sDate = parseToDate(start);
      const eDate = parseToDate(end);
      if (sDate && eDate) {
        const diffMs = eDate.getTime() - sDate.getTime();
        const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
        if (diffDays >= 1) {
          const nights = diffDays;
          const days = diffDays + 1;
          schedule = `${nights}박${days}일`;
        } else {
          schedule = `${parseToIso(start)} ~ ${parseToIso(end)}`;
        }
      } else {
        schedule = `${parseToIso(start)} ~ ${parseToIso(end)}`;
      }
    } else if (start) {
      schedule = parseToIso(start) || start;
    } else if (end) {
      schedule = parseToIso(end) || end;
    }
    setFormData(prev => ({ ...prev, 일정: schedule }));
  }, [start, end, setFormData]);

  // 객실명 변경 시 객실종류 옵션 갱신
  const selHotel = selectedHotel;
  const selRoom = selectedRoom;
  useEffect(() => {
    const key = `${selHotel}||${selRoom}`;
    const types = key && nameRoomToTypes[key] ? nameRoomToTypes[key] : [];
    setRoomTypeOptions(types.slice());
    if (selectedType && !types.includes(selectedType)) {
      setFormData(prev => ({ ...prev, 객실종류: '' }));
    }
  }, [selHotel, selRoom, selectedType, nameRoomToTypes, setFormData]);

  // 투숙인원 자동 합계(성인+아동+유아)
  const a = Number(formData['ADULT'] || 0);
  const c = Number(formData['CHILD'] || 0);
  const t = Number(formData['TOODLER'] || 0);
  useEffect(() => {
    const total = a + c + t;
    setFormData(prev => ({ ...prev, '투숙인원 비고': total }));
  }, [a, c, t, setFormData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
  // 실제 시트 헤더 순서에 맞춰 row 생성
  const fieldMap = Object.fromEntries(FIXED_HEADERS.map(h => [h.key, h.key]));
  // 헤더 명칭 차이 보정: 시트는 '투숙인원', 폼은 '투숙인원 비고'
  fieldMap['투숙인원'] = '투숙인원 비고';
  const rowData = buildRowFromHeaders(headers.length ? headers : FIXED_HEADERS.map(h => h.key), formData, fieldMap);
      
      // Send to Apps Script webapp endpoint (set REACT_APP_SHEET_APPEND_URL and REACT_APP_SHEET_APPEND_TOKEN in .env)
      const appendUrl = process.env.REACT_APP_SHEET_APPEND_URL;
      const appendToken = process.env.REACT_APP_SHEET_APPEND_TOKEN;
  const useProxy = (process.env.REACT_APP_USE_PROXY === 'true') || (typeof window !== 'undefined' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(window.location.origin));
      const targetUrl = useProxy ? '/api/append' : appendUrl;
      if (!targetUrl) throw new Error('Append URL not configured. Set REACT_APP_SHEET_APPEND_URL in .env');
  // 서버(Apps Script)에서 'hotel'을 SH_H로 매핑함
  const payload = { service: 'hotel', row: rowData };
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
  alert('호텔 서비스 정보가 저장되었습니다.');
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
      <h2 className="step-title">호텔 서비스 정보</h2>
      <form className="sheet-columns-form" onSubmit={handleSubmit}>
        {FIXED_HEADERS
          .filter(col => col.key !== '서비스ID' && col.key !== '금액' && col.key !== '합계' && col.key !== 'ID' && col.key !== '주문ID' && col.key !== '호텔코드' && col.key !== '조식서비스')
          .map((col, idx) => (
            <div className="form-group" key={idx}>
              <FormLabel htmlFor={`shh_${col.key}`} col={col} icon={iconMap[col.key]} />
              {col.key === '호텔명' ? (
                <select
                  id={`shh_${col.key}`}
                  value={formData[col.key] || ''}
                  onChange={e => handleInputChange(col.key, e.target.value)}
                  required={col.required}
                  disabled={hotelNameOptions.length === 0}
                >
                  <option value="">호텔 선택</option>
                  {hotelNameOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : col.key === '객실명' ? (
                <select
                  id={`shh_${col.key}`}
                  value={formData[col.key] || ''}
                  onChange={e => handleInputChange(col.key, e.target.value)}
                  required={col.required}
                  disabled={roomNameOptions.length === 0}
                >
                  <option value="">객실 선택</option>
                  {roomNameOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : col.key === '객실종류' ? (
                <select
                  id={`shh_${col.key}`}
                  value={formData[col.key] || ''}
                  onChange={e => handleInputChange(col.key, e.target.value)}
                  required={col.required}
                  disabled={roomTypeOptions.length === 0}
                >
                  <option value="">종류 선택</option>
                  {roomTypeOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : col.key === '객실수' ? (
                <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
                  {Array.from({ length: 7 }, (_, i) => i + 1).map(n => {
                    const selected = String(formData['객실수']) === String(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleInputChange('객실수', n)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: selected ? 'none' : '1px solid #ddd',
                          backgroundColor: selected ? '#007bff' : '#fff',
                          color: selected ? '#fff' : '#333',
                          cursor: 'pointer',
                          minWidth: '36px',
                          margin: '0'
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              ) : (col.key === 'ADULT' || col.key === 'CHILD' || col.key === 'TOODLER' || col.key === '엑스트라베드') ? (
                <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
                  {Array.from({ length: 7 }, (_, i) => i + 1).map(n => {
                    const selected = String(formData[col.key]) === String(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            // 선택된 버튼을 다시 클릭하면 초기화 (빈값)
                            handleInputChange(col.key, '');
                          } else {
                            // 다른 버튼을 클릭하면 해당 값으로 설정
                            handleInputChange(col.key, n);
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: selected ? 'none' : '1px solid #ddd',
                          backgroundColor: selected ? '#007bff' : '#fff',
                          color: selected ? '#fff' : '#333',
                          cursor: 'pointer',
                          minWidth: '36px',
                          margin: '0'
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              ) : col.key === '일정' ? (
                <input
                  type={col.type}
                  id={`shh_${col.key}`}
                  value={formData[col.key] || ''}
                  readOnly
                  placeholder={col.label}
                  required={col.required}
                />
              ) : col.key === 'Email' ? (
                <input
                  type={col.type}
                  id={`shh_${col.key}`}
                  value={formData[col.key] || ''}
                  readOnly
                  placeholder={col.label}
                  required={col.required}
                />
              ) : col.key === '투숙인원 비고' ? (
                <input
                  type={col.type}
                  id={`shh_${col.key}`}
                  value={formData[col.key] || ''}
                  readOnly
                  placeholder={col.label}
                  required={col.required}
                />
              ) : (
                <input
                  type={col.type}
                  id={`shh_${col.key}`}
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

export default HotelServiceForm;
