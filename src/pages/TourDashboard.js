import React from 'react';
import ServiceDashboardBase from './ServiceDashboardBase';

function TourDashboard({ onBack }) {
  const fieldOrder = [
    'Email',
    '한글이름',
    '영문이름',
    '투어코드',
    '투어명',
    '투어종류',
    '상세구분',
    '수량',
    '시작일자',
    '종료일자',
    '투어인원',
    '배차',
    '픽업위치',
    '드랍위치',
    '메모',
    '처리',
    '금액',
    '합계',
    '투어비고'
  ];
  
  return (
    <ServiceDashboardBase
      serviceName="투어"
      sheetName="SH_T"
      fieldOrder={fieldOrder}
      groupByDate={true}
      dateField="시작일자"
      onBack={onBack}
    />
  );
}

export default TourDashboard;
