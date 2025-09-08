import React from 'react';
import ServiceDashboardBase from './ServiceDashboardBase';

function CarDashboard({ onBack }) {
  const fieldOrder = [
    'Email',
    '한글이름',
    '영문이름', 
    '구분',
    '분류',
    '크루즈',
    '차량종류',
    '차량코드',
    '차량수',
    '승차인원',
    '승차일시',
    '승차위치',
    '하차위치',
    '수량',
    '처리',
    '금액',
    '합계',
    
  ];
  
  return (
    <ServiceDashboardBase
      serviceName="차량"
      sheetName="SH_C"
      fieldOrder={fieldOrder}
      groupByDate={true}
      dateField="승차일시"
      onBack={onBack}
    />
  );
}

export default CarDashboard;
