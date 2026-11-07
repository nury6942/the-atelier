// 나페스 인물 사전 — 정식 이름: [그룹, 별칭...]
// 별칭이 여러 사람과 겹치면(재현·선우 등) CONTEXT 로 그룹 태그를 보고 고른다.
export const GROUP_TAGS = {
  'NCT': ['공공즈', '도재정', '엔시티', 'nct', 'NCT', '엔시티127', '127', 'nct127', '엔시티드림', '드림즈', 'nctdream', '웨이션브이', 'wayv'],
  'NCT WISH': ['위시나페스', '위시', '엔시티위시', 'nctwish', 'NCTWISH', '엔위시', 'wish'],
  'BOYNEXTDOOR': ['보넥도수위', '보넥도', '보이넥스트도어', 'boynextdoor'],
  'RIIZE': ['라이즈', 'riize'],
  'ATEEZ': ['에이티즈', 'ateez'],
  'ENHYPEN': ['엔하이픈', 'enhypen'],
  'CORTIS': ['코르티스', 'cortis'],
  'DAY6': ['데이식스', 'day6'],
  'BTS': ['방탄나페스', '방탄빙의글', '방탄소년단', '방탄', 'bts', 'BTS'],
  'TWS': ['투어스', 'tws'],
  'EXO': ['엑소', 'exo'],
  'TXT': ['투바투', '투모로우바이투게더', 'txt'],
  'SEVENTEEN': ['세븐틴', 'svt'],
  'THE BOYZ': ['더보이즈', 'tbz'],
  'CRAVITY': ['크래비티'],
  'ZEROBASEONE': ['제베원', '제로베이스원', '제베원나페스', '앤더블'],
  'MONSTA X': ['몬스타엑스', '몬엑'],
  'KickFlip': ['킥플립', '킥페스'],
  'ALPHA DRIVE ONE': ['알디원', '알파드라이브원'],
  '&TEAM': ['앤팀', '&team'],
  'Stray Kids': ['스트레이키즈', '스키즈'],
  'TREASURE': ['트레저'],
  'SHINee': ['샤이니'],
  'BIGBANG': ['빅뱅'],
  'Wanna One': ['워너원'],
};

