#!/usr/bin/python3
"""IELTS Writing/Speaking 자동 채점 — launchd(com.nuri.ielts-grade)가 5분마다 run.sh 로 부른다.

흐름: 누리 크롬에 열려 있는 아뜰리에 탭(로그인 상태)을 찾는다
  → 그 페이지의 db 로 Firestore `ieltsGrading` 의 status 'pending' 문서를 읽는다
  → 'grading' 표시 → claude -p (구독) 로 채점 → JSON 검증(실패 시 한 번 더)
  → result + status 'done' (또는 'error' + error) 를 같은 탭으로 써 넣는다.

크롬 AppleScript 의 javascript 는 격리된 자리에서 돌아 페이지 전역(db·firebase)이 안 보인다
→ <script> 를 주입해 페이지 쪽에서 실행하고, 결과는 <html data-ig…> 속성으로 받아 온다 (money/auto 와 같은 방식).
탭을 새로 열지 않는다: 아뜰리에 탭이 없거나 로그인이 풀려 있으면 로그만 남기고 조용히 끝.
"""
import base64, json, os, random, re, subprocess, sys, tempfile, time
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
LOG = os.path.expanduser('~/Library/Logs/ielts-grade.log')
COLL = 'ieltsGrading'
SITE = 'nury6942.github.io/the-atelier'
CLAUDE = os.environ.get('IG_CLAUDE') or next((p for p in [os.path.expanduser('~/.local/bin/claude'), '/opt/homebrew/bin/claude', '/usr/local/bin/claude'] if os.path.exists(p)), 'claude')
MODEL = os.environ.get('IG_MODEL', '')          # 비우면 구독 기본 모델
CLAUDE_TIMEOUT = 8 * 60
STUCK_MIN = 20                                  # 'grading' 이 이만큼 지나도 그대로면 다시 채점
MAX_PER_RUN = int(os.environ.get('IG_MAX', '4'))


def log(*a):
    with open(LOG, 'a') as f:
        f.write(datetime.now().strftime('%Y-%m-%d %H:%M:%S') + ' ' + ' '.join(str(x) for x in a) + '\n')


def now_iso():
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.') + '%03dZ' % (datetime.now().microsecond // 1000)


# ───────── Chrome ─────────
def osa(script, timeout=60):
    r = subprocess.run(['osascript', '-'], input=script, capture_output=True, text=True, timeout=timeout)
    if r.returncode != 0:
        raise RuntimeError('osascript: ' + r.stderr.strip()[:300])
    return r.stdout.rstrip('\n')


def chrome_running():
    return subprocess.run(['pgrep', '-xq', 'Google Chrome']).returncode == 0


def atelier_tabs():
    out = osa('''tell application "Google Chrome"
  set out to ""
  repeat with w in windows
    repeat with t in tabs of w
      if URL of t contains "%s" then set out to out & (id of t as string) & "|" & (URL of t) & linefeed
    end repeat
  end repeat
  return out
end tell''' % SITE)
    tabs = [l.split('|', 1) for l in out.splitlines() if '|' in l]
    # index 페이지(app 본체) 를 먼저
    tabs.sort(key=lambda x: 0 if re.search(r'the-atelier/?(\?|#|$)|index\.html', x[1]) else 1)
    return [t[0] for t in tabs]


