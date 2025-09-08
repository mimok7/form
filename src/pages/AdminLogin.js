import React from 'react';

function AdminLogin({ onLogin }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const password = e.target.password.value;
    
    // 간단한 비밀번호 체크 (실제 운영 시에는 더 안전한 방법 사용)
    const adminPassword = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';
    
    if (password === adminPassword) {
      sessionStorage.setItem('admin_authenticated', 'true');
      onLogin(true);
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: '#2d3748',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          관리자 로그인
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#4a5568',
              fontWeight: '500'
            }}>
              비밀번호
            </label>
            <input
              type="password"
              name="password"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            로그인
          </button>
        </form>
        
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: 'none',
              border: 'none',
              color: '#718096',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
