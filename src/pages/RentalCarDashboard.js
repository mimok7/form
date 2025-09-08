import React from 'react';
import ServiceDashboardBase from './ServiceDashboardBase';

function RentalCarDashboard({ onBack }) {
  const fieldOrder = [
    'Email',
    '한글이름',
    '영문이름',
    '차량코드',
    '구분',
    '분류',
    '경로',
    '차량종류',
    '차량대수',
    '승차일자',
    '승차시간',
    '승차장소',
    '캐리어갯수',
    '목적지',
    '경유지',
    '승차인원',
    '사용기간',
    '메모',
    '처리',
    '금액',
    '합계',
    '단위'
  ];
  
  return (
    <ServiceDashboardBase
      serviceName="렌트카"
      sheetName="SH_RC"
      fieldOrder={fieldOrder}
      groupByDate={true}
      dateField="승차일자"
      onBack={onBack}
    />
  );
}

export default RentalCarDashboard;
