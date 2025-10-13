// Vercel Serverless Function to send confirmation email
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, orderId, customerName, checkInDate, checkOutDate, adults, children, serviceName, specialRequests } = req.body;

    if (!email || !orderId) {
      return res.status(400).json({ error: '이메일과 주문ID는 필수입니다.' });
    }

    // Gmail SMTP 설정 (환경 변수에서 가져오기)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Gmail 주소
        pass: process.env.EMAIL_PASS  // Gmail 앱 비밀번호
      }
    });

    // 확인서 양식 HTML 생성
    const htmlContent = `
      <!doctype html>
      <html lang="ko">
        <head>
          <meta charset="utf-8">
          <title>${customerName} 예약확인서</title>
          <style>
            @page { size: A4; margin: 12mm; }
            html, body { padding:0; margin:0; font-family: "Noto Sans KR", Arial, sans-serif; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page {
              width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; position: relative;
              padding: 30px; background: white;
            }
            h1, h2, h3 { margin: 0 0 12px; color: #2c3e50; }
            h1 { font-size: 28px; color: #667eea; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
            h2 { font-size: 20px; margin-top: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
            .section { margin: 16px 0 24px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
            .label { font-size: 13px; color:#555; font-weight: 500; margin-bottom: 4px; }
            .value { font-size: 15px; font-weight: 600; color: #2c3e50; }
            .highlight-box {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; padding: 20px; border-radius: 10px; margin: 20px 0;
              text-align: center;
            }
            .highlight-box .order-id { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
            .info-box { background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #667eea; }
            .warning-box { background: #fff3cd; padding: 16px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6c757d; font-size: 12px; }
            ul { padding-left: 20px; line-height: 1.8; }
            li { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="page">
            <h1>투어상품 예약확인서</h1>
            <div style="color:#666; font-size: 14px; margin-bottom: 20px;">TOUR PRODUCT RESERVATION CONFIRMATION</div>

            <div class="highlight-box">
              <div class="order-id">주문번호: ${orderId}</div>
              <div>예약이 정상적으로 접수되었습니다</div>
            </div>

            <div class="section">
              <h2>1) 고객정보</h2>
              <div class="grid-2">
                <div>
                  <div class="label">고객명(한글)</div>
                  <div class="value">${customerName || '-'}</div>
                </div>
                <div>
                  <div class="label">이메일</div>
                  <div class="value">${email}</div>
                </div>
                ${checkInDate ? `
                <div>
                  <div class="label">체크인 날짜</div>
                  <div class="value">${checkInDate}</div>
                </div>
                ` : ''}
                ${checkOutDate ? `
                <div>
                  <div class="label">체크아웃 날짜</div>
                  <div class="value">${checkOutDate}</div>
                </div>
                ` : ''}
              </div>
            </div>

            ${serviceName ? `
            <div class="section">
              <h2>2) 서비스 정보</h2>
              <div class="info-box">
                <div class="label">서비스명</div>
                <div class="value" style="margin-bottom: 12px;">${serviceName}</div>
                ${adults || children ? `
                <div class="label">인원</div>
                <div class="value">성인 ${adults || 0}명, 아동 ${children || 0}명</div>
                ` : ''}
              </div>
            </div>
            ` : ''}

            ${specialRequests ? `
            <div class="section">
              <h2>3) 특별 요청사항</h2>
              <div class="info-box">
                ${specialRequests}
              </div>
            </div>
            ` : ''}

            <div class="warning-box">
              <strong>📢 중요 안내사항</strong>
            </div>

            <div class="section">
              <h2>⚠️ 결제 및 예약 안내</h2>
              <ul>
                <li><strong>결제 기한:</strong> 예약 접수 후 <strong style="color: #dc3545;">2시간 이내</strong></li>
                <li>2시간 이내 결제가 어려우신 경우, 반드시 스테이하롱에 말씀해 주세요.</li>
                <li>예약 확정 후 영업일 기준 1~2일 이내에 담당자가 연락드립니다.</li>
              </ul>
            </div>

            <div class="section">
              <h2>📘 여권 정보 제출</h2>
              <ul>
                <li>크루즈 승선을 위해서는 <strong>여권 사본</strong>이 필요합니다.</li>
                <li>여권은 바르게 표시 후 카카오톡 상담방으로 보내주세요.</li>
                <li>모든 승객의 여권 정보를 정부에 등록해야 합니다.</li>
              </ul>
            </div>

            <div class="section">
              <h2>📝 예약 정보 확인</h2>
              <ul>
                <li>모든 내용은 신청서에 기재된 내용으로만 진행됩니다.</li>
                <li>정보가 잘못 입력된 부분이 없는지 꼭 확인해 주세요.</li>
                <li>예약 관련 문의사항은 카카오톡 상담방으로 연락 주시기 바랍니다.</li>
              </ul>
            </div>

            <div class="footer">
              <p><strong>스테이하롱 트래블</strong></p>
              <p>본 확인서는 자동으로 생성되었습니다.</p>
              <p>© 2025 StayHalong Travel. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // 이메일 발송
    await transporter.sendMail({
      from: `"스테이하롱" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[스테이하롱] 예약 확인서 - ${orderId}`,
      html: htmlContent
    });

    res.status(200).json({ 
      success: true, 
      message: '예약 확인서가 이메일로 발송되었습니다.' 
    });

  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ 
      error: '이메일 발송 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};
