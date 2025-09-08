# 모바일 예약 폼 시스템

React 기반의 모바일 전용 예약 폼 시스템입니다. Google Sheets와 Apps Script를 통해 데이터를 관리합니다.

## 주요 기능

- 🚗 **차량 서비스**: 크루즈 차량 예약
- 🚢 **크루즈 예약**: 객실 및 승객 정보 관리
- ✈️ **공항 서비스**: 픽업/샌딩 서비스
- 🏨 **호텔 예약**: 호텔 및 숙박 서비스
- 🗾 **투어 서비스**: 관광 투어 예약
- 🚙 **렌터카**: 렌터카 예약 서비스
- 👤 **일반 예약**: 기본 예약 정보

## 기술 스택

- **Frontend**: React 18, React Router
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **Styling**: CSS3 (모바일 최적화)

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 프로덕션 빌드
npm build
```

## 환경 설정

`.env` 파일에서 Google Sheets 연동 설정:

```
REACT_APP_SHEET_ID=your_sheet_id
REACT_APP_SHEET_APPEND_URL=your_apps_script_url
REACT_APP_SHEET_APPEND_TOKEN=your_token
REACT_APP_USE_PROXY=false
```

## 프로젝트 구조

```
src/
├── mobile/
│   ├── GoogleSheetInput.js      # 메인 예약 폼
│   └── services/               # 각 서비스별 폼
│       ├── CarServiceForm.js
│       ├── CruiseBookingForm.js
│       ├── AirportServiceForm.js
│       ├── HotelServiceForm.js
│       ├── TourServiceForm.js
│       ├── RentalCarServiceForm.js
│       └── ReservationForm.js
├── utils/                      # 유틸리티 함수들
└── MobileBookingForm.css       # 모바일 최적화 스타일
```

## Apps Script 연동

각 서비스는 다음과 같이 Google Sheets와 매핑됩니다:

- `user` → SH_M (일반 예약)
- `car` → SH_C (차량 서비스)
- `cruise` → SH_R (크루즈 예약)
- `airport` → SH_P (공항 서비스)
- `hotel` → SH_H (호텔 예약)
- `tour` → SH_T (투어 서비스)
- `rcar` → SH_RC (렌터카)

## 성능 최적화

- ✅ 직접 컬럼 매핑으로 빠른 저장
- ✅ 불필요한 API 호출 제거
- ✅ 모바일 전용 UI/UX
- ✅ Apps Script 직접 연동
