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

// 자료 동기화 API
export const syncAPI = {
  // 구글시트 자료 동기화
  async syncSheets() {
    try {
      const scriptUrl = process.env.REACT_APP_SHEET_APPEND_URL;
      const token = process.env.REACT_APP_SHEET_APPEND_TOKEN;
      const sourceSheetId = process.env.REACT_APP_SOURCE_SHEET_ID || process.env.REACT_APP_SHEET_ID;
      const targetSheetId = process.env.REACT_APP_TARGET_SHEET_ID || process.env.REACT_APP_SHEET_ID;
      const useProxy = process.env.REACT_APP_USE_PROXY === 'true';
      
      if (!scriptUrl) {
        throw new Error('Google Apps Script URL이 설정되지 않았습니다.');
      }
      
      const payload = {
        action: 'syncMatchingSheets',
        sourceSheetId: sourceSheetId,
        targetSheetId: targetSheetId,
        token: token
      };
      
      console.log('동기화 설정:', {
        useProxy,
        scriptUrl,
        sourceSheetId,
        targetSheetId,
        tokenSet: !!token
      });
      
      // 방법 1: 프록시 사용 (기본)
      if (useProxy) {
        console.log('프록시 방식으로 동기화 시도...');
        try {
          const response = await fetch('/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });
          
          const result = await response.json();
          console.log('프록시 응답:', result);
          
          if (result.success) {
            const syncResult = result.result || result;
            return {
              success: true,
              message: syncResult.message || '동기화 완료',
              log: syncResult.log || [],
              syncedCount: syncResult.syncedCount || 0
            };
          } else {
            throw new Error(result.error || '프록시 동기화 실패');
          }
        } catch (proxyError) {
          console.warn('프록시 방식 실패, 직접 호출 시도:', proxyError.message);
        }
      }
      
      // 방법 2: 직접 호출
      console.log('직접 Apps Script 호출 시도...');
      try {
        const response = await fetch(scriptUrl, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        console.log('직접 호출 응답:', text);
        
        const result = JSON.parse(text);
        
        if (result.success) {
          const syncResult = result.result || result;
          return {
            success: true,
            message: syncResult.message || '동기화 완료',
            log: syncResult.log || [],
            syncedCount: syncResult.syncedCount || 0
          };
        } else {
          throw new Error(result.error || '직접 동기화 실패');
        }
      } catch (directError) {
        console.warn('직접 호출 실패:', directError.message);
        
        // 방법 3: JSONP 방식 (대체 방법)
        if (directError.message.includes('Failed to fetch') || directError.message.includes('CORS')) {
          console.log('JSONP 방식으로 동기화 시도...');
          return await this.syncWithJSONP(scriptUrl, payload);
        }
        
        throw directError;
      }
      
    } catch (error) {
      console.error('동기화 오류:', error);
      return {
        success: false,
        message: error.message,
        log: []
      };
    }
  },
  
  // JSONP 방식으로 동기화 (최후 수단)
  async syncWithJSONP(scriptUrl, payload) {
    return new Promise((resolve) => {
      const callbackName = 'syncCallback_' + Date.now();
      const script = document.createElement('script');
      
      // 콜백 함수 등록
      window[callbackName] = (result) => {
        document.head.removeChild(script);
        delete window[callbackName];
        
        if (result.success) {
          const syncResult = result.result || result;
          resolve({
            success: true,
            message: syncResult.message || '동기화 완료 (JSONP)',
            log: syncResult.log || [],
            syncedCount: syncResult.syncedCount || 0
          });
        } else {
          resolve({
            success: false,
            message: result.error || 'JSONP 동기화 실패',
            log: []
          });
        }
      };
      
      // 타임아웃 설정
      setTimeout(() => {
        if (window[callbackName]) {
          document.head.removeChild(script);
          delete window[callbackName];
          resolve({
            success: false,
            message: 'JSONP 요청 타임아웃',
            log: []
          });
        }
      }, 30000);
      
      // GET 요청으로 변경 (한계: URL 길이)
      const params = new URLSearchParams({
        ...payload,
        callback: callbackName
      });
      
      script.src = `${scriptUrl}?${params.toString()}`;
      script.onerror = () => {
        if (window[callbackName]) {
          document.head.removeChild(script);
          delete window[callbackName];
          resolve({
            success: false,
            message: 'JSONP 스크립트 로드 실패',
            log: []
          });
        }
      };
      
      document.head.appendChild(script);
    });
  }
};
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
