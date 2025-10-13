# 이메일 발송 기능 설정 가이드

## 환경 변수 설정

예약 확인서 이메일 발송 기능을 사용하려면 다음 환경 변수를 설정해야 합니다.

### Vercel 환경 변수 설정

1. Vercel 대시보드에서 프로젝트 선택
2. Settings > Environment Variables 메뉴로 이동
3. 다음 변수들을 추가:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

### Gmail 앱 비밀번호 생성 방법

1. Google 계정 관리 (https://myaccount.google.com) 접속
2. 보안 > 2단계 인증 활성화
3. 보안 > 앱 비밀번호 생성
4. 앱 선택: 메일
5. 기기 선택: 기타 (사용자 설정 이름 입력: "Vercel Email")
6. 생성된 16자리 비밀번호를 `EMAIL_PASS`에 사용

### 로컬 개발 환경

`.env.local` 파일 생성:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

## 사용 방법

1. 예약자 정보 입력 및 저장
2. "📧 확인서 발송" 버튼 클릭
3. 고객의 이메일로 예약 확인서 자동 발송

## 이메일 내용

- 주문번호
- 예약자 정보
- 서비스 정보
- 체크인/체크아웃 날짜
- 인원 정보
- 특별 요청사항
- 안내사항

## API 엔드포인트

`/api/sendConfirmation` (POST)

### Request Body

```json
{
  "email": "customer@example.com",
  "orderId": "ABC12345",
  "customerName": "홍길동",
  "checkInDate": "2025-01-15",
  "checkOutDate": "2025-01-17",
  "adults": 2,
  "children": 1,
  "serviceName": "크루즈 예약",
  "specialRequests": "창가 좌석 부탁드립니다"
}
```

### Response

```json
{
  "success": true,
  "message": "예약 확인서가 이메일로 발송되었습니다."
}
```

## 주의사항

- Gmail의 일일 발송 제한: 약 500통
- 앱 비밀번호는 절대 코드에 하드코딩하지 마세요
- Vercel 환경 변수는 배포 후 적용됩니다
- 로컬 테스트 시 `.env.local` 파일 사용