export const PEOPLE = {
  // NCT
  '정재현': ['NCT', '재현', '정윤오', '윤오'], '김도영': ['NCT', '도영'], '이태용': ['NCT', '태용'], '나카모토 유타': ['NCT', '유타'],
  '이마크': ['NCT', '마크', '이민형', '민형'], '이동혁': ['NCT', '해찬', '이해찬', '동혁'], '나재민': ['NCT', '재민'], '이제노': ['NCT', '제노'],
  '황인준': ['NCT', '런쥔', '인준'], '종천러': ['NCT', '천러'], '박지성': ['NCT', '지성'], '김정우': ['NCT', '정우'], '서영호': ['NCT', '쟈니', '영호', '서쟈니'],
  '텐': ['NCT'], '쿤': ['NCT'], '양양': ['NCT'], '샤오쥔': ['NCT'], '헨드리': ['NCT'], '문태일': ['NCT', '태일'], '김동영': ['NCT', '도영이'],
  // NCT WISH
  '리쿠': ['NCT WISH', '마에다리쿠', '마에다 리쿠', '마에다'], '유우시': ['NCT WISH', '토쿠노유우시', '토쿠노 유우시', '토쿠노'], '사쿠야': ['NCT WISH', '후지나가사쿠야'],
  '오시온': ['NCT WISH', '시온'], '김재희': ['NCT WISH', '재희'], '히로세 료': ['NCT WISH', '료', '히로세료', '히로세'], '김대영': ['NCT WISH', '대영'],
  // BOYNEXTDOOR
  '명재현': ['BOYNEXTDOOR'], '한태산': ['BOYNEXTDOOR', '태산'], '이한': ['BOYNEXTDOOR', '김동현', '김이한'], '김운학': ['BOYNEXTDOOR', '운학'], '박성호': ['BOYNEXTDOOR', '성호'], '리우': ['BOYNEXTDOOR', '이상혁', '이리우'],
  // RIIZE
  '쇼타로': ['RIIZE'], '송은석': ['RIIZE', '은석'], '정성찬': ['RIIZE', '성찬'], '박원빈': ['RIIZE', '원빈'], '소희': ['RIIZE', '이소희'], '앤톤': ['RIIZE', '이찬영', '찬영'],
  // ATEEZ
  '김홍중': ['ATEEZ', '홍중'], '박성화': ['ATEEZ', '성화'], '정윤호': ['ATEEZ', '윤호'], '강여상': ['ATEEZ', '여상'], '최산': ['ATEEZ', '산'], '송민기': ['ATEEZ', '민기'], '정우영': ['ATEEZ', '우영'], '최종호': ['ATEEZ', '종호'],
  // ENHYPEN
  '양정원': ['ENHYPEN', '정원'], '이희승': ['ENHYPEN', '희승'], '박종성': ['ENHYPEN', '제이'], '심재윤': ['ENHYPEN', '제이크'], '박성훈': ['ENHYPEN', '성훈'], '김선우': ['ENHYPEN', '선우'], '니키': ['ENHYPEN'],
  // CORTIS
  '마틴': ['CORTIS'], '제임스': ['CORTIS'], '김주훈': ['CORTIS', '주훈'], '엄성현': ['CORTIS', '성현'], '안건호': ['CORTIS', '건호'],
  // DAY6
  '박성진': ['DAY6', '성진'], '강영현': ['DAY6', '영케이'], '김원필': ['DAY6', '원필'], '윤도운': ['DAY6', '도운'],
  // BTS
  '김석진': ['BTS', '석진', '진'], '민윤기': ['BTS', '슈가', '윤기'], '정호석': ['BTS', '제이홉', '호석'], '김남준': ['BTS', '알엠', '남준'], '박지민': ['BTS', '지민'], '김태형': ['BTS', '뷔', '태형'], '전정국': ['BTS', '정국'],
  // TWS
  '신유': ['TWS', '신정환'], '도훈': ['TWS', '김도훈'], '영재': ['TWS', '최영재'], '한진': ['TWS'], '한지훈': ['TWS'], '경민': ['TWS'],
  // EXO
  '변백현': ['EXO', '백현'], '도경수': ['EXO', '디오', '경수'], '박찬열': ['EXO', '찬열'], '김종인': ['EXO', '카이'], '오세훈': ['EXO', '세훈'], '김민석': ['EXO', '시우민'], '김준면': ['EXO', '수호'],
  // TXT
  '최범규': ['TXT', '범규'], '최연준': ['TXT', '연준'], '최수빈': ['TXT', '수빈'], '강태현': ['TXT', '태현'], '휴닝카이': ['TXT'],
  // SEVENTEEN
  '권순영': ['SEVENTEEN', '호시'], '최승철': ['SEVENTEEN', '에스쿱스'], '윤정한': ['SEVENTEEN', '정한'], '홍지수': ['SEVENTEEN', '조슈아'], '문준휘': ['SEVENTEEN', '준'], '전원우': ['SEVENTEEN', '원우'], '이지훈': ['SEVENTEEN', '우지'], '서명호': ['SEVENTEEN', '디에잇'], '김민규': ['SEVENTEEN', '민규'], '이석민': ['SEVENTEEN', '도겸'], '부승관': ['SEVENTEEN', '승관'], '최한솔': ['SEVENTEEN', '버논'], '이찬': ['SEVENTEEN', '디노'],
  // THE BOYZ
  '이재현': ['THE BOYZ', '현재'], '이주연': ['THE BOYZ', '주연'], '김영훈': ['THE BOYZ', '영훈'],
  // MONSTA X · ZB1 · KickFlip · ALPHA DRIVE ONE · &TEAM
  '채형원': ['MONSTA X', '형원'], '유기현': ['MONSTA X', '기현'], '임창균': ['MONSTA X', '아이엠'],
  '한유진': ['ZEROBASEONE', '유진'], '김규빈': ['ZEROBASEONE', '규빈'], '성한빈': ['ZEROBASEONE', '한빈'], '박건욱': ['ZEROBASEONE', '건욱'], '장하오': ['ZEROBASEONE'],
  '이계훈': ['KickFlip', '계훈'], '이동화': ['KickFlip', '동화'], '이동현': ['KickFlip', '동현'], '케이주': ['KickFlip'],
  '김건우': ['ALPHA DRIVE ONE', '건우'], '이상원': ['ALPHA DRIVE ONE', '상원'],
  '쿄카': ['기타 (GL)', '쿗사'], '니콜라스': ['&TEAM'],
  // 기타 아이돌
  '박지훈': ['Wanna One'], '배진영': ['Wanna One'],
  // 배우·캐릭터·스포츠 (그룹 칸에 분야)
  '금성제': ['캐릭터·배우'], '한수강': ['캐릭터·배우'], '최부용': ['캐릭터·배우'], '연시은': ['캐릭터·배우'], '안수호': ['캐릭터·배우'], '주성철': ['캐릭터·배우'], '김상혁': ['캐릭터·배우'], '차세계': ['캐릭터·배우'],
  '손종원': ['셰프·방송인'], '이준영': ['캐릭터·배우'], '허남준': ['캐릭터·배우'], '이준혁': ['캐릭터·배우'], '한동민': ['캐릭터·배우'],
  '손흥민': ['스포츠'], '김연경': ['스포츠'], '백승호': ['스포츠'], '배준호': ['스포츠'], '이강인': ['스포츠'], '김민재': ['스포츠'],
};

