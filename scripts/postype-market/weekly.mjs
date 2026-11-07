#!/usr/bin/env node
// 월·목 아침 한 번: 수집 → 분석 → 분석 글 → Firestore 게시. launchd com.nuri.atelier-postype-market 가 run.sh 로 부른다.
//  - 그달 첫 실행이면 13개월 전체 다시 받기(full), 아니면 최근 60일만 받아 지난 결과 위에 덮기(증분)
//  - 결과 폴더 ~/postype-market-data/<날짜>/, 마지막 성공은 ~/postype-market-data/current (심볼릭 링크)
//  - 포스타입이 막으면(429/403) 멈추고 맥 알림. 같은 날 다시 돌리면 state.json 에서 이어감
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(os.homedir(), 'postype-market-data');
const NODE = process.execPath;
const log = (...a) => console.log(new Date().toISOString().slice(0, 19), '[market]', ...a);
const notify = (msg) => { try { execFileSync('osascript', ['-e', `display notification "${msg.replace(/"/g, "'")}" with title "Postype Market"`]); } catch (e) {} };
const kst = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
const addDays = (s, n) => kst(new Date(Date.parse(s + 'T00:00:00+09:00') + n * 86400e3));

const today = kst();
const OUT = path.join(ROOT, today);
const CUR = path.join(ROOT, 'current');
const curDir = fs.existsSync(CUR) ? fs.realpathSync(CUR) : null;
const curMeta = curDir && fs.existsSync(path.join(curDir, 'meta.json')) ? JSON.parse(fs.readFileSync(path.join(curDir, 'meta.json'), 'utf8')) : null;
const keepFrom = (() => { const [y, m] = today.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 - 12, 1)); return d.toISOString().slice(0, 10); })();
const full = !curMeta || (curMeta.collectedAt || '').slice(0, 7) !== today.slice(0, 7) || process.argv.includes('--full');

const run = (args, label) => {
  log('▶', label);
  const r = spawnSync(NODE, args, { stdio: 'inherit', cwd: path.join(HERE, '..', '..') });
  if (r.status !== 0) throw Object.assign(new Error(label + ' 실패 (종료 ' + r.status + ')'), { code: r.status });
};

try {
  fs.mkdirSync(OUT, { recursive: true });
  const resuming = fs.existsSync(path.join(OUT, 'state.json')) && !fs.existsSync(path.join(OUT, 'market.json'));
  const args = [path.join(HERE, 'collect.mjs'), '--out', OUT];
  if (!resuming) {
    if (full) args.push('--from', keepFrom, '--to', today, '--kw', '나페스');
    else args.push('--from', addDays(today, -60), '--to', today, '--kw', '나페스', '--seed', curDir, '--keepFrom', keepFrom, '--topSeries', '500', '--topChannels', '600');
  }
  log(resuming ? '이어하기' : full ? `전체 수집 ${keepFrom}~${today}` : `증분 수집 최근 60일 + 지난 결과(${path.basename(curDir)})`);
  try { run(args, '수집'); }
  catch (e) { if (e.code === 3) { notify('포스타입이 요청을 막았어요. 다음 실행 때 이어서 받아요.'); } throw e; }

  // 기간 표시는 보관 범위 전체로
  const mp = path.join(OUT, 'meta.json'); const meta = JSON.parse(fs.readFileSync(mp, 'utf8'));
  meta.from = keepFrom; meta.to = today; meta.mode = full ? 'full' : 'incremental'; fs.writeFileSync(mp, JSON.stringify(meta));

  run([path.join(HERE, 'analyze.mjs'), OUT], '분석');
  // 지난 분석 글을 넘겨서 '달라진 점'을 쓰게
  if (curDir && fs.existsSync(path.join(curDir, 'insights.json')) && curDir !== OUT) {
    const mk = path.join(OUT, 'market.json'); const D = JSON.parse(fs.readFileSync(mk, 'utf8'));
    D.prevInsights = JSON.parse(fs.readFileSync(path.join(curDir, 'insights.json'), 'utf8')); fs.writeFileSync(mk, JSON.stringify(D));
  }
  run([path.join(HERE, 'insights.mjs'), OUT], '분석 글');
  run([path.join(HERE, 'publish.mjs'), OUT], '게시');

  try { fs.unlinkSync(CUR); } catch (e) {}
  fs.symlinkSync(OUT, CUR);
  // 오래된 결과 정리 (최근 6개만, state.json 은 크니 지난 것부터 지움)
  const dirs = fs.readdirSync(ROOT).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  for (const d of dirs.slice(0, -1)) try { fs.unlinkSync(path.join(ROOT, d, 'state.json')); } catch (e) {}
  for (const d of dirs.slice(0, -6)) fs.rmSync(path.join(ROOT, d), { recursive: true, force: true });
  log('끝', OUT);
} catch (e) {
  log('실패:', e.message);
  if (e.code !== 3) notify('갱신 실패: ' + e.message.slice(0, 80));
  process.exit(1);
}
