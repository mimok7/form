import { fetchSheetData } from './googleSheets';
import { buildIndexMap } from './headerUtils';

// rcar 시트에서 조건에 맞는 차종 목록을 가져오는 함수
export async function getAirportCarTypes(type, route) {
  // type: '픽업' 또는 '샌딩', route: 선택된 경로
  const rows = await fetchSheetData('rcar');
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  const idx = buildIndexMap(headers, {
    gubun: ['구분', 'gubun'],
    bunryu: ['분류', 'category'],
    route: ['경로', '노선', 'route'],
    type: ['차종', '차량종류', '차량타입', 'type']
  });
  // 구분: 공항, 분류: type, 경로: route
  const carTypeSet = new Set();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (
      (row[idx.gubun] || '') === '공항' &&
      (row[idx.bunryu] || '') === type &&
      (row[idx.route] || '') === route
    ) {
      carTypeSet.add(row[idx.type]);
    }
  }
  return Array.from(carTypeSet);
}
