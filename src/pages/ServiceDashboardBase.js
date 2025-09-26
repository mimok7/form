import React, { useState } from 'react';
import { useSheetData } from '../utils/adminAPI';
import './AdminDashboard.css';

// 공통 서비스 대시보드 베이스 컴포넌트
function ServiceDashboardBase({ 
  serviceName, 
  sheetName, 
  fieldOrder = ['ID', '주문ID', '차량코드', '구분', '분류', '경로'],
  groupByDate = false,
  dateField = '승차일자',
  onBack 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);

  // 데이터 관리
  const {
    data = [],
    headers = [],
    loading,
    error,
    loadData: reloadData,
    updateRow: updateSheetRow
  } = useSheetData(sheetName) || {};

  // SH_M 시트에서 회원 데이터 가져오기
  const {
    data: memberData = [],
    headers: memberHeaders = [],
    loading: memberLoading = false
  } = useSheetData('SH_M') || {};

  // SH_C 시트에서 차량(픽업/드랍) 위치 가져오기 (주문ID 매칭)
  const {
    data: carData = [],
    headers: carHeaders = [],
    loading: carLoading = false
  } = useSheetData('SH_C') || {};

  // SH_R(크루즈 예약) 시트와 cruise 마스터 시트 불러오기 (주문ID -> 크루즈명 -> 선착장 위치)
  const {
    data: cruiseResRows = [],
    headers: cruiseResHeaders = [],
    loading: cruiseResLoading = false
  } = useSheetData('SH_R') || {};

  const {
    data: cruiseMasterRows = [],
    headers: cruiseMasterHeaders = [],
    loading: cruiseMasterLoading = false
  } = useSheetData('cruise') || {};

  // 케이스/공백 내성 있는 헤더 찾기
  const findIndexCI = (headersArr, candidates = []) => {
    if (!Array.isArray(headersArr)) return -1;
    const norm = (s) => (s || '').toString().trim().toLowerCase();
    const H = headersArr.map(norm);
    for (const c of candidates) {
      const i = H.indexOf(norm(c));
      if (i !== -1) return i;
    }
    return -1;
  };

  const getCruiseNameByOrderId = (orderId) => {
    if (!orderId) return '';
    if (!Array.isArray(cruiseResRows) || !Array.isArray(cruiseResHeaders)) return '';
    const orderIdx = findIndexCI(cruiseResHeaders, ['주문id', '주문ID', 'orderid']);
    if (orderIdx === -1) return '';
    const row = cruiseResRows.find(r => (r?.[orderIdx] || '') === orderId);
    if (!row) return '';
    const cruiseIdx = findIndexCI(cruiseResHeaders, ['크루즈', '크루즈명', 'cruise']);
    return cruiseIdx !== -1 ? (row[cruiseIdx] || '') : '';
  };

  const getPierByCruiseName = (cruiseName) => {
    if (!cruiseName) return '';
    if (!Array.isArray(cruiseMasterRows) || !Array.isArray(cruiseMasterHeaders)) return '';
    const cruiseIdx = findIndexCI(cruiseMasterHeaders, ['크루즈', '크루즈명', 'cruise']);
    if (cruiseIdx === -1) return '';
  const pierIdx = findIndexCI(cruiseMasterHeaders, ['선착장위치', '선착장 위치', '선착장', '승선장', '승선장소', 'pier', 'port']);
    if (pierIdx === -1) return '';
    const row = cruiseMasterRows.find(r => ('' + (r?.[cruiseIdx] || '')).trim() === ('' + cruiseName).trim());
    return row ? (row[pierIdx] || '') : '';
  };

  const getPierByOrderId = (orderId) => {
    const cruiseName = getCruiseNameByOrderId(orderId);
    const pier = getPierByCruiseName(cruiseName);
    return pier || '';
  };

  const getCarFieldByOrderId = (orderId, fieldKey) => {
    if (!orderId) return '';
    if (!Array.isArray(carData) || !Array.isArray(carHeaders)) return '';
    const orderIdx = carHeaders.indexOf('주문ID');
    if (orderIdx === -1) return '';
    const row = carData.find(r => r[orderIdx] === orderId);
    if (!row) return '';
    const targetIdx = carHeaders.indexOf(fieldKey); // '승차위치' | '하차위치'
    if (targetIdx === -1) return '';
    return row[targetIdx] || '';
  };

  // 검색 필터링 + 날짜 필터링 (오늘 이후 데이터만)
  const filteredData = (Array.isArray(data) ? data : []).filter(row => {
    // 검색어 필터링
    const matchesSearch = row.some(cell =>
      cell && cell.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!matchesSearch) return false;

    // 날짜 필터링 (오늘 이후 데이터만)
    const dateFieldIndex = headers.indexOf(dateField);
    if (dateFieldIndex === -1) return true; // 날짜 필드가 없으면 모든 데이터 표시

    const dateValue = row[dateFieldIndex];
    if (!dateValue) return true; // 날짜 값이 없으면 표시

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 오늘 자정으로 설정

      const rowDate = new Date(dateValue);
      if (isNaN(rowDate.getTime())) return true; // 유효하지 않은 날짜면 표시

      // 오늘 이후의 데이터만 표시
      return rowDate >= today;
    } catch (error) {
      // 날짜 파싱 오류 시 표시
      return true;
    }
  });

  // 주문ID로 회원 정보 찾기
  const getMemberInfo = (orderId) => {
    if (!Array.isArray(memberData) || memberData.length === 0) return null;
    if (!Array.isArray(memberHeaders) || memberHeaders.length === 0) return null;
    
    const orderIdIndex = memberHeaders.indexOf('주문ID');
    if (orderIdIndex === -1) return null;
    
    // 주문ID로 회원 데이터 찾기
    const memberRow = memberData.find(row => row[orderIdIndex] === orderId);
    if (!memberRow) return null;
    
    const emailIndex = memberHeaders.indexOf('Email');
    const koreanNameIndex = memberHeaders.indexOf('한글이름');
    const englishNameIndex = memberHeaders.indexOf('영문이름');
    const nameIndex = memberHeaders.indexOf('이름');
    
    return {
      Email: emailIndex >= 0 ? memberRow[emailIndex] : '-',
      한글이름: koreanNameIndex >= 0 ? memberRow[koreanNameIndex] : '-',
      영문이름: englishNameIndex >= 0 ? memberRow[englishNameIndex] : '-',
      이름: nameIndex >= 0 ? memberRow[nameIndex] : '-'
    };
  };

  // 날짜별 그룹화 함수
  const getGroupedByDate = () => {
    // If grouping is disabled, return simple mapped rows
    if (!groupByDate) {
      return (Array.isArray(filteredData) ? filteredData : []).map((row, index) => ({ row, index, isGrouped: false }));
    }

    // If grouping is enabled but there's no data, return empty groups to avoid undefined items
    if (!Array.isArray(filteredData) || filteredData.length === 0) {
      return [];
    }

    const dateFieldIndex = Array.isArray(headers) ? headers.indexOf(dateField) : -1;
    if (dateFieldIndex === -1) {
      // Can't find date field - return each row as its own group with a single-item `items` array
      return filteredData.map((row, index) => ({ date: '날짜 없음', items: [{ row, index }], isGrouped: false }));
    }

    // 날짜별로 그룹화
    const groups = {};
    filteredData.forEach((row, index) => {
      const dateValue = row[dateFieldIndex] || '날짜 미정';
      if (!groups[dateValue]) {
        groups[dateValue] = [];
      }
      groups[dateValue].push({ row, index });
    });

    // 날짜순으로 정렬하여 반환
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .map(([date, items]) => ({
        date,
        items,
        isGrouped: items.length > 1
      }));
  };

  const groupedData = getGroupedByDate();

  // 그룹화된 항목에서 실제 원본 행 인덱스 찾기 (주문ID 우선, 없으면 행 전체 비교)
  const findActualRowIndex = (itemRow) => {
    const orderIdIndex = Array.isArray(headers) ? headers.indexOf('주문ID') : -1;
    if (orderIdIndex >= 0) {
      const orderId = itemRow[orderIdIndex];
      if (orderId && Array.isArray(data)) {
        return data.findIndex(r => r[orderIdIndex] === orderId);
      }
    }
    // Fallback: 전체 셀값을 비교
  if (!Array.isArray(data) || !Array.isArray(headers)) return -1;
  return data.findIndex(row => headers.every((h, idx) => (row[idx] || '') === (itemRow[idx] || '')));
  };

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

  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
  };

  return (
    <div className="service-dashboard">
      {/* 헤더 */}
      <div className="admin-header">
        <h1>{serviceName} 관리</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="back-btn" onClick={onBack}>
            ← 뒤로가기
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
        <button onClick={() => reloadData()} className="refresh-btn">
          🔄 새로고침
        </button>
      </div>

      {/* 데이터 카드 */}
      <div className="data-section">
        {loading || memberLoading || carLoading || cruiseResLoading || cruiseMasterLoading ? (
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
            {filteredData.length === 0 ? (
              <div className="no-data">데이터가 없습니다.</div>
            ) : (
              <>
                {groupByDate ? (
                  // 날짜별 그룹화된 데이터 렌더링
                  groupedData.map((group, groupIndex) => (
                    <div key={groupIndex} className="date-group">
                      {/* 날짜 헤더 */}
                      <div className="date-header">
                        <h3>📅 {group.date}</h3>
                        <span className="group-count">{group.items.length}건</span>
                      </div>
                      
                      {/* 해당 날짜의 데이터 카드들 */}
                      <div className="group-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        {group.items.map((item, itemIndex) => {
                          const actualRowIndex = findActualRowIndex(item.row);
                          const isEditing = editingRow === actualRowIndex;
                          return (
                          <div key={itemIndex} className="data-card">
                            <div className="card-header">
                              <h4>
                                {/* 고객명이나 주요 식별 정보 표시 */}
                                {(() => {
                                  const orderIdIndex = headers.indexOf('주문ID');
                                  const orderId = orderIdIndex >= 0 ? item.row[orderIdIndex] : null;
                                  const memberInfo = orderId ? getMemberInfo(orderId) : null;
                                  const nameIndex = headers.indexOf('고객명');
                                  const name = nameIndex >= 0 ? item.row[nameIndex] : '';
                                  return memberInfo?.이름 || memberInfo?.한글이름 || name || `예약 ${itemIndex + 1}`;
                                })()}
                              </h4>
                              <div className="card-actions">
                                <div className="row-actions">
                                  {isEditing ? (
                                    <>
                                      <button onClick={() => saveEdit(actualRowIndex)} className="save-btn" title="저장">
                                        <span style={{ marginRight: '6px' }}>💾</span>저장
                                      </button>
                                      <button onClick={cancelEdit} className="cancel-btn" title="취소">
                                        <span style={{ marginRight: '6px' }}>❌</span>취소
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => {
                                          if (actualRowIndex !== -1) startEdit(actualRowIndex, item.row);
                                        }}
                                        className="edit-btn"
                                        title="수정"
                                      >
                                        <span style={{ marginRight: '4px' }}>✏️</span>
                                        수정
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="card-content">
                              <table className="card-table">
                                <tbody>
                                  {fieldOrder
                                    .map((field, idx) => {
                                      // fieldOrder가 객체인지 문자열인지 확인
                                      const fieldKey = typeof field === 'object' ? field.key : field;
                                      const fieldLabel = typeof field === 'object' ? field.label : field;
                                      
                                      // 주문ID 찾기
                                      const orderIdIndex = headers.indexOf('주문ID');
                                      const orderId = orderIdIndex >= 0 ? item.row[orderIdIndex] : null;

                                      // SH_M에서 회원 정보 가져오기
                                      const memberInfo = orderId ? getMemberInfo(orderId) : null;

                                      let value = '-';
                                      // SH_C에서 승차위치/하차위치 우선 매핑
                                      if ((fieldKey === '승차위치' || fieldKey === '하차위치') && orderId) {
                                        const carVal = getCarFieldByOrderId(orderId, fieldKey);
                                        if (carVal && carVal.trim() !== '') value = carVal;
                                      }
                                      // 크루즈명 (SH_R)
                                      if ((fieldKey === '크루즈' || fieldKey === '크루즈명' || fieldKey === 'cruise') && orderId) {
                                        const cname = getCruiseNameByOrderId(orderId);
                                        if (cname && cname.trim() !== '') value = cname;
                                      }
                                      // 선착장 위치 (주문ID -> SH_R의 크루즈 -> cruise 시트에서 선착장)
                                      if ((fieldKey === '선착장위치' || fieldKey === '선착장 위치' || fieldKey === '선착장') && orderId) {
                                        const pier = getPierByOrderId(orderId);
                                        if (pier && pier.trim() !== '') value = pier;
                                      }
                                      if (memberInfo && memberInfo[fieldKey]) {
                                        // SH_M에서 가져온 사용자 정보 사용
                                        if (value === '-' || value === '' || value === null || value === undefined) {
                                          value = memberInfo[fieldKey];
                                        }
                                      } else {
                                        // 기존 데이터에서 값 가져오기
                                        const colIndex = headers.indexOf(fieldKey);
                                        if (value === '-' || value === '' || value === null || value === undefined) {
                                          value = colIndex >= 0 ? (item.row[colIndex] || '-') : '-';
                                        }
                                      }

                                      return { label: fieldLabel, value, idx, fieldKey };
                                    })
                                    .filter(({ value }) => value !== '-' && value !== '' && value !== null && value !== undefined)
                                    .map(({ label, value, idx, fieldKey }) => (
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
                                          {isEditing && headers.indexOf(fieldKey) >= 0 ? (
                                            <input
                                              type="text"
                                              value={editData[fieldKey] || ''}
                                              onChange={(e) => setEditData({ ...editData, [fieldKey]: e.target.value })}
                                              className="edit-input"
                                            />
                                          ) : (
                                            <span title={value}>{value}</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  // 기본 개별 데이터 렌더링
                  <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {filteredData.map((row, rowIndex) => (
                    <div key={rowIndex} className="data-card">
                      <div className="card-header">
                        <h4>{serviceName}</h4>
                        <div className="card-actions">
                          {editingRow === rowIndex ? (
                            <div className="edit-actions">
                              <button onClick={() => saveEdit(rowIndex)} className="save-btn" title="저장">
                                <span style={{ marginRight: '4px' }}>💾</span>
                                저장
                              </button>
                              <button onClick={cancelEdit} className="cancel-btn" title="취소">
                                <span style={{ marginRight: '4px' }}>❌</span>
                                취소
                              </button>
                            </div>
                            ) : (
                            <div className="row-actions">
                              <button onClick={() => startEdit(rowIndex, row)} className="edit-btn" title="수정">
                                <span style={{ marginRight: '4px' }}>✏️</span>
                                수정
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="card-content">
                        <table className="card-table">
                          <tbody>
                            {fieldOrder
                              .map((field, idx) => {
                                // fieldOrder가 객체인지 문자열인지 확인
                                const fieldKey = typeof field === 'object' ? field.key : field;
                                const fieldLabel = typeof field === 'object' ? field.label : field;
                                
                                // 주문ID 찾기
                                const orderIdIndex = headers.indexOf('주문ID');
                                const orderId = orderIdIndex >= 0 ? row[orderIdIndex] : null;
                                
                                // SH_M에서 회원 정보 가져오기
                                const memberInfo = orderId ? getMemberInfo(orderId) : null;
                                
                                let value = '-';
                                // SH_C에서 승차위치/하차위치 우선 매핑
                                if ((fieldKey === '승차위치' || fieldKey === '하차위치') && orderId) {
                                  const carVal = getCarFieldByOrderId(orderId, fieldKey);
                                  if (carVal && carVal.trim() !== '') value = carVal;
                                }
                                // 크루즈명 (SH_R)
                                if ((fieldKey === '크루즈' || fieldKey === '크루즈명' || fieldKey === 'cruise') && orderId) {
                                  const cname = getCruiseNameByOrderId(orderId);
                                  if (cname && cname.trim() !== '') value = cname;
                                }
                                // 선착장 위치 매핑
                                if ((fieldKey === '선착장위치' || fieldKey === '선착장 위치' || fieldKey === '선착장') && orderId) {
                                  const pier = getPierByOrderId(orderId);
                                  if (pier && pier.trim() !== '') value = pier;
                                }
                                if (memberInfo && memberInfo[fieldKey]) {
                                  // SH_M에서 가져온 사용자 정보 사용 (값이 비어있을 때만 덮어씀)
                                  if (value === '-' || value === '' || value === null || value === undefined) {
                                    value = memberInfo[fieldKey];
                                  }
                                } else {
                                  // 기존 데이터에서 값 가져오기 (여전히 비어있다면)
                                  if (value === '-' || value === '' || value === null || value === undefined) {
                                    const colIndex = headers.indexOf(fieldKey);
                                    value = colIndex >= 0 ? (row[colIndex] || '-') : '-';
                                  }
                                }

                                return { label: fieldLabel, value, idx, fieldKey };
                              })
                              .filter(({ value }) => value !== '-' && value !== '' && value !== null && value !== undefined)
                              .map(({ label, value, idx, fieldKey }) => (
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
                                    {editingRow === rowIndex && headers.indexOf(fieldKey) >= 0 ? (
                                      <input
                                        type="text"
                                        value={editData[fieldKey] || ''}
                                        onChange={(e) => setEditData({
                                          ...editData,
                                          [fieldKey]: e.target.value
                                        })}
                                        className="edit-input"
                                      />
                                    ) : (
                                      <span title={value}>{value}</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 모달 */}
      {showModal && modalData && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{serviceName} 상세 정보</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <table className="modal-table">
                <tbody>
                  {Object.entries(modalData)
                    .filter(([key, value]) => value !== '-' && value !== '' && value !== null && value !== undefined)
                    .map(([key, value]) => (
                      <tr key={key}>
                        <th className="modal-th">{key}</th>
                        <td className="modal-td">{value || '-'}</td>
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

      {/* 통계 정보 */}
      <div className="stats-section">
        <div className="stats-card">
          <h3>통계</h3>
          <p>전체 데이터: {(Array.isArray(data) ? data.length : 0)}개</p>
          <p>필터된 데이터: {(Array.isArray(filteredData) ? filteredData.length : 0)}개</p>
          <p>회원 데이터: {(Array.isArray(memberData) ? memberData.length : 0)}개</p>
          <p>서비스: {serviceName}</p>
        </div>
      </div>
    </div>
  );
}

export default ServiceDashboardBase;