class Tab:
    def __init__(self, tid):
        self.tid = tid

    def exec_iso(self, code, timeout=60):
        """격리된 자리에서 code 실행, 반환 문자열."""
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
            f.write(code)
            path = f.name
        try:
            return osa('''tell application "Google Chrome"
  repeat with w in windows
    repeat with t in tabs of w
      if (id of t as string) is "%s" then return execute t javascript (read POSIX file "%s" as «class utf8»)
    end repeat
  end repeat
  return "__tab_gone__"
end tell''' % (self.tid, path), timeout)
        finally:
            os.unlink(path)

    def page(self, body, timeout=60):
        """페이지 전역에서 async body 실행 → JSON 결과. body 는 return 으로 값을 돌려준다."""
        key = 'ig%d' % random.randint(10**8, 10**9)
        src = ("(async()=>{var o;try{var r=await (async()=>{%s})();o=JSON.stringify({ok:true,r:r===undefined?null:r});}"
               "catch(e){o=JSON.stringify({ok:false,e:String(e&&e.message||e)});}"
               "document.documentElement.dataset[%s]=o;})();") % (body, json.dumps(key))
        inject = ("(function(){var s=document.createElement('script');s.textContent=%s;"
                  "document.documentElement.appendChild(s);s.remove();return 'ok';})()") % json.dumps(src)
        r = self.exec_iso(inject)
        if r == '__tab_gone__':
            raise RuntimeError('tab gone')
        poll = ("(function(){var d=document.documentElement.dataset,v=d[%s];if(v!=null){delete d[%s];return v;}return '';})()"
                % (json.dumps(key), json.dumps(key)))
        t0 = time.time()
        while time.time() - t0 < timeout:
            v = self.exec_iso(poll)
            if v == '__tab_gone__':
                raise RuntimeError('tab gone')
            if v:
                res = json.loads(v)
                if not res.get('ok'):
                    raise RuntimeError('page: ' + res.get('e', '?'))
                return res.get('r')
            time.sleep(0.4)
        raise RuntimeError('page timeout')


def b64json(obj):
    return base64.b64encode(json.dumps(obj, ensure_ascii=False).encode('utf-8')).decode('ascii')


# 페이지 쪽 base64(UTF-8) → 객체
DEC = "var __d=function(b){return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b),c=>c.charCodeAt(0))));};"

READY = ("return (typeof db!=='undefined'&&typeof firebase!=='undefined'&&firebase.auth&&firebase.auth().currentUser)"
         "?(firebase.auth().currentUser.email||'yes'):'no';")


def find_ready_tab():
    for tid in atelier_tabs():
        t = Tab(tid)
        try:
            if t.page(READY, 15) not in ('no', None):
                return t
        except Exception as e:
            log('tab', tid, 'not usable:', e)
    return None


def fetch_jobs(tab):
    body = ("var c=db.collection(%s),out=[];"
            "var a=await c.where('status','==','pending').get();a.forEach(d=>out.push(Object.assign({_id:d.id},d.data())));"
            "var g=await c.where('status','==','grading').get();var lim=Date.now()-%d*60000;"
            "g.forEach(d=>{var x=d.data();var t=Date.parse(x.gradingAt||x.createdAt||0)||0;if(t<lim)out.push(Object.assign({_id:d.id},x));});"
            "out.sort((p,q)=>String(p.createdAt||'').localeCompare(String(q.createdAt||'')));"
            "return out.map(x=>({_id:x._id,kind:x.kind,task:x.task,part:x.part,prompt:x.prompt,text:x.text,words:x.words,secs:x.secs}));"
            ) % (json.dumps(COLL), STUCK_MIN)
    return tab.page(body, 60) or []


def update_doc(tab, doc_id, data):
    body = DEC + "await db.collection(%s).doc(%s).update(__d(%s));return 'ok';" % (json.dumps(COLL), json.dumps(doc_id), json.dumps(b64json(data)))
    return tab.page(body, 60)


