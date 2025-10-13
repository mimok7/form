import React from 'react';

const BookingGuide = ({ onContinue }) => {
  return (
    <div 
      onClick={onContinue}
      style={{
        cursor: 'pointer',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        lineHeight: 1.6,
        color: '#333',
        padding: '0',
        margin: '0'
      }}
    >
      {/* 터치 안내 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        color: '#4a5568',
        padding: '16px 20px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '600',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '8px',
          animation: 'fadeInDown 0.8s ease-out'
        }}>
          <span style={{ fontSize: '18px' }}>📱</span>
          <span>화면을 터치하면 예약폼으로 이동합니다</span>
        </div>
      </div>

      <div style={{
        maxWidth: '100%',
        margin: '0',
        background: 'transparent'
      }}>
        
        {/* 예약자의 이메일정보 수집안내 */}
        <div style={{ 
          margin: '0',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '0',
          boxShadow: '0 4px 25px rgba(0,0,0,0.1)',
          marginBottom: '16px',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: '700',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(5px)'
            }}></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span style={{ fontSize: '24px', marginRight: '8px' }}>🔒</span>
              예약자의 이메일정보 수집안내
            </div>
          </div>
          <div style={{ padding: '24px 20px' }}>
            <p style={{ 
              marginBottom: '20px', 
              fontWeight: '500', 
              lineHeight: 1.7,
              fontSize: '15px',
              color: '#2d3748'
            }}>
              스테이하롱은 아래와 같은 경우에 한하여 고객의 이메일 정보를 사용할 수 있습니다.
            </p>
            <div style={{ 
              background: '#f7fafc',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <ul style={{ margin: '0', padding: '0', listStyle: 'none', lineHeight: 1.8 }}>
                <li style={{ 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  fontSize: '14px',
                  color: '#4a5568'
                }}>
                  <span style={{ color: '#667eea', marginRight: '8px', fontSize: '16px' }}>✓</span>
                  <span>예약확인서의 이메일 발송</span>
                </li>
                <li style={{ 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  fontSize: '14px',
                  color: '#4a5568'
                }}>
                  <span style={{ color: '#667eea', marginRight: '8px', fontSize: '16px' }}>✓</span>
                  <span>긴급한 정보전달, 국가재난 공문의 사본 발송 등</span>
                </li>
                <li style={{ 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  fontSize: '14px',
                  color: '#4a5568'
                }}>
                  <span style={{ color: '#667eea', marginRight: '8px', fontSize: '16px' }}>✓</span>
                  <span>신용카드 결제정보 입력에 따른 "고객의 이메일 주소" 기재란</span>
                </li>
                <li style={{ 
                  marginBottom: '0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  fontSize: '14px',
                  color: '#4a5568'
                }}>
                  <span style={{ color: '#e53e3e', marginRight: '8px', fontSize: '16px' }}>⚠️</span>
                  <span>이 외 어떠한 경우에도 스테이하롱트래블은 고객의 이메일 주소를 사용하지 않습니다.</span>
                </li>
              </ul>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #fef5e7, #fed7aa)',
              border: '1px solid #f6ad55',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: '#744210'
            }}>
              위의 내용을 숙지하시고 예약을 진행해 주시기 바랍니다.
            </div>
          </div>
        </div>

        {/* 예약신청 진행과정 */}
        <div style={{ 
          margin: '0',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '0',
          boxShadow: '0 4px 25px rgba(0,0,0,0.1)',
          marginBottom: '16px',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #48bb78, #38a169)',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: '700'
          }}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>📋</span>
            예약신청 진행과정
          </div>
          <div style={{ padding: '30px 20px' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {/* 1단계 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f8f9fa',
                borderRadius: '16px',
                padding: '20px',
                border: '2px solid #e9ecef',
                position: 'relative'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  borderRadius: '12px',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginRight: '16px',
                  flexShrink: 0,
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}>
                  1단계
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '40px', 
                    marginBottom: '8px',
                    textAlign: 'center'
                  }}>✏️</div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#2d3748', 
                    fontSize: '16px',
                    textAlign: 'center',
                    marginBottom: '4px'
                  }}>신청서 작성</div>
                  <div style={{
                    fontSize: '12px',
                    color: '#718096',
                    textAlign: 'center'
                  }}>예약 정보를 입력해주세요</div>
                </div>
              </div>

              {/* 화살표 */}
              <div style={{ 
                textAlign: 'center', 
                fontSize: '24px', 
                color: '#a0aec0',
                margin: '-12px 0'
              }}>↓</div>

              {/* 2단계 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f8f9fa',
                borderRadius: '16px',
                padding: '20px',
                border: '2px solid #e9ecef'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #48bb78, #38a169)',
                  color: 'white',
                  borderRadius: '12px',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginRight: '16px',
                  flexShrink: 0,
                  boxShadow: '0 4px 15px rgba(72, 187, 120, 0.3)'
                }}>
                  2단계
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '40px', 
                    marginBottom: '8px',
                    textAlign: 'center'
                  }}>💬</div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#2d3748', 
                    fontSize: '16px',
                    textAlign: 'center',
                    marginBottom: '4px'
                  }}>최종견적 전달</div>
                  <div style={{
                    fontSize: '12px',
                    color: '#718096',
                    textAlign: 'center'
                  }}>상담을 통해 견적을 확인하세요</div>
                </div>
              </div>

              {/* 화살표 */}
              <div style={{ 
                textAlign: 'center', 
                fontSize: '24px', 
                color: '#a0aec0',
                margin: '-12px 0'
              }}>↓</div>

              {/* 3단계 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f8f9fa',
                borderRadius: '16px',
                padding: '20px',
                border: '2px solid #e9ecef'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #ed8936, #dd6b20)',
                  color: 'white',
                  borderRadius: '12px',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginRight: '16px',
                  flexShrink: 0,
                  boxShadow: '0 4px 15px rgba(237, 137, 54, 0.3)'
                }}>
                  3단계
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '40px', 
                    marginBottom: '8px',
                    textAlign: 'center'
                  }}>💳</div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#2d3748', 
                    fontSize: '16px',
                    textAlign: 'center',
                    marginBottom: '4px'
                  }}>결제진행</div>
                  <div style={{
                    fontSize: '12px',
                    color: '#718096',
                    textAlign: 'center'
                  }}>안전하게 결제를 완료하세요</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 결제기한에 대한 안내 */}
        <div style={{ 
          margin: '0',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '0',
          boxShadow: '0 4px 25px rgba(0,0,0,0.1)',
          marginBottom: '16px',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ed8936, #dd6b20)',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: '700'
          }}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>⏰</span>
            결제기한에 대한 안내
          </div>
          <div style={{ padding: '24px 20px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #fed7d7, #feb2b2)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '20px',
              border: '2px solid #fc8181'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#c53030',
                marginBottom: '8px'
              }}>2</div>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#742a2a',
                letterSpacing: '1px'
              }}>HOURS</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ 
                color: '#2d3748', 
                marginBottom: '16px', 
                fontSize: '18px',
                fontWeight: '700'
              }}>결제기한은 2시간 이내</h3>
              <p style={{ 
                marginBottom: '12px', 
                lineHeight: 1.6,
                fontSize: '14px',
                color: '#4a5568'
              }}>크루즈는 2시간 이상, 숙박이나 부킹 Lock을 지정 해 주지 않습니다.</p>
              <div style={{
                background: '#fff5f5',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #fed7d7',
                marginTop: '16px'
              }}>
                <p style={{ 
                  marginBottom: '8px', 
                  lineHeight: 1.6,
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#c53030'
                }}>⚠️ 2시간 이내 결제가 불가능한 경우</p>
                <p style={{ 
                  margin: '0', 
                  lineHeight: 1.6,
                  fontSize: '13px',
                  color: '#742a2a'
                }}>2시간 이내 결제가 어려우신 경우, 반드시 스테이하롱에 말씀 해 주세요.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 여권정보 제출의 필수 안내 */}
        <div style={{ 
          margin: '0',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '0',
          boxShadow: '0 4px 25px rgba(0,0,0,0.1)',
          marginBottom: '16px',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #3182ce, #2c5282)',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: '700'
          }}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>📘</span>
            여권정보 제출의 필수 안내
          </div>
          <div style={{ padding: '24px 20px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #bee3f8, #90cdf4)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '20px',
              border: '2px solid #63b3ed'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🌐</div>
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#2c5282',
                letterSpacing: '1px'
              }}>PASSPORT</div>
            </div>
            <div style={{
              background: '#ebf8ff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #bee3f8'
            }}>
              <p style={{ 
                marginBottom: '16px', 
                lineHeight: 1.6,
                fontSize: '15px',
                fontWeight: '600',
                color: '#2c5282',
                textAlign: 'center'
              }}>
                🔍 여권은 바르게 표시 후 카톡 상담방으로 보내주세요.
              </p>
              <div style={{ fontSize: '13px', color: '#4a5568', lineHeight: 1.7 }}>
                <p style={{ marginBottom: '12px' }}>• 크루즈는 승선인원에 대한 여권사본, 승객정보를 정부에 등록해야 합니다.</p>
                <p style={{ marginBottom: '12px' }}>• 크루즈에 승선하는 모든 승객에 대한 여권사본을 당사로 보내주셔야 합니다.</p>
                <p style={{ margin: '0' }}>• 관련 상세한 안내는 스테이하롱에서 전담드린 안내 메시지 내 관련링크에서 확인하실 수 있습니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 정보 오기재 주의 */}
        <div style={{ 
          margin: '0',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '0',
          boxShadow: '0 4px 25px rgba(0,0,0,0.1)',
          marginBottom: '16px',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #e53e3e, #c53030)',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: '700'
          }}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>⚠️</span>
            정보 오기재 주의
          </div>
          <div style={{ padding: '24px 20px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #fed7d7, #feb2b2)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '20px',
              border: '2px solid #fc8181'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>📋</div>
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#742a2a',
                letterSpacing: '1px'
              }}>신청서</div>
            </div>
            <div style={{
              background: '#fff5f5',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #fed7d7'
            }}>
              <h3 style={{ 
                color: '#c53030', 
                marginBottom: '16px', 
                fontSize: '16px',
                fontWeight: '700',
                textAlign: 'center'
              }}>신청서 제출 전 다시한번 꼭! 확인 해 주세요!</h3>
              <div style={{ fontSize: '13px', color: '#742a2a', lineHeight: 1.7 }}>
                <p style={{ marginBottom: '12px' }}>• 모든 부분은 신청서에 기재 된 내용으로만 진행 됩니다.</p>
                <p style={{ marginBottom: '12px' }}>• 반드시 반영을 원하시는 부분 (카톡물음 등)은 채팅 시 말씀 주셔도 기타 요청사항에 반드시 기재 해 주시고,</p>
                <p style={{ margin: '0' }}>• 정보가 잘못 입력 된 부분이 없는지 꼭 한번 더 확인 후 제출 해 주세요.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 계속하기 버튼 */}
        <div style={{
          background: 'linear-gradient(135deg, #48bb78, #38a169)',
          color: 'white',
          padding: '24px 20px',
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 8px 25px rgba(72, 187, 120, 0.3)',
          position: 'sticky',
          bottom: 0,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>✅</span>
            <span>이해했습니다. 예약폼으로 이동하기</span>
            <span style={{ fontSize: '20px' }}>→</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
};

export default BookingGuide;

        {/* 예약자의 이메일정보 수집안내 */}
        <div style={{ marginBottom: 0 }}>
          <div style={{
            background: 'linear-gradient(135deg, #4a90e2, #357abd)',
            color: 'white',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            <span style={{ marginRight: '10px', fontSize: '24px' }}>👆</span>
            예약자의 이메일정보 수집안내
          </div>
          <div style={{ padding: '30px', background: 'white' }}>
            <p style={{ marginBottom: '20px', fontWeight: 500, lineHeight: 1.6 }}>
              스테이하롱은 아래와 같은 경우에 한하여 고객의 이메일 정보를 사용할 수 있습니다.
            </p>
            <ul style={{ marginLeft: '20px', marginBottom: '20px', lineHeight: 1.8 }}>
              <li style={{ marginBottom: '10px' }}>예약확인서의 이메일 발송</li>
              <li style={{ marginBottom: '10px' }}>긴급한 정보전달, 국가재난 공문의 사본 발송 등</li>
              <li style={{ marginBottom: '10px' }}>신용카드 결제정보 입력에 따른 "고객의 이메일 주소" 기재란</li>
              <li style={{ marginBottom: '10px' }}>이 외 어떠한 경우에도 스테이하롱트래블은 고객의 이메일 주소를 사용하지 않습니다.</li>
            </ul>
            <p style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              padding: '15px',
              fontWeight: 500,
              color: '#856404',
              textAlign: 'center'
            }}>
              위의 내용을 숙지하시고 예약을 진행해 주시기 바랍니다.
            </p>
          </div>
        </div>

        {/* 예약신청 진행과정 */}
        <div style={{ marginBottom: 0 }}>
          <div style={{
            background: 'linear-gradient(135deg, #4a90e2, #357abd)',
            color: 'white',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            <span style={{ marginRight: '10px', fontSize: '24px' }}>👆</span>
            예약신청 진행과정
          </div>
          <div style={{ padding: '30px', background: 'white' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              margin: '20px 0',
              flexWrap: 'wrap',
              gap: '20px'
            }}>
              <div style={{ textAlign: 'center', flex: 1, position: 'relative', minWidth: '150px', padding: '0 15px' }}>
                <div style={{
                  background: '#4a90e2',
                  color: 'white',
                  borderRadius: '25px',
                  width: '80px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  margin: '0 auto 10px'
                }}>1단계</div>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#f0f8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  fontSize: '40px',
                  border: '3px solid #4a90e2'
                }}>✏️</div>
                <div style={{ fontWeight: 'bold', color: '#4a90e2', marginBottom: '5px', fontSize: '16px' }}>신청서 작성</div>
              </div>
              <div style={{ fontSize: '24px', color: '#666' }}>❯</div>
              <div style={{ textAlign: 'center', flex: 1, position: 'relative', minWidth: '150px', padding: '0 15px' }}>
                <div style={{
                  background: '#4a90e2',
                  color: 'white',
                  borderRadius: '25px',
                  width: '80px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  margin: '0 auto 10px'
                }}>2단계</div>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#f0f8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  fontSize: '40px',
                  border: '3px solid #4a90e2'
                }}>💬</div>
                <div style={{ fontWeight: 'bold', color: '#4a90e2', marginBottom: '5px', fontSize: '16px' }}>최종견적 전달</div>
              </div>
              <div style={{ fontSize: '24px', color: '#666' }}>❯</div>
              <div style={{ textAlign: 'center', flex: 1, position: 'relative', minWidth: '150px', padding: '0 15px' }}>
                <div style={{
                  background: '#4a90e2',
                  color: 'white',
                  borderRadius: '25px',
                  width: '80px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  margin: '0 auto 10px'
                }}>3단계</div>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#f0f8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  fontSize: '40px',
                  border: '3px solid #4a90e2'
                }}>💳</div>
                <div style={{ fontWeight: 'bold', color: '#4a90e2', marginBottom: '5px', fontSize: '16px' }}>결제진행</div>
              </div>
            </div>
          </div>
        </div>

        {/* 결제기한에 대한 안내 */}
        <div style={{ marginBottom: 0 }}>
          <div style={{
            background: 'linear-gradient(135deg, #4a90e2, #357abd)',
            color: 'white',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            <span style={{ marginRight: '10px', fontSize: '24px' }}>👆</span>
            결제기한에 대한 안내
          </div>
          <div style={{ padding: '30px', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '30px',
                position: 'relative',
                border: '8px solid #333',
                fontSize: '48px',
                fontWeight: 'bold'
              }}>
                2
                <div style={{
                  position: 'absolute',
                  bottom: '15px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>HOURS</div>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#4a90e2', marginBottom: '10px', fontSize: '18px' }}>결제기한은 2시간 이내</h3>
                <p style={{ marginBottom: '10px', lineHeight: 1.5 }}>크루즈는 2시간 이상, 숙박이나 부킹 Lock을 지정 해 주지 않습니다.</p>
                <p style={{ marginBottom: '10px', lineHeight: 1.5 }}>
                  <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>2시간 이내 결제가 불가능한 경우</span>
                </p>
                <p style={{ marginBottom: '10px', lineHeight: 1.5 }}>2시간 이내 결제가 어려우신 경우, 반드시 스테이하롱에 말씀 해 주세요.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 여권정보 제출의 필수 안내 */}
        <div style={{ marginBottom: 0 }}>
          <div style={{
            background: 'linear-gradient(135deg, #4a90e2, #357abd)',
            color: 'white',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            <span style={{ marginRight: '10px', fontSize: '24px' }}>👆</span>
            여권정보 제출의 필수 안내
          </div>
          <div style={{ padding: '30px', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', margin: '20px 0', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{
                width: '100px',
                height: '140px',
                background: '#1e5f99',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '30px',
                color: 'white',
                position: 'relative',
                fontSize: '40px'
              }}>
                🌐
                <div style={{
                  position: 'absolute',
                  bottom: '15px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>PASSPORT</div>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ marginBottom: '15px', lineHeight: 1.6 }}>
                  <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>여권은 바르게 표시 후 카톡 상담방으로 보내주세요.</span>
                </p>
                <p style={{ marginBottom: '15px', lineHeight: 1.6 }}>크루즈는 승선인원에 대한 여권사본, 승객정보를 정부에 등록해야 합니다.</p>
                <p style={{ marginBottom: '15px', lineHeight: 1.6 }}>따라서 크루즈에 승선하는 모든 승객에 대한 여권사본을</p>
                <p style={{ marginBottom: '15px', lineHeight: 1.6 }}>당사로 보내주셔야 하며, 관련 상세한 안내는 스테이하롱에서 전담드린</p>
                <p style={{ marginBottom: '15px', lineHeight: 1.6 }}>안내 메시지 내 관련링크에서 확인하실 수 있습니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 정보 오기재 주의 */}
        <div style={{ marginBottom: 0 }}>
          <div style={{
            background: 'linear-gradient(135deg, #4a90e2, #357abd)',
            color: 'white',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            <span style={{ marginRight: '10px', fontSize: '24px' }}>👆</span>
            정보 오기재 주의
          </div>
          <div style={{ padding: '30px', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', margin: '20px 0', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{
                width: '120px',
                height: '80px',
                background: '#4a90e2',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '30px',
                color: 'white',
                fontSize: '14px',
                textAlign: 'center',
                lineHeight: 1.2
              }}>
                📋<br />신청서
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#4a90e2', marginBottom: '10px', fontSize: '18px' }}>신청서 제출 전 다시한번 꼭! 확인 해 주세요!</h3>
                <p style={{ marginBottom: '10px', lineHeight: 1.6 }}>모든 부분은 신청서에 기재 된 내용으로만 진행 됩니다.</p>
                <p style={{ marginBottom: '10px', lineHeight: 1.6 }}>반드시 반영을 원하시는 부분 (카톡물음 등)은 체팅 시 말씀 주셔터라도</p>
                <p style={{ marginBottom: '10px', lineHeight: 1.6 }}>기저 요청사항에 반드시 기재 해 주시고,</p>
                <p style={{ marginBottom: '10px', lineHeight: 1.6 }}>정보가 잘못 입력 된 부분이 없는지 꼭 한번 더 확인 후 제출 해 주세요.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 계속하기 버튼 */}
        <div style={{
          background: 'linear-gradient(135deg, #28a745, #20c997)',
          color: 'white',
          padding: '25px',
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}>
          ✅ 이해했습니다. 예약폼으로 이동하기
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        @media (max-width: 768px) {
          .step-mobile {
            flex-direction: column !important;
            gap: 20px !important;
          }
          .arrow-mobile {
            transform: rotate(90deg) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BookingGuide;