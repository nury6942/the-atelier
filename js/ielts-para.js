// ═══ IELTS 바꿔 말하기 사전 (2026-10-19) ═══
// R·L = 문제에 나온 말 ↔ 지문·음성에 나온 말 (같은 뜻을 다르게)
// S·W = 기본 표현 → 7점 표현 (내가 말하고 쓸 때 바꿔 쓰기)
// 화면: 공략 탭 위쪽 '바꿔 말하기' — 오른쪽 가리기로 스스로 시험
window.IELTS_PARA = {
  R: { a:'문제', b:'지문', note:'IELTS 읽기 = 같은 뜻을 다른 말로 바꿔 놓은 걸 찾는 시험', groups:[
    { name:'돈·비용', icon:'payments', pairs:[
      ['free of charge','at no extra cost'], ['claim back','be reimbursed'], ['pay in advance','pay upfront'],
      ['cheaper','more affordable'], ['a discount','a reduced rate'], ['a refund','money back'] ]},
    { name:'규칙·의무', icon:'gavel', pairs:[
      ['must','are required to'], ['not compulsory','optional'], ['is not allowed','is prohibited'],
      ['can','are entitled to'], ['qualify for','be eligible for'], ['before the deadline','no later than'] ]},
    { name:'시간·빈도', icon:'schedule', pairs:[
      ['every week','on a weekly basis'], ['at the moment','currently'], ['in the past','previously'],
      ['soon','in the near future'], ['at first','initially'], ['in the end','eventually'] ]},
    { name:'변화·증감', icon:'trending_up', pairs:[
      ['increase','rise / grow / climb'], ['decrease','decline / fall / drop'], ['stay the same','remain stable'],
      ['became popular','gained popularity'], ['was replaced by','gave way to'], ['improve','enhance'] ]},
    { name:'원인·결과', icon:'account_tree', pairs:[
      ['because of','due to / owing to'], ['led to','resulted in'], ['caused by','stems from'],
      ['so','as a result / consequently'], ['affect','have an impact on'], ['depend on','rely on'] ]},
    { name:'의견·태도 (Y/N/NG)', icon:'record_voice_over', pairs:[
      ['the writer doubts','it is far from certain that'], ['the writer agrees','it is hard to argue with'],
      ['surprisingly','unexpectedly / remarkably'], ['is overrated','receives more praise than it deserves'],
      ['is mistaken','is misguided'], ['is essential','is indispensable'] ]},
    { name:'처음·발명·역사', icon:'history_edu', pairs:[
      ['invented','came up with / devised'], ['the first','pioneering'], ['widely used','commonly adopted'],
      ['was introduced','was launched'], ['old-fashioned','outdated'], ['based on','derived from'] ]},
    { name:'반대말 부정 (함정)', icon:'swap_horiz', pairs:[
      ['not easy','difficult'], ['not common','rare'], ['not temporary','permanent'],
      ['not expensive','inexpensive'], ['did not succeed','failed'], ['not optional','compulsory'] ]}
  ]},
  L: { a:'문제지', b:'들리는 말', note:'문제지 단어가 그대로 들리면 오히려 오답일 때가 많아요', groups:[
    { name:'숙소·예약', icon:'hotel', pairs:[
      ['accommodation','a place to stay'], ['book','reserve'], ['cancel','call off'],
      ['a single room','a room for one'], ['check-in time','when you can arrive'], ['nearby','within walking distance'] ]},
    { name:'시간·날짜', icon:'event', pairs:[
      ['fortnight','two weeks'], ['midday','noon / 12 o’clock'], ['the following day','the day after'],
      ['quarter past six','6.15'], ['early morning','first thing'], ['weekdays','Monday to Friday'] ]},
    { name:'위치·방향 (지도)', icon:'map', pairs:[
      ['next to','beside / alongside'], ['opposite','facing / across from'], ['in the corner','tucked away at the end'],
      ['north','at the top of the plan'], ['entrance','the way in'], ['between','in the middle of'] ]},
    { name:'사람·직업', icon:'badge', pairs:[
      ['staff','employees / the team'], ['beginners','people with no experience'], ['children','under-12s / kids'],
      ['elderly','senior citizens'], ['tutor','supervisor / lecturer'], ['volunteer','unpaid helper'] ]},
    { name:'의견·선택 (객관식)', icon:'how_to_vote', pairs:[
      ['recommend','I’d suggest you'], ['popular','in great demand'], ['disappointing','not as good as we hoped'],
      ['too expensive','beyond our budget'], ['the main problem','the biggest drawback'], ['decided','settled on'] ]},
    { name:'정정·함정 신호', icon:'warning', pairs:[
      ['(답이 바뀜)','sorry, I mean…'], ['(답이 바뀜)','actually, it’s been changed to…'], ['(아님)','that used to be the case, but…'],
      ['(아님)','I thought about…, but'], ['(다음 문제)','moving on to…'], ['(다음 문제)','now, as for…'] ]}
  ]},
  S: { a:'기본', b:'7점', note:'틀린 말이 아니라 한 단계 위 말로 — 대신 자연스럽게', groups:[
    { name:'좋다·싫다', icon:'thumbs_up_down', pairs:[
      ['I like it','I’m really into it'], ['I love it','I’m a big fan of it'], ['I don’t like it','it’s not really my thing'],
      ['very good','fantastic / brilliant'], ['bad','pretty disappointing'], ['interesting','fascinating'] ]},
    { name:'생각·의견', icon:'psychology', pairs:[
      ['I think','I’d say / I reckon'], ['I don’t know','I’ve never really thought about it, but'], ['maybe','it’s possible that'],
      ['I agree','I couldn’t agree more'], ['it depends','it really depends on'], ['in my opinion','personally,'] ]},
    { name:'일·디자인', icon:'design_services', pairs:[
      ['I make clothes','I design sportswear'], ['my job is busy','I’m snowed under at work'], ['I work hard','I put a lot of effort into'],
      ['popular product','a bestseller'], ['new idea','a fresh concept'], ['I check samples','I review the fit samples'] ]},
    { name:'시간·빈도', icon:'update', pairs:[
      ['often','quite regularly'], ['sometimes','every now and then'], ['always','pretty much all the time'],
      ['now','these days / nowadays'], ['when I was young','back when I was a kid'], ['rarely','hardly ever'] ]},
    { name:'감정', icon:'mood', pairs:[
      ['happy','thrilled / over the moon'], ['tired','exhausted / worn out'], ['nervous','a bit on edge'],
      ['surprised','taken aback'], ['bored','fed up with'], ['excited','can’t wait'] ]},
    { name:'시간 벌기·잇기', icon:'more_horiz', pairs:[
      ['umm…','that’s an interesting question'], ['and','on top of that'], ['but','having said that'],
      ['for example','take … for instance'], ['so','that’s why'], ['finally','all in all'] ]}
  ]},
  W: { a:'기본', b:'7점', note:'에세이는 격식 있게, 편지는 상대에 맞게 — 같은 단어 3번 반복 금지', groups:[
    { name:'에세이 — 의견', icon:'gavel', pairs:[
      ['I think','I would argue that'], ['I agree','I am largely in agreement with'], ['many people think','it is widely believed that'],
      ['some people say','it is often argued that'], ['in my opinion','from my perspective'], ['it is good','it is beneficial'] ]},
    { name:'에세이 — 양·정도', icon:'equalizer', pairs:[
      ['a lot of','a significant number of'], ['very important','crucial / vital'], ['big','substantial'],
      ['more and more','an increasing number of'], ['most people','the majority of people'], ['very bad','detrimental'] ]},
    { name:'에세이 — 잇기', icon:'link', pairs:[
      ['also','furthermore / moreover'], ['but','however / nevertheless'], ['so','consequently / therefore'],
      ['because','since / given that'], ['for example','for instance / such as'], ['in conclusion','overall / to sum up'] ]},
    { name:'에세이 — 동사', icon:'bolt', pairs:[
      ['get','obtain / acquire'], ['show','demonstrate / illustrate'], ['help','facilitate / support'],
      ['make worse','exacerbate'], ['solve','address / tackle'], ['think about','consider'] ]},
    { name:'편지 — 격식', icon:'mail', pairs:[
      ['I want to','I would like to'], ['tell me','could you inform me'], ['sorry','I apologise for'],
      ['ASAP','at your earliest convenience'], ['fix it','resolve this matter'], ['thanks','I would be grateful if'] ]},
    { name:'편지 — 친구(비격식)', icon:'mark_email_unread', pairs:[
      ['I am writing to tell you','Just a quick note to let you know'], ['I would like to invite you','Fancy coming over?'],
      ['I apologise','I’m so sorry'], ['Please reply','Drop me a line'], ['Thank you very much','Thanks a million'], ['Yours sincerely','Best wishes / Love'] ]}
  ]}
};
