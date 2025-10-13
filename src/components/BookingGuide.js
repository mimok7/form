import React, { useState } from 'react';

const BookingGuide = ({ onContinue }) => {
  return (
    <div 
      onClick={onContinue}
      style={{
        cursor: 'pointer',
        minHeight: '100vh',
        background: '#f5f5f5',
        fontFamily: "'Malgun Gothic', Arial, sans-serif",
        lineHeight: 1.6,
        color: '#333'
      }}
    >
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* 터치 안내 */}
        <div style={{
          background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
          color: 'white',
          padding: '15px',
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          animation: 'pulse 2s infinite'
        }}>
          📱 화면을 터치하면 예약폼으로 이동합니다
        </div>

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