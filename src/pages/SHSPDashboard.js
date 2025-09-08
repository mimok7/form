import React from 'react';
import ServiceDashboardBase from './ServiceDashboardBase';

function SHSPDashboard({ onBack }) {
  const fieldOrder = [
    { key: 'Email', label: '이메일' },
    { key: '한글이름', label: '한글이름' },
    { key: '영문이름', label: '영문이름' },
    { key: '구분', label: '구분' },
    { key: '버스선택', label: '버스선택' },
    { key: '분류', label: '분류' },
    { key: '사파종류', label: '사파종류' },
    { key: '인원수', label: '인원수' },
    { key: '좌석수', label: '좌석수' },
    { key: '메모', label: '메모' },
    { key: '사파코드', label: '사파코드' },
    { key: '승차일자', label: '승차일자' },
    { key: '승차시간', label: '승차시간' },
    { key: '집결시간', label: '집결시간' },
    { key: '수정자', label: '수정자' },
    { key: '수정일시', label: '수정일시' },
    { key: '처리', label: '처리상태' },
    { key: '처리일시', label: '처리일시' },
    { key: '금액', label: '금액' },
    { key: '합계', label: '합계' }
  ];

  return (
    <ServiceDashboardBase
  serviceName="스하 차량(SH_SP)"
      sheetName="SH_SP"
      fieldOrder={fieldOrder}
      groupByDate={true}
      dateField="승차일자"
      onBack={onBack}
    />
  );
}

export default SHSPDashboard;
