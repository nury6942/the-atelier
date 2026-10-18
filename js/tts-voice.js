// ═══ 음성 고르기 공통 (2026-10-18) ═══
// 크롬은 맥 음성을 이름순으로 줘서 lang 만 정하면 'Albert'·'Bad News' 같은 장난 음성이나
// 끊기는 Google 네트워크 음성이 걸린다. 사파리는 시스템 기본(Samantha·유나)을 써서 멀쩡했음.
// → 모든 읽어주기는 atlVoice(lang) 로 사람 목소리를 직접 골라 u.voice 에 넣는다.
(function(){
  // 맥 장난·효과 음성 + 노인·아이 흉내 음성
  var NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Junior|Ralph|Fred|Kathy|Grandma|Grandpa|Rocko|Eddy|Flo|Reed|Sandy|Shelley)\b/i;
  // 자연스러운 맥·iOS 기본 음성 (언어별 선호 순)
  var GOOD = {
    'en-US': ['Ava','Samantha','Allison','Susan','Zoe','Evan','Tom','Nathan','Joelle','Noelle'],
    'en-GB': ['Daniel','Kate','Serena','Stephanie','Oliver','Arthur','Martha'],
    'en-AU': ['Karen','Lee','Matilda','Catherine','Gordon'],
    'en-IE': ['Moira'], 'en-ZA': ['Tessa'], 'en-IN': ['Rishi','Veena'],
    'ko-KR': ['유나','Yuna','Sora','소라','Minsu','민수']
  };
  var _vs = [];
  function load(){ try { _vs = window.speechSynthesis ? window.speechSynthesis.getVoices() : []; } catch(e){ _vs = []; } return _vs; }
  if (window.speechSynthesis){ load(); try { window.speechSynthesis.addEventListener('voiceschanged', load); } catch(e){ window.speechSynthesis.onvoiceschanged = load; } }

  function norm(l){ return String(l||'').replace('_','-'); }
  function score(v, lang){
    var s = 0, name = v.name || '', base = name.replace(/\s*\(.*\)$/, '');
    if (NOVELTY.test(base)) return -100;
    if (norm(v.lang) === lang) s += 50; else if (norm(v.lang).slice(0,2) === lang.slice(0,2)) s += 20; else return -100;
    if (/premium|enhanced|고급|향상/i.test(name)) s += 40;      // 설정에서 받은 고급 음성
    if (/siri/i.test(name)) s += 35;
    var g = GOOD[lang] || []; var i = g.indexOf(base); if (i >= 0) s += 30 - i;   // 아는 좋은 목소리
    if (v.localService) s += 15;                                   // 네트워크 음성은 크롬에서 끊김
    if (/google/i.test(name)) s -= 20;
    if (v['default']) s += 3;
    return s;
  }
  // 그 언어에서 가장 사람 같은 음성 (없으면 null → 브라우저 기본)
  // avoid: 이미 다른 화자가 쓰는 음성 이름들 — 대화에서 두 사람이 같은 목소리가 안 되게
  window.atlVoice = function(lang, avoid){
    lang = norm(lang || 'en-US'); avoid = avoid || [];
    var vs = _vs.length ? _vs : load(), best = null, bs = -1;
    for (var i = 0; i < vs.length; i++){ var sc = score(vs[i], lang); if (avoid.indexOf(vs[i].name) >= 0) sc -= 60; if (sc > bs){ bs = sc; best = vs[i]; } }
    if (bs <= 0 && avoid.length) return window.atlVoice(lang);   // 그 언어 음성이 하나뿐이면 겹쳐도 씀
    return bs > 0 ? best : null;
  };
  // 문장에 음성을 붙여 준다 — lang·voice 를 같이 맞춰야 크롬이 다른 음성으로 바꾸지 않음
  // 사파리는 손대지 않는다 — 사파리 기본 음성(시스템 설정 음성, 고급·Siri 포함)이 Samantha 기본판보다 좋음.
  // 크롬처럼 장난 음성이 걸리는 브라우저에서만 직접 고른다.
  var IS_SAFARI = /^((?!chrome|chromium|crios|fxios|edg|android).)*safari/i.test(navigator.userAgent || '');
  window.atlIsSafari = IS_SAFARI;
  window.atlApplyVoice = function(u, lang){
    if (IS_SAFARI){ if (lang) u.lang = lang; return u; }
    var v = window.atlVoice(lang || u.lang);
    if (v){ u.voice = v; u.lang = v.lang; } else if (lang) u.lang = lang;
    return u;
  };
})();
