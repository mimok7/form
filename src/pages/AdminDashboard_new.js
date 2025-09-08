import React, { useState, useEffect } from 'react';
import { useSheetData } from '../utils/adminAPI';
import AdminLogin from './AdminLogin';
import './AdminDashboard.css';

const SERVICES = [
  { key: 'airport', name: '공항 픽업/샌딩', sheet: 'SH_P' },
  { key: 'hotel', name: '호텔 서비스', sheet: 'SH_H' },
  { key: 'cruise', name: '크루즈', sheet: 'SH_C' },
  { key: 'rcar', name: '렌트카', sheet: 'SH_RC' },
  { key: 'tour', name: '투어', sheet: 'SH_T' },
  { key: 'room', name: '객실', sheet: 'room' },
];

function AdminDashboard() {
  const [selectedService, setSelectedService] = useState('airport');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 모달을 위한 state 추가
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);

  // 인증 상태 확인
  useEffect(() => {
    const authenticated = sessionStorage.getItem('admin_authenticated');
    setIsAuthenticated(authenticated === 'true');
  }, []);

  // 커스텀 훅으로 데이터 관리 (항상 호출해야 함 - 조기 리턴 전에)
  const sheetName = SERVICES.find(s => s.key === selectedService)?.sheet || selectedService;
  const {
    data,
    headers,
    loading,
    error,
    loadData: reloadData,
    updateRow: updateSheetRow
  } = useSheetData(sheetName);

  // 서비스 변경 시 데이터 새로고침
  useEffect(() => {
    if (reloadData) {
      reloadData();
    }
  }, [selectedService, reloadData]);

  // 로그아웃
  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
  };

  // 인증되지 않았으면 로그인 페이지 표시
  if (!isAuthenticated) {
    return <AdminLogin onLogin={setIsAuthenticated} />;
  }

  // 검색 필터링
  const filteredData = data.filter(row =>
    row.some(cell =>
      cell && cell.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // 편집 시작
  const startEdit = (rowIndex, row) => {
    setEditingRow(rowIndex);
    const editObj = {};
    headers.forEach((header, index) => {
      editObj[header] = row[index] || '';
    });
    setEditData(editObj);
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingRow(null);
    setEditData({});
  };

  // 편집 저장
  const saveEdit = async (rowIndex) => {
    try {
      const updatedRow = headers.map(header => editData[header] || '');

      const result = await updateSheetRow(rowIndex, updatedRow);
      if (result.success) {
        setEditingRow(null);
        setEditData({});
        alert('데이터가 저장되었습니다.');
      } else {
        alert('저장 중 오류가 발생했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 행 보기
  const handleViewRow = (rowIndex, row) => {
    const viewData = {};
    headers.forEach((header, index) => {
      viewData[header] = row[index] || '';
    });
    setModalData(viewData);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>관리자 대시보드</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            🚪 로그아웃
          </button>
          <button
            className="home-btn"
            onClick={() => window.location.href = '/'}
          >
            🏠 홈으로
          </button>
        </div>
      </div>

      {/* 서비스 선택 */}
      <div className="service-selector">
        <h2>서비스 선택</h2>
        <div className="service-buttons">
          {SERVICES.map(service => (
            <button
              key={service.key}
              className={`service-btn ${selectedService === service.key ? 'active' : ''}`}
              onClick={() => setSelectedService(service.key)}
            >
              {service.name}
            </button>
          ))}
        </div>
      </div>

      {/* 검색 */}
      <div className="search-section">
        <input
          type="text"
          placeholder="검색어를 입력하세요..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button
          onClick={() => reloadData()}
          className="refresh-btn"
        >
          🔄 새로고침
        </button>
      </div>

      {/* 데이터 테이블 */}
      <div className="data-section">
        {loading ? (
          <div className="loading">데이터를 불러오는 중...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>작업</th>
                  {headers.map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length + 1} className="no-data">
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="action-cell">
                        {editingRow === rowIndex ? (
                          <div className="edit-actions">
                            <button
                              onClick={() => saveEdit(rowIndex)}
                              className="save-btn"
                            >
                              💾
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="cancel-btn"
                            >
                              ❌
                            </button>
                          </div>
                        ) : (
                          <div className="row-actions">
                            <button
                              onClick={() => startEdit(rowIndex, row)}
                              className="edit-btn"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleViewRow(rowIndex, row)}
                              className="view-btn"
                            >
                              �️
                            </button>
                          </div>
                        )}
                      </td>
                      {headers.map((header, cellIndex) => (
                        <td key={cellIndex}>
                          {editingRow === rowIndex ? (
                            <input
                              type="text"
                              value={editData[header] || ''}
                              onChange={(e) => setEditData({
                                ...editData,
                                [header]: e.target.value
                              })}
                              className="edit-input"
                            />
                          ) : (
                            <span title={row[cellIndex]}>{row[cellIndex]}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 통계 정보 */}
      <div className="stats-section">
        <div className="stats-card">
          <h3>통계</h3>
          <p>전체 데이터: {data.length}개</p>
          <p>필터된 데이터: {filteredData.length}개</p>
          <p>선택된 서비스: {SERVICES.find(s => s.key === selectedService)?.name}</p>
        </div>
      </div>

      {/* 모달 팝업 */}
      {showModal && modalData && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>데이터 상세 정보</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <table className="modal-table">
                <tbody>
                  {Object.entries(modalData).map(([key, value]) => (
                    <tr key={key}>
                      <td className="modal-th">{key}</td>
                      <td className="modal-td">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-secondary" onClick={closeModal}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
