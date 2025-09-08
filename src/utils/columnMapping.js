// Column mapping utility for ensuring data is saved in correct sheet columns
import { fetchSheetData } from './googleSheets';
import { buildIndexMap } from './headerUtils';

// Cache for column mappings to avoid repeated header fetches
const columnMappingCache = new Map();

/**
 * Get column mapping for a specific service sheet
 * Maps client field names to sheet column indexes
 * @param {string} sheetName - Sheet name (e.g., 'car', 'hotel', 'room')
 * @param {Object} fieldSynonyms - Map of field names to possible column synonyms
 * @returns {Promise<Object>} - Map of field names to column indexes
 */
export const getColumnMapping = async (sheetName, fieldSynonyms = {}) => {
  const cacheKey = `${sheetName}_${JSON.stringify(fieldSynonyms)}`;
  
  if (columnMappingCache.has(cacheKey)) {
    return columnMappingCache.get(cacheKey);
  }

  try {
    const rows = await fetchSheetData(sheetName);
    if (rows.length === 0) {
      throw new Error(`No data in sheet: ${sheetName}`);
    }

    const headers = rows[0];
    const mapping = buildIndexMap(headers, fieldSynonyms);
    
    // Cache for 5 minutes
    columnMappingCache.set(cacheKey, mapping);
    setTimeout(() => columnMappingCache.delete(cacheKey), 5 * 60 * 1000);
    
    return mapping;
  } catch (error) {
    console.error(`Failed to get column mapping for ${sheetName}:`, error);
    return {};
  }
};

/**
 * Map form data to sheet row array using column mapping
 * @param {Object} formData - Form data object
 * @param {Array} fieldOrder - Ordered list of field names
 * @param {Object} columnMapping - Column index mapping from getColumnMapping
 * @param {number} maxColumns - Maximum number of columns in sheet (default: 50)
 * @returns {Array} - Row data array with values in correct column positions
 */
export const mapDataToRow = (formData, fieldOrder, columnMapping, maxColumns = 50) => {
  const row = new Array(maxColumns).fill('');
  
  for (const fieldName of fieldOrder) {
    const columnIndex = columnMapping[fieldName];
    if (columnIndex !== undefined && columnIndex !== -1 && columnIndex < maxColumns) {
      const value = formData[fieldName] || '';
      // Ensure Email is plain string
      if (fieldName === 'Email' && value && typeof value === 'object') {
        row[columnIndex] = value.toString ? value.toString() : JSON.stringify(value);
      } else {
        row[columnIndex] = String(value);
      }
    }
  }
  
  return row;
};

/**
 * Service-specific field synonym maps
 */
