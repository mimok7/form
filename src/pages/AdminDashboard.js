import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import CruiseDashboard from './CruiseDashboard';
import CarDashboard from './CarDashboard';
import AirportDashboard from './AirportDashboard';
import RentalCarDashboard from './RentalCarDashboard';
import TourDashboard from './TourDashboard';
import HotelDashboard from './HotelDashboard';
import SHCCDashboard from './SHCCDashboard';
import ReportTabs from './ReportTabs';
import ReservationConfirmation from './ReservationConfirmation';
import UserDashboard from './UserDashboard';
import UsageDateDashboard from './UsageDateDashboard';
import Notice from './Notice';
import './AdminDashboard.css';

const SERVICES = [
  { key: 'user', name: '예약일별', component: UserDashboard },
  { key: 'usage_date', name: '사용일별', component: UsageDateDashboard },
  { key: 'cruise', name: '크루즈', component: CruiseDashboard },
  { key: 'car', name: '차량', component: CarDashboard },
  { key: 'airport', name: '공항', component: AirportDashboard },
  { key: 'rcar', name: '렌트카', component: RentalCarDashboard },
  { key: 'tour', name: '투어', component: TourDashboard },
  { key: 'hotel', name: '호텔', component: HotelDashboard },
  { key: 'sh_cc', name: '스하차량', component: SHCCDashboard },
  { key: 'report_shcc', name: '리포트', component: ReportTabs },
  { key: 'reservation', name: '확인서', component: ReservationConfirmation },
  { key: 'notice', name: '안내', component: Notice },
];

function AdminDashboard() {
  const [selectedService, setSelectedService] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 인증 상태 확인
  useEffect(() => {
    const authenticated = sessionStorage.getItem('admin_authenticated');
    setIsAuthenticated(authenticated === 'true');
  }, []);

  // 로그아웃
  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
  };

  // 서비스 선택 시 해당 대시보드로 이동
  const handleServiceSelect = (serviceKey) => {
    setSelectedService(serviceKey);
  };

  // 메인 대시보드로 돌아가기
  const handleBackToMain = () => {
    setSelectedService(null);
  };

  // 인증되지 않았으면 로그인 페이지 표시
  if (!isAuthenticated) {
    return <AdminLogin onLogin={setIsAuthenticated} />;
  }

  // 메인 콘텐츠 렌더링 함수
  const renderMainContent = () => {
    if (selectedService) {
      const service = SERVICES.find(s => s.key === selectedService);
      if (service) {
        const ServiceComponent = service.component;
        return <ServiceComponent onBack={handleBackToMain} />;
      }
    }

    // 기본 메인 대시보드 콘텐츠
    return (
      <>
        {/* 서비스 메뉴 */}
        <div className="service-menu">
          <h2>🛠️ 서비스 관리</h2>
          <p>관리할 서비스를 선택하세요</p>
          <div className="service-grid">
            {SERVICES.map(service => (
              <div
                key={service.key}
                className="service-card"
                onClick={() => handleServiceSelect(service.key)}
              >
                <div className="service-icon">
                  {service.key === 'cruise' && '🚢'}
                  {service.key === 'car' && '🚗'}
                  {service.key === 'airport' && '✈️'}
                  {service.key === 'rcar' && '🚙'}
                  {service.key === 'tour' && '🗺️'}
                  {service.key === 'hotel' && '🏨'}
                  {service.key === 'sh_cc' && '🚐'}
                  {service.key === 'report_shcc' && '📊'}
                  {service.key === 'reservation' && '📄'}
                  {service.key === 'notice' && 'ℹ️'}
                  {service.key === 'sh_sp' && '🚌'}
                  {service.key === 'user' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="#4a5568"/>
                      <path d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#4a5568" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
                <h3>{service.name}</h3>
                <p>{service.key === 'user' ? '예약일별 사용자 모아보기' : `${service.name} 예약 관리`}</p>
                <button className="service-btn">
                  관리하기
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 통계 */}
        <div className="quick-stats">
          <div className="stats-overview">
            <h3>📊 시스템 현황</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">🚢</div>
                <div>
                  <h4>크루즈</h4>
                  <p>-</p>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">🚗</div>
                <div>
                  <h4>차량</h4>
                  <p>-</p>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">✈️</div>
                <div>
                  <h4>공항</h4>
                  <p>-</p>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">🚙</div>
                <div>
                  <h4>렌트카</h4>
                  <p>-</p>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">🗺️</div>
                <div>
                  <h4>투어</h4>
                  <p>-</p>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">🏨</div>
                <div>
                  <h4>호텔</h4>
                  <p>-</p>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">🚐</div>
                <div>
                  <h4>스하차량</h4>
                  <p>-</p>
                </div>
              </div>
              {/* 스하 차량(SH_SP) 항목 제거 */}
            </div>
          </div>
        </div>
      </>
    );
  };

  // 사이드바가 항상 표시되는 레이아웃
  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>관리자 대시보드</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 로그아웃
          </button>
          <button
            className="home-btn"
            onClick={() => window.location.href = '/admin'}
          >
            🏠 홈으로
          </button>
        </div>
      </div>

      <div className="dashboard-layout" style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        {/* 사이드바 */}
        <div className="sidebar" style={{ 
          width: '220px', 
          minWidth: '180px',
          backgroundColor: '#f8f9fa', 
          borderRight: '1px solid #dee2e6', 
          padding: '24px 18px',
          overflowY: 'auto'
        }}>
          <h3>서비스 메뉴</h3>
          <nav className="sidebar-nav">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '8px' }}>
                <button 
                  className={`sidebar-btn ${!selectedService ? 'active' : ''}`}
                  onClick={() => setSelectedService(null)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: !selectedService ? '#007bff' : 'transparent',
                    color: !selectedService ? 'white' : '#333',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  🏠 메인
                </button>
              </li>
              {SERVICES.map(service => (
                <li key={service.key} style={{ marginBottom: '8px' }}>
                  <button 
                    className={`sidebar-btn ${selectedService === service.key ? 'active' : ''}`}
                    onClick={() => handleServiceSelect(service.key)}
                    style={{
                      width: '100%',
                      padding: '14px 14px',
                      border: 'none',
                      backgroundColor: selectedService === service.key ? '#007bff' : 'transparent',
                      color: selectedService === service.key ? 'white' : '#333',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {service.key === 'cruise' && '🚢'}
                    {service.key === 'car' && '🚗'}
                    {service.key === 'airport' && '✈️'}
                    {service.key === 'rcar' && '🚙'}
                    {service.key === 'tour' && '🗺️'}
                    {service.key === 'hotel' && '🏨'}
                    {service.key === 'sh_cc' && '🚐'}
                    {service.key === 'report_shcc' && '📊'}
                    {service.key === 'reservation' && '📄'}
                    {service.key === 'notice' && 'ℹ️'}
                    {service.key === 'user' && '👤'} {service.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="main-content" style={{ 
          flex: 1, 
          padding: '20px', 
          overflowY: 'auto' 
        }}>
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
