import React from 'react';
import ServiceDashboardBase from './ServiceDashboardBase';

function SafeDashboard({ onBack }) {
  const fieldOrder = [
    'Email',
    '한글이름',
    '영문이름',
    '구분',
    '버스선택', 
    '분류',
    '사파종류',
    '인원수',
    '좌석수',
    '메모',
    '사파코드',
    '승차일자',
    '승차시간',
    '집결시간',
    '처리',
    '금액',
    '합계'
  ];

  return (
    <ServiceDashboardBase
      serviceName="사파"
      sheetName="SH_CC"
      fieldOrder={fieldOrder}
      groupByDate={true}
      dateField="승차일자"
      onBack={onBack}
    />
  );
}

export default SafeDashboard;
