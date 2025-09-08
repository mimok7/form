앱스스크립트 배포·설정·테스트 가이드

개요
- 이 리포지토리는 모바일/웹 폼에서 Google Apps Script 웹앱으로 POST 요청을 보내고, 지정된 시트에 행을 추가합니다.
- 현재 권장 방식: 클라이언트가 POST 바디에 token 필드(`body.token`)를 포함해 전송하는 방식(환경에 따라 Authorization 헤더가 제거되는 경우가 있어 안정적임).

필수 설정 (Apps Script 프로젝트)
1. Apps Script 편집기 열기 (https://script.google.com)
2. 프로젝트 선택 → 왼쪽 톱니(프로젝트 설정) → Script properties 편집
   - TARGET_SHEET_ID: 데이터를 저장할 Google Spreadsheet ID
   - ALLOWED_TOKEN: 전역 토큰 문자열 (권장: 서비스별 토큰 대신 단일 전역 토큰 사용)
   - ALLOWED_SHEETS: 기본값 `SH_H,SH_T,SH_RC,SH_C,SH_R,SH_P,SH_M` (필요시 수정)
3. 변경 후 저장

웹앱 재배포
1. Apps Script 에디터에서 Deploy → Manage deployments
2. 기존 배포를 선택하고 Redeploy 또는 New deployment로 다시 배포
   - Execute as: Me (본인)로 설정
   - Who has access: 필요 수준(예: Anyone)을 선택
3. 배포된 exec URL을 복사 (예: https://script.google.com/macros/s/AK.../exec)

프런트엔드(클라이언트) 설정
- 환경변수 (예: .env):
  - REACT_APP_SHEET_APPEND_URL=https://script.google.com/macros/s/XXX/exec
  - REACT_APP_SHEET_APPEND_TOKEN=your_token_here
- 클라이언트(예: `src/mobile/services/ReservationForm.js`)는 이미 body.token 방식으로 POST합니다:

```javascript
fetch(APPEND_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ service: 'user', row: rowData, token: APPEND_TOKEN })
});
```

테스트(Windows PowerShell v5.1)
- 환경 변수/토큰이 올바른지 확인하고 아래 명령으로 테스트하세요.

```powershell
$uri = 'https://script.google.com/macros/s/DEPLOY_ID/exec'
$token = 'YOUR_TOKEN_HERE'

# 1) body.token 방식 (권장 / 이미 동작)
$payload = @{ service='user'; token=$token; row=@('테스트-body','값',(Get-Date).ToString()) } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri $uri -Body $payload -ContentType 'application/json'

# 2) Authorization 헤더 방식 (환경에 따라 헤더가 제거될 수 있음)
$payload = @{ service='user'; row=@('헤더-테스트',(Get-Date).ToString()) } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri $uri -Headers @{ 'Authorization' = "Bearer $token" } -Body $payload -ContentType 'application/json'

# 3) X-Api-Key 헤더 방식(대체 헤더)
Invoke-RestMethod -Method Post -Uri $uri -Headers @{ 'X-Api-Key' = $token } -Body $payload -ContentType 'application/json'

# 4) curl.exe (PowerShell alias 문제 회피)
$body = '{"service":"user","row":["curl-test","' + (Get-Date).ToString() + '"] }'
curl.exe -X POST -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d $body "$uri"
```

서버 헬스/프로브
- 재배포된 exec URL에 다음 쿼리로 전역 토큰 존재 여부(값은 노출하지 않음)를 확인할 수 있습니다:
  - GET https://.../exec?probe=tokenlen
  - 응답 예: { success:true, probe:'tokenlen', hasGlobal:true, globalLen:32 }

로그 확인
- Apps Script 내 `APPEND_LOG` 시트에서 최근 기록을 확인하세요. 디버그 로그에는 토큰 값은 남기지 않도록 코드를 조정해 두었습니다.

보안 권장사항
- 프런트엔드에 토큰을 하드코딩하지 마세요. 빌드 시 환경변수로 주입하거나 안전한 백엔드 엔드포인트를 통해 요청하세요.
- 토큰은 주기적으로 교체하세요.
- 운영 전 디버그용 로그(probe, header-key 로그 등)를 제거하거나 주석 처리하세요.

운영 팁
- body.token 방식으로 안정화 후 필요 시 `X-Api-Key` 헤더로 전환하면 일부 네트워크에서 Authorization 헤더가 제거되는 문제를 피할 수 있습니다.
- 서비스별 권한이 필요하면 Apps Script의 Script Properties에 `TOKEN_<SERVICE>` 키를 추가하고, 이를 사용하도록 서버를 확장하세요.

문의
- 테스트 결과(예: `APPEND_LOG`의 최근 6~10행 또는 `doGet?probe=tokenlen` 결과)를 올려주시면 추가 분석과 정리 작업을 도와드리겠습니다.

Vercel 배포 및 환경변수 설정
--------------------------------
- Vercel 대시보드 이용(권장)
  1. Vercel에서 프로젝트 선택
  2. 왼쪽 메뉴 Settings → Environment Variables
  3. 변수 추가: `Name`에 `REACT_APP_SHEET_APPEND_URL`, `Value`에 exec URL 입력, Environment는 `Production`(또는 `Preview`/`Development`) 선택
  4. `REACT_APP_SHEET_APPEND_TOKEN`도 동일하게 추가
  5. 변경 후 배포 트리거(자동 또는 수동 배포)

- Vercel CLI로 설정 (PowerShell 예)
  1. Vercel CLI 설치:

```powershell
npm i -g vercel
```

 2. 프로젝트 루트에서 로그인 및 연결:

```powershell
vercel login
vercel link
# follow prompts to link to your Vercel project
```

 3. 환경변수 추가(예: Production 환경). CLI는 대화형이므로 값은 입력하라는 프롬프트에 따르거나 다음처럼 직접 전달할 수 있습니다:

```powershell
# interactive 방식
vercel env add REACT_APP_SHEET_APPEND_URL production
# 비대화형(간혹 동작 환경에 따라 다름)
vercel env add REACT_APP_SHEET_APPEND_URL "https://script.google.com/macros/s/XXX/exec" production

vercel env add REACT_APP_SHEET_APPEND_TOKEN production
```

 4. 배포 시 Vercel이 빌드에 환경변수를 주입합니다. 빌드 로그에서 환경변수 주입 성공 여부를 확인하세요.

- 보안 및 운영 팁
  - 프론트엔드 환경변수는 빌드 시 정적으로 포함되므로 민감한 값을 노출하지 않도록 주의하세요. 가능한 경우 민감 정보는 서버측에서 보호하세요.
  - 토큰을 즉시 무효화/교체해야 할 경우(이미 리모트에 푸시된 경우) 새 토큰을 발급하고 Vercel 환경변수에서 업데이트하세요.
  - Vercel에서는 `Preview`와 `Production` 환경을 구분해 각각 다른 값을 사용할 수 있습니다.

