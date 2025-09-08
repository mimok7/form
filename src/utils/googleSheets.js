// Prefer proxy reads to avoid embedding keys in the client build.
const SHEET_ID = process.env.REACT_APP_SHEET_ID || '';
const API_KEY = process.env.REACT_APP_API_KEY || '';
const USE_PROXY = (process.env.REACT_APP_USE_PROXY === 'true') || (typeof window !== 'undefined' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(window.location.origin));

// 전체 시트 목록 가져오기
export const fetchSheetNames = async () => {
  if (USE_PROXY) {
    const res = await fetch(`/api/append?sheet=__names__`);
    const json = await res.json();
    return (json && json.values && json.values[0]) ? json.values[0] : [];
  }
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.sheets ? data.sheets.map(sheet => sheet.properties.title) : [];
};

// 모든 시트의 데이터 가져와 병합
export const fetchAllSheetsData = async () => {
  const names = await fetchSheetNames();
  const orderMap = {};
  
  for (const name of names) {
    let data;
    if (USE_PROXY) {
      const res = await fetch(`/api/append?sheet=${encodeURIComponent(name)}`);
      data = await res.json();
    } else {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${name}?key=${API_KEY}`;
      const res = await fetch(url);
      data = await res.json();
    }
    
    if (data.values && data.values.length > 1) {
      const headers = data.values[0];
      const rows = data.values.slice(1);
      
      rows.forEach(row => {
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index] || '';
        });
        
        const orderId = rowData['주문ID'] || rowData['orderId'];
        if (orderId) {
          if (!orderMap[orderId]) orderMap[orderId] = {};
          orderMap[orderId] = { ...orderMap[orderId], ...rowData };
        }
      });
    }
  }
  
  return orderMap;
};

// 특정 시트의 데이터 가져오기
export const fetchSheetData = async (sheetName) => {
  if (USE_PROXY) {
    const res = await fetch(`/api/append?sheet=${encodeURIComponent(sheetName)}`);
    const json = await res.json();
    return (json && json.values) ? json.values : [];
  }
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.values || [];
};

// 구글 시트에 데이터 추가 (OAuth 필요 - 현재는 알림만)
export const addToGoogleSheet = async (quoteData) => {
  // 실제 구현을 위해서는 OAuth 인증이 필요합니다
  // 현재는 시뮬레이션으로 콘솔에 출력
  console.log('구글 시트에 추가할 데이터:', quoteData);
  
  // 실제로는 다음과 같은 API 호출이 필요:
  // const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/견적요청:append?valueInputOption=USER_ENTERED`;
  // const body = {
  //   values: [Object.values(quoteData)]
  // };
  // await fetch(url, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${accessToken}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify(body)
  // });
  
  return Promise.resolve();
};

// 구글 시트 데이터 업데이트 (OAuth 필요 - 현재는 알림만)
export const updateGoogleSheet = async (orderId, updateData) => {
  // 실제 구현을 위해서는 OAuth 인증이 필요합니다
  console.log(`주문ID ${orderId} 업데이트:`, updateData);
  
  // 실제로는 범위를 찾아서 업데이트하는 API 호출이 필요
  return Promise.resolve();
};

// 날짜 형식 변환 유틸리티
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ko-KR');
};

// 시간 형식 변환 유틸리티
export const formatTime = (time) => {
  return time || '시간 미정';
};
