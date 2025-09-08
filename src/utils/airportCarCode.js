import { fetchSheetData } from './googleSheets';
import { buildIndexMap } from './headerUtils';

// rcar 시트에서 4가지 조건에 맞는 코드값 반환
export async function getAirportCarCode(type, route, carType) {
  // type: '픽업' 또는 '샌딩', route: 선택된 경로, carType: 선택된 차종
  const rows = await fetchSheetData('rcar');
  if (!rows || rows.length < 2) return '';
  const headers = rows[0];
  const idx = buildIndexMap(headers, {
    gubun: ['구분', 'gubun'],
    bunryu: ['분류', 'category'],
    route: ['경로', '노선', 'route'],
    type: ['차종', '차량종류', '차량타입', 'type'],
    code: ['코드', '차량코드', 'code']
  });
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (
      (row[idx.gubun] || '') === '공항' &&
      (row[idx.bunryu] || '') === type &&
      (row[idx.route] || '') === route &&
      (row[idx.type] || '') === carType
    ) {
      return row[idx.code] || '';
    }
  }
  return '';
}
