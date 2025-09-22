import React from 'react';
import ServiceDashboardBase from './ServiceDashboardBase';

function SHCCDashboard({ onBack }) {
  const fieldOrder = [
  { key: '이름', label: '이름' },
  { key: 'Email', label: '이메일' },
  { key: '주문ID', label: '주문ID' },
  { key: '승차일', label: '승차일' },
  { key: '분류', label: '분류' },
  { key: '승차위치', label: '승차위치' },
  { key: '하차위치', label: '하차위치' },
  { key: '차량번호', label: '차량번호' },
  { key: '좌석번호', label: '좌석번호' }
  ];

  return (
    <ServiceDashboardBase
      serviceName="스하 차량(SH_CC)"
      sheetName="SH_CC"
      fieldOrder={fieldOrder}
      groupByDate={true}
      dateField="승차일"
      onBack={onBack}
    />
  );
}

export default SHCCDashboard;
