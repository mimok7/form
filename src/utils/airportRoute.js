import { fetchSheetData } from './googleSheets';
import { buildIndexMap } from './headerUtils';

// rcar 시트에서 경로 목록을 가져오는 함수
export async function getAirportRoutesByType(type) {
  // type: '픽업' 또는 '샌딩'
  const rows = await fetchSheetData('rcar');
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  const idx = buildIndexMap(headers, {
    gubun: ['구분', 'gubun'],
    bunryu: ['분류', 'category'],
    route: ['경로', '노선', 'route']
  });
  // 구분: 공항, 분류: type
  const routeSet = new Set();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if ((row[idx.gubun] || '') === '공항' && (row[idx.bunryu] || '') === type) {
      routeSet.add(row[idx.route]);
    }
  }
  return Array.from(routeSet);
}