// 같은 별칭이 여러 사람일 때: 그룹 태그가 있으면 그 그룹 사람으로
export const CONTEXT = {
  '재현': { 'BOYNEXTDOOR': '명재현', 'THE BOYZ': '이재현', default: '정재현' },
  '선우': { 'THE BOYZ': '김선우', default: '김선우' },
  '지훈': { 'Wanna One': '박지훈', 'SEVENTEEN': '이지훈', 'TWS': '한지훈', default: '한지훈' },
  '성호': { default: '박성호' },
  '지성': { default: '박지성' },
};

// 인물로 세지 않을 흔한 태그
export const NOT_PEOPLE = new Set(['나페스', '팬창작', '노딱', '고수위', '유사', '드림', '단편', '센티넬', 'talk', '홍일점', '유사연애', '수위', '로맨스', '사주', '사주풀이', '19금', '빙의글', '판타지', '호러', '집착', '웹소설', 'gl', '꾸금', '후회물', '가이드', '연애', '약한영웅', '야설', '소설', 'nps', '연애사주풀이', '조직물', '혐관', '추천', '혼성그룹', '아이돌', '디스토피아', '남공남수', '순애남', '동거', '성인', '수인물', '축페스', '축패스', '월드컵', '느와르', '남장', 'bl', 'BL', '19', '잠따', '빻취', '환승연애', '케이크버스', '사극', '수인', '궁합', '체벌', '연예계', '자공자수', '도리벤', '기억상실증', '알페스', '감금', '키스', '쌍방구원', '의사', '고르기', '훈육', '메디컬로코', '범죄도시', '온리유', '리얼물', '남매물', '연하', '무료', '호그와트물', '로얄로더', '남사친', '초능력', '피폐', '역하렘', '센가물', '엔시티나페스', '엔시티나페스추천', '역하렘물', '빙의물', '회귀', '오메가버스', '조직', '학원물', '캠퍼스물', '계약연애', '짝사랑', '후회', '광공', '피폐물', '헌터물', '가출시리즈', '톡썰', '상황문답', '유사투표', '톡글', '육아', '알오물', '센티넬버스', '카카오톡', '카톡', '로판', '약수위', '육아물', '집착광공', '의학물', '뱀파이어', '권태기', '남매', '좀아포', '쩜오디', '일상물', '네임버스', '빙의', '단편모음', '임신', '중수위', '노란장판', '오피스물', '삼각관계', '집착물', '유어아너', '멋진신세계', '오지콤', '아저씨', 'hl', '강월', '약한영웅2', '보플', '클리셰', '용감한시민', '재회물', '팬창작', '범죄도시3']);

