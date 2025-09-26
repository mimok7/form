import React from 'react';
import ServiceDashboardBase from './ServiceDashboardBase';

function CruiseDashboard({ onBack }) {
  const fieldOrder = [
    'Email',
    '한글이름', 
    '영문이름',
    '크루즈',

    '객실종류',
    '객실수',
    '일정일수',
    '객실할인',
    '체크인',

    'ADULT',
    'CHILD',
    'TODDLER',

    '승선도움',
    '할인코드',
    '객실비고',
    '처리',
    '보트',

    '커넥팅룸'
  ];
  
  return (
    <ServiceDashboardBase
      serviceName="크루즈"
      sheetName="SH_R"
      fieldOrder={fieldOrder}
      groupByDate={true}
      dateField="체크인"
      onBack={onBack}
    />
  );
}

export default CruiseDashboard;