# ───────── 채점 ─────────
def build_prompt(job):
    tpl = open(os.path.join(HERE, 'prompt.md'), encoding='utf-8').read()
    kind = job.get('kind')
    text = (job.get('text') or '').strip()
    words = job.get('words') or len(re.findall(r"[A-Za-z0-9'’-]+", text))
    if kind == 'speaking':
        part = int(job.get('part') or 1)
        keys = [('FC', 'Fluency and Coherence'), ('LR', 'Lexical Resource'), ('GRA', 'Grammatical Range and Accuracy'), ('P', 'Pronunciation')]
        rules = ("This is IELTS Speaking Part %d. ONLY a speech-to-text transcript exists — no audio. "
                 "Judge FC from length of turns, discourse markers, coherence, repetition/self-correction and filler visible in the transcript"
                 "%s. Estimate P conservatively (never above the FC band, and usually 0.5 lower when evidence is thin) and say so in its 'why'. "
                 "Short, underdeveloped answers limit FC and LR. Transcription artefacts (missing punctuation, homophones) are NOT grammar errors." %
                 (part, ', and the speaking time (%s seconds; Part 2 should reach close to 2 minutes)' % job['secs'] if job.get('secs') else ''))
        module = 'Speaking band descriptors (public version)'
        label = 'IELTS Speaking Part %d' % part
        note_rule = '받아쓰기 기반이라 발음(P)은 추정이라는 점을 한 줄로.'
        rewrite_hint = 'natural spoken English, same length range as a strong answer for this part'
        len_info = '%d words%s' % (words, ', %d seconds' % job['secs'] if job.get('secs') else '')
    else:
        task = int(job.get('task') or 2)
        first = ('TA', 'Task Achievement') if task == 1 else ('TR', 'Task Response')
        keys = [first, ('CC', 'Coherence and Cohesion'), ('LR', 'Lexical Resource'), ('GRA', 'Grammatical Range and Accuracy')]
        minw = 150 if task == 1 else 250
        if task == 1:
            rules = ("This is General Training Writing Task 1 (a letter, minimum 150 words). TA: are all three bullet points covered and extended, "
                     "is the purpose clear, is the tone/register appropriate and consistent for the recipient, is the letter format right. ")
        else:
            rules = ("This is Writing Task 2 (an essay, minimum 250 words). TR: is every part of the question answered, is a clear position held "
                     "throughout, are ideas extended and supported. ")
        rules += ("The response has %d words (minimum %d). %s" % (
            words, minw, 'It is UNDER LENGTH: penalise %s as the descriptors require.' % first[0] if words < minw else 'Length is sufficient.'))
        module = 'Writing band descriptors, %s (public version)' % ('General Training Task 1' if task == 1 else 'Task 2')
        label = 'IELTS General Training Writing Task %d' % task
        note_rule = '빈 문자열 "" 로 둔다.'
        rewrite_hint = 'at least %d words, same format' % minw
        len_info = '%d words' % words
    shape = ',\n'.join('    {"k": "%s", "name": "%s", "band": 6.0, "why": "한국어 1–2줄", "quotes": ["exact sentence from the text that limits this score"]}' % k for k in keys)
    rep = {
        '{{MODULE}}': module, '{{CRITERIA_RULES}}': rules + ' Give exactly these 4 criteria in this order: ' + ', '.join('%s (%s)' % k for k in keys) + '.',
        '{{OVERALL_RULE}}': ('the mean of the 4 criteria rounded to the nearest 0.5 (x.25 rounds up to x.5, x.75 rounds up to the next whole band).'),
        '{{REWRITE_HINT}}': rewrite_hint, '{{NOTE_RULE}}': note_rule, '{{CRITERIA_SHAPE}}': shape,
        '{{TASK_LABEL}}': label, '{{PROMPT}}': (job.get('prompt') or '(not given)').strip(), '{{LEN_INFO}}': len_info, '{{TEXT}}': text,
    }
    for k, v in rep.items():
        tpl = tpl.replace(k, v)
    return tpl, [k[0] for k in keys]


def run_claude(prompt):
    args = [CLAUDE, '-p', '--output-format', 'text', '--tools', '', '--strict-mcp-config']
    if MODEL:
        args += ['--model', MODEL]
    env = dict(os.environ)
    env['PATH'] = os.path.dirname(CLAUDE) + ':/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:' + env.get('PATH', '')
    for extra in (None, os.path.expanduser('~/.claude-work')):
        e = dict(env)
        if extra:
            e['CLAUDE_CONFIG_DIR'] = extra
            log('claude -p 실패 → ~/.claude-work 로 재시도')
        r = subprocess.run(args, input=prompt, capture_output=True, text=True, timeout=CLAUDE_TIMEOUT, env=e, cwd=HERE)
        if r.returncode == 0 and r.stdout.strip():
            return r.stdout
        last = 'exit %d: %s' % (r.returncode, (r.stderr or r.stdout).strip()[:300])
        if r.returncode != 1:
            break
    raise RuntimeError('claude -p ' + last)


def half(x):
    x = max(0.0, min(9.0, float(x)))
    return round(x * 2) / 2


