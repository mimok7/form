import React, { useState, useEffect, useMemo } from 'react';
import { useSheetData } from '../utils/adminAPI';
import AdminLogin from './AdminLogin';
import './AdminDashboard.css';

// 공통 데이터 처리 로직
export function useServiceData(serviceKey) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});

  // ...existing code...
  // 서비스 목록은 상단 파일의 SERVICE 설정을 따릅니다.
  const SERVICES = [
    { key: 'cruise', name: '크루즈', sheet: 'SH_R' },
    { key: 'car', name: '차량', sheet: 'SH_C' },
    { key: 'airport', name: '공항', sheet: 'SH_P' },
    { key: 'rcar', name: '렌트카', sheet: 'SH_RC' },
    { key: 'tour', name: '투어', sheet: 'SH_T' },
    { key: 'hotel', name: '호텔', sheet: 'SH_H' },
  ];

  const service = SERVICES.find(s => s.key === serviceKey);
  const sheetName = service?.sheet || serviceKey;

  // 서비스별 데이터 로드
  const {
    data,
    headers,
    loading,
    error,
    loadData: reloadData,
    updateRow: updateSheetRow,
    deleteSheetRow
  } = useSheetData(sheetName);

  // sh_m 시트 데이터 조회 (주문ID 이름 매핑용)
  const {
    data: masterData,
    headers: masterHeaders
  } = useSheetData('sh_m');

  // 오늘 날짜 기준 필터링된 데이터
  const filteredData = useMemo(() => {
    if (!data || !headers) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data.filter(row => {
      const dateColumns = ['체크인 시작일자', '승차일자', '승차일시', '일자', '체크인날짜', '승차일'];

      for (const dateCol of dateColumns) {
        const colIndex = headers.indexOf(dateCol);
        if (colIndex >= 0) {
          const dateValue = row[colIndex];
          if (dateValue) {
            try {
              let rowDate;
              if (dateValue.includes('-')) {
                rowDate = new Date(dateValue);
              } else if (dateValue.includes('/')) {
                const parts = dateValue.split('/');
                if (parts.length === 3) {
                  rowDate = new Date(parts[2], parts[0] - 1, parts[1]);
                }
              } else if (dateValue.includes('.')) {
                const parts = dateValue.split('.');
                if (parts.length === 3) {
                  rowDate = new Date(parts[2], parts[1] - 1, parts[0]);
                }
              } else {
                rowDate = new Date(dateValue);
              }

              if (!isNaN(rowDate.getTime())) {
                rowDate.setHours(0, 0, 0, 0);
                if (rowDate >= today) {
                  return true;
                }
              }
            } catch (error) {
              // 날짜 파싱 오류 시 계속 진행
            }
          }
        }
      }
      return false;
    });
  }, [data, headers]);

  // 날짜별 그룹화
  const groupedData = useMemo(() => {
    const groups = new Map();

    filteredData.forEach(row => {
      const dateColumns = ['체크인 시작일자', '승차일자', '승차일시', '일자', '체크인날짜', '승차일'];
      let groupDate = null;
      let dateString = '기타';

      for (const dateCol of dateColumns) {
        const colIndex = headers.indexOf(dateCol);
        if (colIndex >= 0) {
          const dateValue = row[colIndex];
          if (dateValue) {
            try {
              let rowDate;
              if (dateValue.includes('-')) {
                rowDate = new Date(dateValue);
              } else if (dateValue.includes('/')) {
                const parts = dateValue.split('/');
                if (parts.length === 3) {
                  rowDate = new Date(parts[2], parts[0] - 1, parts[1]);
                }
              } else if (dateValue.includes('.')) {
                const parts = dateValue.split('.');
                if (parts.length === 3) {
                  rowDate = new Date(parts[2], parts[1] - 1, parts[0]);
                }
              } else {
                rowDate = new Date(dateValue);
              }

              if (!isNaN(rowDate.getTime())) {
                groupDate = rowDate;
                dateString = rowDate.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                });
                break;
              }
            } catch (error) {
              // 날짜 파싱 오류 시 계속 진행
            }
          }
        }
      }

      if (!groups.has(dateString)) {
        groups.set(dateString, { date: groupDate, rows: [] });
      }
      groups.get(dateString).rows.push(row);
    });

    // 오늘 날짜와 가까운 순서대로 정렬
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from(groups.entries())
      .sort(([aKey, aValue], [bKey, bValue]) => {
        if (aKey === '기타') return 1;
        if (bKey === '기타') return -1;

        const aDate = aValue.date || new Date();
        const bDate = bValue.date || new Date();

        const aDiff = Math.abs(aDate.getTime() - today.getTime());
        const bDiff = Math.abs(bDate.getTime() - today.getTime());

        return aDiff - bDiff;
      });
  }, [filteredData, headers]);

  // sh_m 시트에서 주문ID를 키로 하는 이름 맵핑 생성
  const orderIdToNameMap = useMemo(() => {
    const map = new Map();
    if (masterData && masterHeaders) {
      const idIndex = masterHeaders.indexOf('주문ID');
      const nameIndex = masterHeaders.indexOf('이름') || masterHeaders.indexOf('고객명') || masterHeaders.indexOf('성함');

      if (idIndex >= 0 && nameIndex >= 0) {
        masterData.forEach(row => {
          const orderId = row[idIndex];
          const name = row[nameIndex];
          if (orderId && name) {
            map.set(orderId, name);
          }
        });
      }
    }
    return map;
  }, [masterData, masterHeaders]);

  // 편집 관련 함수들
  const startEdit = (rowIndex, row) => {
    setEditingRow(rowIndex);
    const editObj = {};
    headers.forEach((header, index) => {
      editObj[header] = row[index] || '';
    });
    setEditData(editObj);
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditData({});
  };

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

  const handleDeleteRow = async (rowIndex) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const result = await deleteSheetRow(rowIndex);
        if (result.success) {
          alert('데이터가 삭제되었습니다.');
        } else {
          alert('삭제 중 오류가 발생했습니다: ' + result.error);
        }
      } catch (error) {
        console.error('삭제 오류:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleViewRow = (rowIndex, row) => {
    // 데이터를 자세히 볼 수 있는 모달이나 새 창을 열기
    const viewData = {};
    headers.forEach((header, index) => {
      viewData[header] = row[index] || '';
    });

    // 간단한 alert로 데이터 표시 (실제로는 모달 컴포넌트 사용 권장)
    const dataString = Object.entries(viewData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    alert(`데이터 상세 정보:\n\n${dataString}`);
  };

  return {
    service,
    data,
    headers,
    loading,
    error,
    reloadData,
    groupedData,
    orderIdToNameMap,
    masterData,
    masterHeaders,
    searchTerm,
    setSearchTerm,
    editingRow,
    editData,
    setEditData,
    startEdit,
    cancelEdit,
    saveEdit,
    handleDeleteRow,
    handleViewRow
  };
}

// 공통 서비스 대시보드 컴포넌트
export function ServiceDashboard({ serviceKey }) {
  const {
    service,
    data,
    headers,
    loading,
    error,
    reloadData,
    groupedData,
    orderIdToNameMap,
    masterData,
    masterHeaders,
    searchTerm,
    setSearchTerm,
    editingRow,
    editData,
    setEditData,
    startEdit,
    cancelEdit,
    saveEdit,
    handleDeleteRow,
    handleViewRow
  } = useServiceData(serviceKey);

  const FIELD_ORDER = ['한글이름', '이메일', '차량코드', '구분', '분류', '경로'];

  // 모달을 위한 state 추가
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);

  // 모달 열기 함수
  const openModal = (rowIndex, row) => {
    const viewData = {};
    headers.forEach((header, index) => {
      viewData[header] = row[index] || '';
    });
    setModalData(viewData);
    setShowModal(true);
  };

  // 모달 닫기 함수
  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
  };

  // handleViewRow 함수 수정
  const handleViewRowModal = (rowIndex, row) => {
    openModal(rowIndex, row);
  };

  return (
    <div className="service-dashboard">
      <div className="admin-header">
        <h1>{service?.name || '서비스'} 관리</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="back-btn"
            onClick={() => window.location.href = '/admin'}
          >
            ← 서비스 목록
          </button>
          <button
            className="home-btn"
            onClick={() => window.location.href = '/admin'}
          >
            🏠 홈으로
          </button>
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

      {/* 데이터 카드 */}
      <div className="data-section">
        {loading ? (
          <div className="loading">데이터를 불러오는 중...</div>
        ) : error ? (
          <div className="error-message">
            <h3>⚠️ 데이터 로딩 오류</h3>
            <p>{error}</p>
            <button onClick={() => reloadData()} className="retry-btn">
              🔄 다시 시도
            </button>
          </div>
        ) : (
          <div className="cards-container">
            {groupedData.length === 0 ? (
              <div className="no-data">
                데이터가 없습니다.
              </div>
            ) : (
              groupedData.map(([dateKey, groupData]) => (
                <div key={dateKey} className="date-group">
                  <div className="date-header">
                    <h3>{dateKey}</h3>
                    <span className="group-count">{groupData.rows.length}개 항목</span>
                  </div>
                  <div className="cards-grid">
                    {groupData.rows.map((row, rowIndex) => (
                      <div key={rowIndex} className="data-card">
                        <div className="card-header">
                          <h4>{service?.name || '데이터 형식'}</h4>
                          <div className="card-actions">
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
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="card-content">
                          <table className="card-table">
                            <tbody>
                              {FIELD_ORDER.map((label, idx) => {
                                let colIndex = headers.indexOf(label);
                                let displayValue = colIndex >= 0 ? (row[colIndex] || '-') : '-';

                                // 한글이름인 경우 주문ID 컬럼을 찾아서 sh_m 시트에서 이름을 표시
                                if (label === '한글이름') {
                                  const orderIdIndex = headers.indexOf('주문ID');
                                  if (orderIdIndex >= 0) {
                                    const orderId = row[orderIdIndex];
                                    if (orderId) {
                                      const nameFromMaster = orderIdToNameMap.get(orderId);
                                      if (nameFromMaster) {
                                        displayValue = nameFromMaster;
                                      } else {
                                        displayValue = '-';
                                      }
                                    } else {
                                      displayValue = '-';
                                    }
                                  } else {
                                    displayValue = '-';
                                  }
                                }

                                // 이메일인 경우 주문ID 컬럼을 찾아서 sh_m 시트에서 이메일을 표시
                                if (label === '이메일') {
                                  const orderIdIndex = headers.indexOf('주문ID');
                                  if (orderIdIndex >= 0) {
                                    const orderId = row[orderIdIndex];
                                    if (orderId) {
                                      const masterOrderIdIndex = masterHeaders.indexOf('주문ID');
                                      const emailIndex = masterHeaders.indexOf('이메일') || masterHeaders.indexOf('email') || masterHeaders.indexOf('Email');

                                      if (masterOrderIdIndex >= 0 && emailIndex >= 0) {
                                        const masterRow = masterData.find(mRow => mRow[masterOrderIdIndex] === orderId);
                                        if (masterRow) {
                                          displayValue = masterRow[emailIndex] || '-';
                                        } else {
                                          displayValue = '-';
                                        }
                                      } else {
                                        displayValue = '-';
                                      }
                                    } else {
                                      displayValue = '-';
                                    }
                                  } else {
                                    displayValue = '-';
                                  }
                                }

                                return (
                                  <tr key={idx} className="card-row">
                                    <th className="card-collabel">
                                      <span className="label-icon" aria-hidden="true">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                                          <circle cx="12" cy="12" r="8" fill="currentColor" />
                                        </svg>
                                      </span>
                                      <span className="label-text">{label}</span>
                                    </th>
                                    <td className="card-colvalue">
                                      {editingRow === rowIndex && colIndex >= 0 && label !== '한글이름' ? (
                                        <input
                                          type="text"
                                          value={editData[label] || ''}
                                          onChange={(e) => setEditData({
                                            ...editData,
                                            [label]: e.target.value
                                          })}
                                          className="edit-input"
                                        />
                                      ) : (
                                        <span title={displayValue}>{displayValue}</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 통계 정보 */}
      <div className="stats-section">
        <div className="stats-card">
          <h3>{service?.name} 통계</h3>
          <p>전체 데이터: {data.length}개</p>
          <p>필터된 데이터: {groupedData.reduce((total, [, group]) => total + group.rows.length, 0)}개</p>
          <p>날짜 그룹: {groupedData.length}개</p>
        </div>
      </div>
    </div>
  );
}
