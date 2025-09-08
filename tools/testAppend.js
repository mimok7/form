const fetch = require('node-fetch');
require('dotenv').config({ path: __dirname + '/../.env' });

const appendUrl = process.env.REACT_APP_SHEET_APPEND_URL;
const token = process.env.REACT_APP_SHEET_APPEND_TOKEN;

if (!appendUrl) {
  console.error('Missing REACT_APP_SHEET_APPEND_URL in .env');
  process.exit(1);
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function sendTest(service, row, opts = {}) {
  const { maxAttempts = 4, baseDelay = 1000 } = opts;
  const payload = { service, row, token };
  console.log('\n-> Sending:', service, row);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(appendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      console.log(`<- Attempt ${attempt} Status:`, res.status);
      console.log('<- Body:', text);

      if (res.status === 429) {
        if (attempt < maxAttempts) {
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 500);
          console.log(`<-- Received 429, backing off ${delay}ms and retrying...`);
          await sleep(delay);
          continue;
        }
        console.log('<-- Max attempts reached for', service);
      }

      // break on non-retriable status or success
      break;
    } catch (err) {
      console.error(`<-- Attempt ${attempt} failed:`, err.message);
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`<-- Network error, retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }
      console.error('<-- Max attempts reached; giving up for', service);
    }
  }
}

async function runAll() {
  // minimal sample rows matching common FIXED_HEADERS order for each service
  const opts = { maxAttempts: 4, baseDelay: 1200 };
  await sendTest('user', ['TESTID1', new Date().toISOString(), 'test@example.com', '홍길동', 'Hong Gildong', 'nick'], opts);
  // small pacing between service tests to avoid bursts
  await sleep(800);
  await sendTest('cruise', ['CRU1', new Date().toISOString(), 'test@example.com', '홍길동', '2025-09-01', '2025-09-03'], opts);
  await sleep(800);
  await sendTest('car', ['CAR1', new Date().toISOString(), 'test@example.com', '홍길동', '서울', '인천공항'], opts);
  await sleep(800);
  await sendTest('airport', ['AP1', new Date().toISOString(), 'test@example.com', '홍길동', 'ICN', '도착'], opts);
}

runAll();