export const SERVICE_FIELD_SYNONYMS = {
  cruise: {
    ID: ['ID', 'id'],
    '주문ID': ['주문ID', '주문번호', 'orderid', 'order_id'],
    '체크인': ['체크인', '체크인날짜', 'checkin'],
    '일정': ['일정', 'schedule'],
    '크루즈': ['크루즈', '크루즈명', 'cruise'],
    '객실종류': ['객실종류', '종류', 'type'],
    '구분': ['구분', 'gubun'],
    '객실비고': ['객실비고', '비고', 'remark'],
    '객실코드': ['객실코드', '코드', 'code'],
    '금액': ['금액', 'amount'],
    'ADULT': ['ADULT', '성인', 'adult'],
    'CHILD': ['CHILD', '아동', 'child'],
    'TODDLER': ['TODDLER', '유아', 'toddler'],
    '승선인원': ['승선인원', '총인원', 'total_passenger'],
    '인원수': ['인원수', 'passenger_count'],
    '객실수': ['객실수', 'room_count'],
    '승선도움': ['승선도움', 'boarding_help'],
    '커넥팅룸': ['커넥팅룸', 'connecting_room'],
    'Email': ['Email', 'email', '이메일']
  },
  
  car: {
    ID: ['ID', 'id'],
    '주문ID': ['주문ID', '주문번호', 'orderid'],
    '구분': ['구분', 'gubun'],
    '분류': ['분류', 'category'],
    '크루즈': ['크루즈', 'cruise'],
    '차량종류': ['차량종류', '종류', 'type'],
    '차량코드': ['차량코드', '코드', 'code'],
    '차량수': ['차량수', 'car_count'],
    '승차인원': ['승차인원', 'passenger'],
    '승차일시': ['승차일시', 'boarding_time'],
    '승차위치': ['승차위치', 'pickup_location'],
    '하차위치': ['하차위치', 'dropoff_location'],
    '수량': ['수량', 'quantity'],
    '금액': ['금액', 'amount'],
    '합계': ['합계', 'total'],
    'Email': ['Email', 'email', '이메일']
  },
  
  hotel: {
    ID: ['ID', 'id'],
    '주문ID': ['주문ID', '주문번호', 'orderid'],
    '호텔코드': ['호텔코드', '코드', 'code'],
    '호텔명': ['호텔명', 'hotel_name'],
    '객실명': ['객실명', 'room_name'],
    '객실종류': ['객실종류', '종류', 'type'],
    '객실수': ['객실수', 'room_count'],
    '체크인날짜': ['체크인날짜', '체크인', 'checkin'],
    '체크아웃날짜': ['체크아웃날짜', '체크아웃', 'checkout'],
    '일정': ['일정', 'schedule'],
    '조식서비스': ['조식서비스', 'breakfast'],
    'ADULT': ['ADULT', '성인', 'adult'],
    'CHILD': ['CHILD', '아동', 'child'],
    'TOODLER': ['TOODLER', '유아', 'toddler'],
    '엑스트라베드': ['엑스트라베드', 'extra_bed'],
    '투숙인원 비고': ['투숙인원 비고', '투숙인원', 'guest_count'],
    '금액': ['금액', 'amount'],
    '합계': ['합계', 'total'],
    'Email': ['Email', 'email', '이메일']
  },
  
  rcar: {
    ID: ['ID', 'id'],
    '주문ID': ['주문ID', '주문번호', 'orderid'],
    '차량코드': ['차량코드', '코드', 'code'],
    '구분': ['구분', 'gubun'],
    '분류': ['분류', 'category'],
    '경로': ['경로', '노선', 'route'],
    '차량종류': ['차량종류', '차종', 'type'],
    '차량대수': ['차량대수', 'car_count'],
    '승차일자': ['승차일자', 'boarding_date'],
    '승차시간': ['승차시간', 'boarding_time'],
    '목적지': ['목적지', 'destination'],
    '경유지': ['경유지', 'waypoint'],
    '승차인원': ['승차인원', 'passenger'],
    '사용기간': ['사용기간', 'usage_period'],
    '금액': ['금액', 'amount'],
    '합계': ['합계', 'total'],
    'Email': ['Email', 'email', '이메일']
  },
  
  tour: {
    ID: ['ID', 'id'],
    '주문ID': ['주문ID', '주문번호', 'orderid'],
    '투어코드': ['투어코드', '코드', 'code'],
    '투어명': ['투어명', 'tour_name'],
    '투어종류': ['투어종류', '종류', 'type'],
    '상세구분': ['상세구분', 'detail'],
    '수량': ['수량', 'quantity'],
    '시작일자': ['시작일자', 'start_date'],
    '종료일자': ['종료일자', 'end_date'],
    '배차': ['배차', 'dispatch'],
    '투어인원': ['투어인원', 'tour_passenger'],
    '픽업위치': ['픽업위치', 'pickup'],
    '드랍위치': ['드랍위치', 'dropoff'],
    '금액': ['금액', 'amount'],
    '합계': ['합계', 'total'],
    'Email': ['Email', 'email', '이메일'],
    '메모': ['메모', 'memo'],
    '투어비고': ['투어비고', '비고', 'remark']
  },
  
  airport: {
    ID: ['ID', 'id'],
    '주문ID': ['주문ID', '주문번호', 'orderid'],
    '구분': ['구분', 'gubun'],
    '분류': ['분류', 'category'],
    '경로': ['경로', 'route'],
    '차량코드': ['차량코드', '코드', 'code'],
    '차량종류': ['차량종류', '차종', 'type'],
    '일자': ['일자', 'date'],
    '시간': ['시간', 'time'],
    '공항명': ['공항명', 'airport'],
    '항공편': ['항공편', 'flight'],
    '승차인원': ['승차인원', 'passenger'],
    '캐리어수량': ['캐리어수량', 'luggage'],
    '패스트': ['패스트', 'fast'],
    '장소명': ['장소명', 'location'],
    '경유지': ['경유지', 'waypoint'],
    '경유지대기시간': ['경유지대기시간', 'wait_time'],
    '차량수': ['차량수', 'car_count'],
    '금액': ['금액', 'amount'],
    '합계': ['합계', 'total'],
    'Email': ['Email', 'email', '이메일']
  },
  
  user: {
    '주문ID': ['주문ID', '주문번호', 'orderid'],
    '예약일': ['예약일', 'reservation_date'],
    'Email': ['Email', 'email', '이메일'],
    '결제방식': ['결제방식', 'payment'],
    '한글이름': ['한글이름', '이름', 'korean_name'],
    '영문이름': ['영문이름', 'english_name'],
    '닉네임': ['닉네임', 'nickname'],
    '카톡ID': ['카톡ID', 'kakao_id']
  }
};

/**
 * Get the target sheet name for a service
 */
export const getServiceSheetName = (service) => {
  const sheetMap = {
    cruise: 'room', // cruise uses room sheet for data
    car: 'car',
    hotel: 'hotel', 
    rcar: 'rcar',
    tour: 'tour',
    airport: 'rcar', // airport uses rcar sheet
    user: 'user'
  };
  return sheetMap[service] || service;
};