// 제목에서는 이름으로 안 보는 흔한 낱말
const TITLE_STOP = new Set(['동화', '유진', '수빈', '영재', '경민', '성호', '동현', '한진', '민기', '진', '산', '준', '텐', '쿤', '료', '제이', '수호', '카이', '디오', '현재', '주연', '정한', '도겸', '우지', '성진', '도운', '건우', '상원', '소희', '이한', '양양', '태일', '신유', '도훈', '지훈', '선우', '정원', '희승', '윤호', '여상', '종호', '성화', '정우', '지성', '영호', '태현', '연준', '형원', '기현', '규빈', '한빈', '유타', '마크']);

export function buildMatcher() {
  const alias = new Map(); // 별칭 → 정식 이름
  for (const [name, [group, ...als]] of Object.entries(PEOPLE)) {
    alias.set(name.replace(/\s/g, ''), name);
    for (const a of als) if (!CONTEXT[a]) alias.set(a.replace(/\s/g, ''), name);
  }
  const groupOfTag = new Map();
  for (const [g, tags] of Object.entries(GROUP_TAGS)) for (const t of tags) groupOfTag.set(t.toLowerCase(), g);
  return function match(post) {
    const tags = (post.tags || []).map(t => t.replace(/\s/g, ''));
    const groupsTagged = new Set(tags.map(t => groupOfTag.get(t.toLowerCase())).filter(Boolean));
    const people = new Set(); const unknown = [];
    const split = (t) => String(t || '').split(/[\s,·/&×|\-_:;!?~.'"“”‘’<>「」『』【】]+/).map(s => s.replace(/[\[\]()#]/g, '')).filter(Boolean);
    const tokens = [...tags, ...split(post.subTitle)];
    // 제목: [이름] 꼴은 그대로, 나머지 낱말은 3글자 이상 이름만 (짧은 활동명은 흔한 낱말과 겹쳐서)
    const titleStr = String(post.title || '') + ' ' + String(post.seriesTitle || '');
    for (const m of titleStr.matchAll(/[\[(【「]([^\])】」]{1,12})[\])】」]/g)) tokens.push(...split(m[1]));
    for (const t of split(titleStr)) {
      for (const st of new Set([t, t.replace(/(나페스|유사|빙의글|드림|사연애|수위)$/, ''), t.replace(/(이랑|한테|에게|이가|이는|이를|이의|의|이|가|은|는|을|를|와|과|랑|야|아)$/, '')])) {
        if (st.length < 2 || TITLE_STOP.has(st)) continue;
        if (alias.has(st)) { people.add(alias.get(st)); break; }
        if (CONTEXT[st]) { const c = CONTEXT[st]; const g = [...groupsTagged].find(g => c[g]); people.add(g ? c[g] : c.default); break; }
      }
    }
    for (const t of tokens) {
      if (!t) continue;
      if (alias.has(t)) { people.add(alias.get(t)); continue; }
      const stripped = t.replace(/(나페스|유사|빙의글|드림|사연애|수위|드림주|빙의|썰)$/, '');
      if (stripped !== t && alias.has(stripped)) { people.add(alias.get(stripped)); continue; }
      if (CONTEXT[t]) { const c = CONTEXT[t]; const g = [...groupsTagged].find(g => c[g]); people.add(g ? c[g] : c.default); continue; }
      if (tags.includes(t) && !groupOfTag.has(t.toLowerCase()) && !NOT_PEOPLE.has(t) && !/사연애$/.test(t) && t.length >= 2 && t.length <= 5) unknown.push(t);
    }
    const groups = new Set([...groupsTagged]);
    for (const p of people) groups.add(PEOPLE[p]?.[0] || '기타');
    return { people: [...people], groups: [...groups], unknown };
  };
}
