import React from 'react';
import ServiceDashboardBase from './ServiceDashboardBase';

function AirportDashboard({ onBack }) {
  const fieldOrder = [
    'Email',
    '한글이름',
    '영문이름',
    '구분',
    '분류',
    '경로',
    '차량코드',
    '차량종류',
    '일자',
    '시간',
    '공항명',
    '항공편',
    '승차인원',
    '캐리어수량',
    '장소명',
    '경유지',
    '경유지대기시간',
    '차량수',
    '처리',
    '금액',
    '합계',
    '패스트',
    '단위'
  ];
  
  return (
    <ServiceDashboardBase
      serviceName="공항"
      sheetName="SH_P"
      fieldOrder={fieldOrder}
      groupByDate={true}
      dateField="일자"
      onBack={onBack}
    />
  );
}

export default AirportDashboard;
