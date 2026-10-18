# IELTS 리스닝 대본 → 사람 같은 음성 mp3 (Microsoft Edge 자연 음성, edge-tts)
# 브라우저 내장 음성은 크롬에서 로봇처럼 들려서, 미리 파일로 만들어 두고 재생한다.
#
# 준비(한 번):  python3 -m venv /tmp/ttsenv && /tmp/ttsenv/bin/pip install edge-tts   (ffmpeg 필요)
# 실행:        /tmp/ttsenv/bin/python scripts/ielts/make-audio.py            # 없는 섹션만 만듦
#              /tmp/ttsenv/bin/python scripts/ielts/make-audio.py L1-s2      # 특정 섹션만 다시
# 결과:        audio/ielts/<섹션id>.mp3 + js/ielts-audio.js (화면이 읽는 목록)
import asyncio, json, os, re, subprocess, sys, tempfile
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BANK = os.path.join(ROOT, 'js', 'ielts-bank.js')
OUT = os.path.join(ROOT, 'audio', 'ielts')
MANIFEST = os.path.join(ROOT, 'js', 'ielts-audio.js')

# 섹션별 화자 목소리 (대본에서 이름·역할 보고 정함). 없으면 아래 기본 규칙.
CAST = {
    'L1-s1': {'A': 'en-GB-SoniaNeural', 'B': 'en-AU-WilliamMultilingualNeural'},   # A = Helen(접수), B = 전화한 사람
    'L1-s2': {'A': 'en-GB-RyanNeural', 'B': 'en-AU-NatashaNeural'},
    'L1-s3': {'A': 'en-GB-ThomasNeural', 'B': 'en-AU-NatashaNeural', 'C': 'en-US-AndrewNeural'},  # A = Dr Wells
    'L1-s4': {'A': 'en-GB-LibbyNeural', 'B': 'en-AU-NatashaNeural'},
}
DEFAULT = {  # 언어별 (여, 남)
    'en-GB': ('en-GB-SoniaNeural', 'en-GB-RyanNeural'),
    'en-AU': ('en-AU-NatashaNeural', 'en-AU-WilliamMultilingualNeural'),
    'en-US': ('en-US-AvaNeural', 'en-US-AndrewNeural'),
    'en-IE': ('en-IE-EmilyNeural', 'en-IE-ConnorNeural'),
}
SPARE = {  # 같은 언어·성별 화자가 둘이면 쓰는 두 번째 목소리
    'en-GB': {'f': 'en-GB-LibbyNeural', 'm': 'en-GB-ThomasNeural'},
    'en-US': {'f': 'en-US-EmmaNeural', 'm': 'en-US-BrianNeural'},
}
PAUSE_LINE = 0.55   # 말 사이 쉼(초)
PAUSE_START = 1.0


def load_bank():
    src = open(BANK, encoding='utf-8').read()
    js = 'global.window={};' + src + ';process.stdout.write(JSON.stringify(window.IELTS_BANK.listening))'
    return json.loads(subprocess.check_output(['node', '-e', js]))


def cast_for(sec):
    c = dict(CAST.get(sec['id'], {}))
    used = set(c.values())
    for who, cfg in (sec.get('voices') or {}).items():
        if who in c:
            continue
        f, m = DEFAULT.get(cfg.get('lang', 'en-GB'), DEFAULT['en-GB'])
        # 은행에 g:'f'|'m'(성별)이 있으면 그걸, 없으면 음높이로 짐작
        female = cfg.get('g') == 'f' if cfg.get('g') in ('f', 'm') else (cfg.get('pitch') or 1) >= 1.1
        pick = f if female else m
        if pick in used:
            alt = SPARE.get(cfg.get('lang', 'en-GB'), {}).get('f' if female else 'm')
            pick = alt if alt and alt not in used else (m if pick == f else f)
        c[who] = pick
        used.add(pick)
    return c


def silence(path, sec):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', str(sec),
                    '-c:a', 'libmp3lame', '-b:a', '48k', path], check=True)


def duration(path):
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path])
    return float(out.strip() or 0)


async def make(sec):
    cast = cast_for(sec)
    rate = sec.get('voices', {}).get('A', {}).get('rate', 0.95)
    rate_pct = '%+d%%' % round((rate - 1) * 100)
    tmp = tempfile.mkdtemp(prefix='ielts-')
    gap, start = os.path.join(tmp, 'gap.mp3'), os.path.join(tmp, 'start.mp3')
    silence(gap, PAUSE_LINE); silence(start, PAUSE_START)
    parts, lines = [start], []
    t = PAUSE_START
    for i, line in enumerate(sec['script']):
        f = os.path.join(tmp, '%03d.mp3' % i)
        await edge_tts.Communicate(line['text'], cast[line['who']], rate=rate_pct).save(f)
        d = duration(f)
        lines.append({'who': line['who'], 't': round(t, 2)})   # 대본 줄이 시작하는 시각 — 스크립트 따라 읽기용
        t += d + PAUSE_LINE
        parts += [f, gap]
    lst = os.path.join(tmp, 'list.txt')
    with open(lst, 'w') as fh:
        for p in parts:
            fh.write("file '%s'\n" % p)
    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, sec['id'] + '.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst,
                    '-c:a', 'libmp3lame', '-b:a', '48k', '-ar', '24000', '-ac', '1', out], check=True)
    return {'file': 'audio/ielts/%s.mp3' % sec['id'], 'dur': round(duration(out), 1), 'cast': cast, 'lines': lines}


def main():
    secs = load_bank()
    only = set(sys.argv[1:])
    man = {}
    if os.path.exists(MANIFEST):
        m = re.search(r'window\.IELTS_AUDIO = (\{.*\});', open(MANIFEST, encoding='utf-8').read(), re.S)
        if m:
            man = json.loads(m.group(1))
    for s in secs:
        exists = os.path.exists(os.path.join(OUT, s['id'] + '.mp3')) and s['id'] in man
        if (only and s['id'] not in only) or (not only and exists):
            continue
        print('making', s['id'], '...', flush=True)
        man[s['id']] = asyncio.run(make(s))
        print('  ', man[s['id']]['dur'], 's', man[s['id']]['cast'])
    with open(MANIFEST, 'w', encoding='utf-8') as fh:
        fh.write('// IELTS 리스닝 음성 파일 목록 — scripts/ielts/make-audio.py 가 만든 파일 (손으로 고치지 말 것)\n')
        fh.write('window.IELTS_AUDIO = ' + json.dumps(man, ensure_ascii=False) + ';\n')
    print('sections', len(man))


if __name__ == '__main__':
    main()
