#!/usr/bin/env node
// 포스타입 매출 → atelier 매일 자동 동기화 — 전용 크롬 프로필 헤드리스 러너 (2026-10-18)
//
//  누리 크롬을 AppleScript로 조종하던 run-chrome.sh 를 대신한다. 누리 크롬이 오래 켜져
//  꼬이면(AppleEvent -1712) 동기화가 멈췄기 때문에, 이제는 전용 프로필
//  (~/Library/Application Support/atelier-postype/profile) 로 크롬을 따로 띄운다.
//
//  1. 전용 프로필 크롬(화면 없음)으로 포스타입 수익 페이지를 연다
//  2. GitHub 의 scripts/postype-bookmarklet.js 를 자동 모드로 실행 (북마클릿과 똑같은 코드)
//     → 북마클릿이 atelier 탭을 열어 postMessage 로 넘기고, atelier 가 Firestore 에 저장
//  3. <html data-atelier-sync> 상태를 읽어 끝나면 로그·성공 표식·알림
//
//  처음 한 번 (또는 로그인 풀림 알림이 오면):  node run.js --login
//    → 전용 프로필 크롬 창이 뜬다. 포스타입 로그인 + atelier 구글 로그인을 직접 하고 창을 닫는다.
//  지금 한 번 돌리기: launchctl kickstart gui/$(id -u)/com.nuri.atelier-postype
//  설치: scripts/postype-auto/install.sh   로그: ~/Library/Logs/atelier-postype.log

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

const DIR = path.join(os.homedir(), 'Library/Application Support/atelier-postype');
const PROFILE = path.join(DIR, 'profile');
const STAMP = path.join(DIR, 'last-success');
const LOG = path.join(os.homedir(), 'Library/Logs/atelier-postype.log');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'https://www.postype.com/point/earnings/list';
const ATELIER = 'https://nury6942.github.io/the-atelier/';
const SRC = 'https://raw.githubusercontent.com/nury6942/the-atelier/main/scripts/postype-bookmarklet.js';

const pad = n => String(n).padStart(2, '0');
const now = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
const today = () => now().slice(0, 10);
const log = (...a) => fs.appendFileSync(LOG, `${now()} ${a.join(' ')}\n`);
const notify = msg => { try { execFileSync('osascript', ['-e', `display notification "${msg}" with title "atelier 포스타입 동기화"`]); } catch (e) {} };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── --login: 전용 프로필로 진짜 크롬 창을 띄운다 (자동화 표시 없이 → 구글 로그인도 막히지 않음)
//  --use-mock-keychain 은 헤드리스 실행(playwright 기본값)과 쿠키 암호화 방식을 맞추려고 넣는다.
function login() {
  fs.mkdirSync(PROFILE, { recursive: true });
  spawn(CHROME, [
    `--user-data-dir=${PROFILE}`, '--use-mock-keychain', '--no-first-run', '--no-default-browser-check',
    URL, ATELIER,
  ], { detached: true, stdio: 'ignore' }).unref();
  console.log('전용 크롬 창을 띄웠어요.');
  console.log(' 1) 첫 탭: 포스타입 로그인');
  console.log(' 2) 둘째 탭: atelier 구글 로그인');
  console.log('둘 다 끝나면 그 창을 닫아 주세요 (⌘Q). 다음 09:30부터 이 프로필로 돌아갑니다.');
}

async function run(force) {
  fs.mkdirSync(DIR, { recursive: true });
  // 같은 날 이미 성공했으면 건너뜀 (잠자다 깨서 두 번 불려도 한 번만)
  if (!force) { try { if (fs.readFileSync(STAMP, 'utf8').trim() === today()) return; } catch (e) {} }
  if (!fs.existsSync(PROFILE)) {
    log('LOGIN 전용 프로필 없음 — node run.js --login 필요');
    notify('처음 한 번 로그인이 필요해요 (node run.js --login)');
    return;
  }

  const { chromium } = require('playwright-core');
  let ctx;
  try {
    ctx = await chromium.launchPersistentContext(PROFILE, {
      executablePath: CHROME,
      headless: true,
      args: ['--no-first-run', '--no-default-browser-check'],
      ignoreDefaultArgs: ['--enable-automation'],
      // 헤드리스 UA 에는 "HeadlessChrome" 이 들어가 사이트가 다르게 굴 수 있어 일반 크롬 UA 로
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36',
      viewport: { width: 1200, height: 900 },
    });
  } catch (e) {
    // 같은 프로필 크롬 창(--login)이 아직 열려 있으면 여기서 실패한다
    log('FAIL 전용 크롬을 띄우지 못함:', (e.message || '').split('\n')[0]);
    notify('전용 크롬을 띄우지 못했어요 — 로그인 창이 열려 있으면 닫아 주세요');
    process.exitCode = 1;
    return;
  }

  let state = '';
  try {
    const page = ctx.pages()[0] || await ctx.newPage();
    await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
    await sleep(2000);
    log('page', page.url());
    await page.evaluate(src => {
      document.documentElement.dataset.atelierSync = '';
      fetch(src + '?t=' + Date.now()).then(r => r.text()).then(s => { window.__ATELIER_POSTYPE_AUTO = {}; (0, eval)(s); })
        .catch(e => { document.documentElement.dataset.atelierSync = JSON.stringify({ state: 'error', reason: 'load', message: e.message }); });
    }, SRC);

    // 상태 읽기 (최대 8분)
    for (let i = 0; i < 96; i++) {
      await sleep(5000);
      state = await page.evaluate(() => document.documentElement.dataset.atelierSync || '').catch(() => 'tab-gone');
      if (/"state":"(done|error)"/.test(state) || state === 'tab-gone') break;
    }
    // atelier 탭이 로그아웃 상태면 저장 못 하고 atelier-timeout 이 난다 → 원인을 로그에 남긴다
    if (/"reason":"atelier-timeout"/.test(state)) {
      for (const p of ctx.pages()) {
        if (!p.url().includes('nury6942.github.io')) continue;
        const loginShown = await p.evaluate(() => { const el = document.getElementById('login-screen'); return !!el && getComputedStyle(el).display !== 'none'; }).catch(() => false);
        if (loginShown) state = state.replace('"atelier-timeout"', '"atelier-login"');
      }
    }
  } catch (e) {
    state = state || JSON.stringify({ state: 'error', reason: 'runner', message: (e.message || '').split('\n')[0] });
  } finally {
    await ctx.close().catch(() => {});
  }

  if (/"state":"done"/.test(state)) {
    log('OK', state); fs.writeFileSync(STAMP, today() + '\n');
  } else if (/"reason":"login"/.test(state)) {
    log('LOGIN', state); notify('포스타입 로그인이 풀렸어요. 터미널에서 run.js --login 으로 다시 로그인해 주세요');
  } else if (/"reason":"atelier-login"/.test(state)) {
    log('LOGIN', state); notify('atelier 구글 로그인이 풀렸어요. 터미널에서 run.js --login 으로 다시 로그인해 주세요');
  } else {
    log('FAIL', state || 'timeout'); notify('동기화 실패 — 내일 다시 시도해요 (로그: ~/Library/Logs/atelier-postype.log)');
    process.exitCode = 1;
  }
}

const argv = process.argv.slice(2);
if (argv.includes('--login')) login();
else run(argv.includes('--force')).catch(e => { log('FAIL', e.stack || e.message); process.exitCode = 1; });
