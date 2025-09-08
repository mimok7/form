Apps Script Web App for saving reservation HTML to Drive and sending reservation emails

Overview
- This Apps Script receives POST requests from the client and supports two actions:
  - saveToDrive: save provided HTML into a specified Drive folder (by driveId)
  - sendReservationEmail: send an email (GmailApp) with HTML body and attach the HTML file

Deployment
1. Open Google Drive, create a new Apps Script project and paste the contents of `Code.gs`.
2. In `appsscript.json`, set `timeZone` to your zone (default: Asia/Seoul provided).
3. Deploy > New deployment > Select `Web app`.
   - Execute as: Me
   - Who has access: Anyone (or Anyone within [your domain])
4. Grant the script permissions to access Drive and Gmail.

Usage from client
- POST JSON to the deployed web app URL. Examples:
  - Save to Drive:
    { "action":"saveToDrive", "driveId":"0ADbMNv_AB2IKUk9PVA", "filename":"2025-09-01_홍길동(123).html", "content":"<html>...</html>" }
  - Send email:
    { "action":"sendReservationEmail", "to":"user@example.com", "subject":"예약 확인서", "bodyHtml":"<html>...</html>", "bodyText":"안내 문구" }

Security
- Restrict access by choosing who can access the web app when deploying.
- For production, consider verifying a token in the request body and checking it in `doPost`.

Notes
- The script uses `GmailApp.sendEmail` which sends email from the account that deployed the script.
- Attachments and HTML content are sent as-is; sanitize inputs if content may include untrusted sources.

Additional testing and deployment notes

- Environment variables (client-side)
  - Set `REACT_APP_SEND_EMAIL_URL` to your deployed Apps Script web app URL.
  - Set `REACT_APP_SAVE_TO_DRIVE_URL` to the same web app URL (or another endpoint you host).
  - Example `.env` entries (in project root):
    REACT_APP_SEND_EMAIL_URL="https://script.google.com/macros/s/XXXXX/exec"
    REACT_APP_SAVE_TO_DRIVE_URL="https://script.google.com/macros/s/XXXXX/exec"

- How to test end-to-end
  1. Build and serve the React app locally (or deploy the front-end):
     - npm run build && serve -s build
  2. Ensure `.env` points to the deployed Apps Script URL and restart the dev server so env vars are picked up.
  3. In the app, generate a reservation confirmation and click '발송'.
  4. Check the Apps Script execution logs (Executions page) and the Gmail 'Sent' mailbox for the message.

- Why inline CSS matters
  - Many email clients ignore or strip <style> blocks in the HTML body. To ensure the confirmation renders visually like the browser preview, the client code inlines CSS rules into element `style` attributes before sending.
  - The client code includes a basic `inlineCss` utility which attempts to resolve CSS variables declared under `:root` and apply the rules to matching selectors. This covers most common styles used in `reservation_new.html`.

- Troubleshooting
  - If emails still look unstyled: verify that `bodyHtml` in the payload contains inline `style` attributes (inspect network request or logs). Some email providers further sanitize certain CSS properties; consider simplifying styles or using table-based layouts for maximum compatibility.
  - If save-to-Drive fails with permission errors, ensure the Apps Script has Drive scope and the `driveId` is correct and accessible by the deploying account.
