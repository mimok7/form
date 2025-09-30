import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import CruiseDashboard from './pages/CruiseDashboard';
import CarDashboard from './pages/CarDashboard';
import AirportDashboard from './pages/AirportDashboard';
import RentalCarDashboard from './pages/RentalCarDashboard';
import TourDashboard from './pages/TourDashboard';
import HotelDashboard from './pages/HotelDashboard';
import AlertProvider from './mobile/components/CustomAlert';
import ReservationConfirmation from './pages/ReservationConfirmation';
import Notice from './pages/Notice';
import MobileBookingForm from './mobile/GoogleSheetInput';
import './MobileBookingForm.css';

function Header() {
  return (
    <header className="app-header" aria-label="홈으로 이동">
      <div className="header-inner">
        <a href="/admin" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <img src="/logo.png" alt="스테이 하롱 트레블" className="logo" />
          <h1 className="brand">스테이 하롱 예약폼</h1>
        </a>
      </div>
    </header>
  );
}

function App() {

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AlertProvider siteName={process.env.REACT_APP_SITE_NAME || '스테이 하롱 트레블'}>
        <div className="App">
          <Header />

          <main className="app-main">
            <Routes>
              {/* 기본 경로를 /admin으로 리다이렉트 */}
              <Route
                path="/"
                element={<Navigate to="/admin" replace />}
              />
              {/* 모바일 예약 페이지 */}
              <Route
                path="/booking"
                element={<MobileBookingForm />}
              />
              {/* 관리자 대시보드 메인 */}
              <Route
                path="/admin"
                element={<AdminDashboard />}
              />
              {/* 각 서비스별 관리 페이지 */}
              <Route
                path="/admin/cruise"
                element={<CruiseDashboard />}
              />
              <Route
                path="/admin/car"
                element={<CarDashboard />}
              />
              <Route
                path="/admin/airport"
                element={<AirportDashboard />}
              />
              <Route
                path="/admin/rcar"
                element={<RentalCarDashboard />}
              />
              <Route
                path="/admin/tour"
                element={<TourDashboard />}
              />
              <Route
                path="/admin/hotel"
                element={<HotelDashboard />}
              />
              <Route
                path="/admin/reservation"
                element={<ReservationConfirmation />}
              />
              <Route
                path="/admin/notice"
                element={<Notice />}
              />
              {/* 다른 모든 경로를 /admin으로 리다이렉트 */}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </main>
        </div>
      </AlertProvider>
    </Router>
  );
}

export default App;
