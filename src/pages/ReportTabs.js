import React, { useState } from 'react';
import ReportSHCC from './ReportSHCC';
import ReportSHC from './ReportSHC';

// 리포트 탭 컨테이너 컴포넌트
function ReportTabs({ onBack }) {
  const [activeTab, setActiveTab] = useState('shc'); // 기본을 'shc' (크루즈)로 변경

  return (
    <div>
      {/* 탭 버튼 */}
      <div className="no-print" style={{ 
        marginBottom: '20px', 
        borderBottom: '1px solid #dee2e6',
        background: '#f8f9fa',
        padding: '0 20px'
      }}>
        <div style={{ display: 'flex', gap: '0' }}>
          <button
            onClick={() => setActiveTab('shc')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'shc' ? '#007bff' : 'transparent',
              color: activeTab === 'shc' ? 'white' : '#666',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === 'shc' ? 'bold' : 'normal',
              borderBottom: activeTab === 'shc' ? '3px solid #007bff' : '3px solid transparent'
            }}
          >
            � 크루즈 차량
          </button>
          <button
            onClick={() => setActiveTab('shcc')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'shcc' ? '#007bff' : 'transparent',
              color: activeTab === 'shcc' ? 'white' : '#666',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === 'shcc' ? 'bold' : 'normal',
              borderBottom: activeTab === 'shcc' ? '3px solid #007bff' : '3px solid transparent'
            }}
          >
            � 스하 차량
          </button>
        </div>
      </div>

      {/* 선택된 탭에 따른 컴포넌트 렌더링 */}
      {activeTab === 'shcc' && <ReportSHCC onBack={onBack} />}
      {activeTab === 'shc' && <ReportSHC onBack={onBack} />}
    </div>
  );
}

export default ReportTabs;