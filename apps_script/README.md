네앱스스크립트(Apps Script) 웹앱 배포 및 React 앱 연동 가이드

요약
- 이 폴더에는 React 클라이언트에서 POST로 전송한 데이터를 Google Sheets에 appendRow로 저장하는 Apps Script 코드(`Code.gs`)가 들어있습니다.

준비물
- Google 계정
- Google Sheets 파일 (이미 `REACT_APP_SHEET_ID`가 .env에 설정되어 있어야 함)

단계 1 — 스크립트 생성
1. Google Drive에서 새 Google Apps Script 프로젝트를 생성합니다.
2. 새 프로젝트의 `Code.gs` 내용을 이 저장소의 `apps_script/Code.gs`로 교체합니다.

단계 2 — 환경값 설정
1. `Code.gs`의 상단에 있는 `ALLOWED_TOKEN`과 `TARGET_SHEET_ID`를 실제 값으로 바꿉니다.
   - `ALLOWED_TOKEN`: 클라이언트에서 `REACT_APP_SHEET_APPEND_TOKEN`으로 설정할 비밀 토큰입니다.
   - `TARGET_SHEET_ID`: `.env`에 있는 `REACT_APP_SHEET_ID` 값과 동일하게 설정하세요.

단계 3 — 배포
1. 상단 메뉴에서 "배포(Deploy)" → "새 배포(Manage deployments)"를 선택합니다n2. "웹앱(Web app)"을 선택하세요.
2. 접근 권한은 보통 "Anyone" 또는 "Anyone with the link"로 설정해야 클라이언트에서 접근 가능합니다. (보안상 권장하지 않음 — 가능한 경우 Cloud Function + 인증을 권장)
3. 배포 후 발생한 실행 URL(예: https://script.google.com/macros/s/DEPLOY_ID/exec)을 복사하세요.

단계 4 — React 앱에 값 입력
1. 복사한 웹앱 URL을 `.env`의 `REACT_APP_SHEET_APPEND_URL`에 넣으세요.
2. `REACT_APP_SHEET_APPEND_TOKEN`에 `Code.gs`에 넣은 `ALLOWED_TOKEN` 값을 넣으세요.
3. dev 서버를 재시작하세요: `npm start`.

단계 5 — 테스트
1. React 앱에서 호텔(또는 기타) 폼을 작성한 뒤 저장/전송을 누르세요.
2. 브라우저 개발자 도구의 Network 탭에서 POST가 성공(200)했는지 확인하세요.
3. Google Sheets에 데이터가 정상적으로 추가되었는지 확인하세요.

보안 주의사항
- 이 방법은 `ALLOWED_TOKEN`을 클라이언트에 노출합니다. 운영 환경에서는 서버(예: Cloud Function, Node 서버)에서 Google API를 호출하는 방식이나, Apps Script와 별도의 서버-사이드 인증을 사용하는 것을 권장합니다.

문제 해결
- invalid token: `.env`의 토큰과 Apps Script의 `ALLOWED_TOKEN`이 일치하는지 확인하세요.
- sheet not found: `TARGET_SHEET_ID` 또는 `sheet` 파라미터가 잘못되었을 수 있습니다.
- 권한 문제: 스크립트의 접근 권한이 "Anyone"인지 확인하세요.

추가 작업
- 작성자가 원하면 도와드려서 Apps Script 배포까지 제가 대신 진행해 드릴 수 있습니다. 배포를 원하시면 배포용 Google 계정으로 로그인할 권한(또는 복사한 스크립트 URL)을 알려주세요.
