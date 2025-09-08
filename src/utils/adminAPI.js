import { useState, useEffect, useCallback } from 'react';

const SHEET_ID = process.env.REACT_APP_SHEET_ID;
const API_KEY = process.env.REACT_APP_API_KEY;

// Google Sheets API 래퍼 함수들
export const sheetsAPI = {
  // 데이터 읽기
  async readSheet(sheetName) {
    try {
      const useProxy = (process.env.REACT_APP_USE_PROXY === 'true') || 
        (typeof window !== 'undefined' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(window.location.origin));
      
      const readUrl = useProxy 
        ? `/api/append?sheet=${sheetName}` 
        : `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`;
      
      const response = await fetch(readUrl);
      const result = await response.json();
      
      return {
        success: true,
        headers: result.values?.[0] || [],
        data: result.values?.slice(1) || []
      };
    } catch (error) {
      console.error('데이터 읽기 오류:', error);
      return {
        success: false,
        error: error.message,
        headers: [],
        data: []
      };
    }
  },

  // 데이터 업데이트 (실제 구현 시 필요)
  async updateRow(sheetName, rowIndex, rowData) {
    try {
      // 실제 Google Sheets API 업데이트 구현
      // 현재는 로컬 상태만 반영
      console.log('업데이트:', { sheetName, rowIndex, rowData });
      return { success: true };
    } catch (error) {
      console.error('업데이트 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 데이터 삭제 (실제 구현 시 필요)
  async deleteRow(sheetName, rowIndex) {
    try {
      // 실제 Google Sheets API 삭제 구현
      console.log('삭제:', { sheetName, rowIndex });
      return { success: true };
    } catch (error) {
      console.error('삭제 오류:', error);
      return { success: false, error: error.message };
    }
  }
};

// 커스텀 훅: 시트 데이터 관리
export function useSheetData(sheetName) {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!sheetName) return;

    setLoading(true);
    setError(null);

    try {
      const result = await sheetsAPI.readSheet(sheetName);

      if (result.success) {
        setHeaders(result.headers);
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
        setHeaders([]);
        setData([]);
      }
    } catch (err) {
      setError(err.message);
      setHeaders([]);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [sheetName]);

  const updateRow = async (rowIndex, rowData) => {
    const result = await sheetsAPI.updateRow(sheetName, rowIndex, rowData);
    if (result.success) {
      const newData = [...data];
      newData[rowIndex] = rowData;
      setData(newData);
    }
    return result;
  };

  const deleteRow = async (rowIndex) => {
    const result = await sheetsAPI.deleteRow(sheetName, rowIndex);
    if (result.success) {
      const newData = data.filter((_, index) => index !== rowIndex);
      setData(newData);
    }
    return result;
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    headers,
    loading,
    error,
    loadData,
    updateRow,
    deleteRow
  };
}

export default sheetsAPI;