def parse_validate(raw, keys, text):
    s = raw.strip()
    s = re.sub(r'^```(?:json)?\s*|\s*```$', '', s)
    i, j = s.find('{'), s.rfind('}')
    if i < 0 or j <= i:
        raise ValueError('JSON 없음')
    o = json.loads(s[i:j + 1])
    crit = o.get('criteria')
    if not isinstance(crit, list) or len(crit) != 4:
        raise ValueError('criteria 4개 아님')
    out_c = []
    for c, k in zip(crit, keys):
        if not isinstance(c, dict) or 'band' not in c:
            raise ValueError('criterion 형식')
        out_c.append({'k': str(c.get('k') or k), 'name': str(c.get('name') or k), 'band': half(c['band']),
                      'why': str(c.get('why') or ''), 'quotes': [str(q) for q in (c.get('quotes') or []) if isinstance(q, str)][:3]})
    mean = sum(c['band'] for c in out_c) / 4
    # 공식 반올림: .25 → .5, .75 → 다음 정수
    frac = mean - int(mean)
    band = int(mean) + (0 if frac < 0.25 else 0.5 if frac < 0.75 else 1)
    errs = []
    for e in (o.get('errors') or []):
        if isinstance(e, dict) and e.get('wrong') and e.get('right') is not None:
            errs.append({'wrong': str(e['wrong']), 'right': str(e['right']), 'type': str(e.get('type') or '기타'), 'ko': str(e.get('ko') or '')})
    ups = [{'from': str(u.get('from', '')), 'to': str(u.get('to', ''))} for u in (o.get('upgrades') or []) if isinstance(u, dict) and u.get('from')]
    nxt = [str(x) for x in (o.get('next') or []) if x][:5]
    rw = str(o.get('rewrite') or '')
    if not rw or not nxt:
        raise ValueError('rewrite/next 비어 있음')
    found = sum(1 for e in errs if e['wrong'] in text)
    return {'band': float(band), 'criteria': out_c, 'errors': errs[:20], 'rewrite': rw, 'upgrades': ups[:10],
            'next': nxt, 'note': str(o.get('note') or '')}, (found, len(errs))


def grade(job):
    prompt, keys = build_prompt(job)
    text = job.get('text') or ''
    last = None
    for attempt in range(2):
        p = prompt if attempt == 0 else prompt + '\n\nYour previous reply was rejected (%s). Reply again with the single valid JSON object only.' % last
        raw = run_claude(p)
        try:
            res, (found, n) = parse_validate(raw, keys, text)
            log('  parsed: band', res['band'], 'errors matched %d/%d' % (found, n))
            return res
        except Exception as e:
            last = str(e)[:120]
            log('  invalid JSON (attempt %d): %s' % (attempt + 1, last))
    raise RuntimeError('채점 결과 형식 오류: ' + str(last))


def main():
    if not chrome_running():
        log('skip: Chrome 꺼져 있음'); return 0
    try:
        tab = find_ready_tab()
    except Exception as e:
        log('skip: 크롬 탭 확인 실패 —', e, '(크롬 > 보기 > 개발자 > Apple Events의 JavaScript 허용 확인)'); return 0
    if not tab:
        log('skip: 로그인된 아뜰리에 탭 없음'); return 0
    jobs = fetch_jobs(tab)
    if not jobs:
        return 0
    log('pending %d' % len(jobs))
    for job in jobs[:MAX_PER_RUN]:
        jid = job['_id']
        if not (job.get('text') or '').strip():
            update_doc(tab, jid, {'status': 'error', 'error': '채점할 글이 비어 있어요', 'gradedAt': now_iso()}); continue
        update_doc(tab, jid, {'status': 'grading', 'gradingAt': now_iso(), 'error': firebase_delete()})
        t0 = time.time()
        log('grade', jid, job.get('kind'), job.get('task') or job.get('part'), '%s words' % job.get('words'))
        try:
            res = grade(job)
            secs = round(time.time() - t0)
            update_doc(tab, jid, {'status': 'done', 'result': res, 'gradedAt': now_iso(), 'gradeSecs': secs})
            log('done', jid, 'band', res['band'], '%ds' % secs)
        except Exception as e:
            log('error', jid, e)
            try:
                update_doc(tab, jid, {'status': 'error', 'error': str(e)[:300], 'gradedAt': now_iso()})
            except Exception as e2:
                log('  error write failed', e2)
    return 0


def firebase_delete():
    # update() 에서 '없음' 으로 둘 값 — 빈 문자열로 덮는다 (FieldValue 는 JSON 으로 못 넘김)
    return ''


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as e:
        log('FATAL', repr(e)); sys.exit(1)
