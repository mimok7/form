import React from 'react';
import ServiceDashboardBase from './ServiceDashboardBase';

function HotelDashboard({ onBack }) {
  const fieldOrder = [
    'Email',
    '한글이름',
    '영문이름',

    '호텔명',
    '객실명',
    '객실종류',
    '객실수',

    '체크인날짜',
    '체크아웃날짜',
    '조식서비스',
    'ADULT',
    'CHILD',
    'TOODLER',
    '엑스트라베드',

    '처리',

    '할인액',
 
  ];
  
  return (
    <ServiceDashboardBase
      serviceName="호텔"
      sheetName="SH_H"
      fieldOrder={fieldOrder}
      groupByDate={true}
      dateField="체크인날짜"
      onBack={onBack}
    />
  );
}

export default HotelDashboard;
