// IELTS 무료 모의고사 링크 + 유튜브 영상 목록 — scripts/ielts/build-links.py 가 만든 파일 (손으로 고치지 말 것)
window.IELTS_LINKS = {
 "checked": "2026-10-18",
 "tests": [
  {
   "id": "bc-familiarisation",
   "name": "IELTS on Computer Familiarisation Test (British Council)",
   "provider": "British Council",
   "official": true,
   "area": "full",
   "module": "both",
   "format": "computer",
   "count": 1,
   "minutes": null,
   "login": true,
   "url": "https://takeielts.britishcouncil.org/prepare/ielts-free-practice-mock-tests/ielts-familiarisation-test",
   "note": "실제 시험 화면 그대로 4개 영역 전체, GT 선택 가능·L/R 자동채점. 이름·이메일 등록(cdielts.gelielts.com) 필요 — 시험 2~3주 전 화면 적응용 1순위",
   "review": {
    "id": "bc-familiarisation",
    "score": 4.5,
    "real": "similar",
    "mentions": "some",
    "pros": "실제 CD 시험 화면(Inspera) 그대로라 형광펜·메모·시간표시·단어수 카운터까지 미리 손에 익음, L/R 점수 나옴",
    "cons": "1회뿐이고 난이도 데이터는 적음, 등록 필요 — 점수보다 화면 적응용",
    "verdict": "시험 2~3주 전 실전처럼 통째로 1회. 점수는 참고만 하고 화면 조작·시간 배분 확인용으로",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/10foqlo/",
     "https://www.reddit.com/r/IELTS/comments/139kwsi/",
     "https://www.reddit.com/r/IELTS/comments/1h77bqj/"
    ]
   }
  },
  {
   "id": "bc-ready",
   "name": "IELTS Ready (free tier)",
   "provider": "British Council",
   "official": true,
   "area": "full",
   "module": "both",
   "format": "computer",
   "count": 2,
   "minutes": null,
   "login": true,
   "url": "https://takeielts.britishcouncil.org/prepare/ielts-ready",
   "note": "무료 계정으로 풀 모의고사 2회(L/R 점수·모범답안)+25분 미니 모의고사. GT 지원 여부는 가입 후 확인 필요. BC로 시험 접수하면 Premium 40회로 늘어남",
   "review": {
    "id": "bc-ready",
    "score": 3.0,
    "real": "harder",
    "mentions": "many",
    "pros": "공식 계열 플랫폼이라 문제 유형·구조 익히기 좋고 CD 화면과 비슷",
    "cons": "리스닝이 빠르고 숫자·철자 문제가 과하며 빈칸 단어수도 실제와 달라 점수가 실제보다 0.5~1.5 낮게 나온다는 후기 다수",
    "verdict": "유형·인터페이스 연습용으로 쓰고 점수가 낮아도 흔들리지 말 것 — 실제는 대체로 더 쉬웠다는 후기가 대부분",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/1civkiz/",
     "https://www.reddit.com/r/IELTS/comments/1rhwr5s/",
     "https://www.reddit.com/r/IELTS/comments/1hlafeb/",
     "https://www.reddit.com/r/IELTS/comments/1vycepa/"
    ]
   }
  },
  {
   "id": "ieltsorg-gt-samples",
   "name": "IELTS General Training sample test questions (computer + paper)",
   "provider": "IELTS.org (IELTS partners)",
   "official": true,
   "area": "full",
   "module": "GT",
   "format": "computer",
   "count": 1,
   "minutes": null,
   "login": false,
   "url": "https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test",
   "note": "공식 GT 문제유형별 샘플(L 8유형·GT R 7유형·GT W 편지/에세이) Inspera 시험화면, 정답 PDF. 풀세트 아닌 유형 연습, 무제한 시간 — 유형 익히기 첫 단계",
   "review": {
    "id": "ieltsorg-gt-samples",
    "score": 4.0,
    "real": "similar",
    "mentions": "few",
    "pros": "시험 출제측 공식 샘플이라 GT 유형·화면이 정확",
    "cons": "풀세트가 아니라 유형 샘플이고 이 페이지 자체 후기는 거의 없음",
    "verdict": "GT 리딩·편지 유형을 처음 익힐 때 1순위로 한 번 훑기",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/10foqlo/",
     "https://www.reddit.com/r/IELTS/comments/1vycepa/"
    ]
   }
  },
  {
   "id": "idp-familiarisation",
   "name": "IELTS on Computer Familiarisation test (IDP)",
   "provider": "IDP IELTS",
   "official": true,
   "area": "LR",
   "module": "Academic",
   "format": "computer",
   "count": 1,
   "minutes": null,
   "login": false,
   "url": "https://ielts.idp.com/about/ielts-familiarisation-tests",
   "note": "로그인 없이 바로 Listening 40문항 풀세트(공통)+Academic R/W, 시간제한 없음. 리스닝 화면 적응용으로 쓰고 Reading은 GT가 아니니 화면 감만 익히기",
   "review": {
    "id": "idp-familiarisation",
    "score": 3.5,
    "real": "similar",
    "mentions": "few",
    "pros": "로그인 없이 바로 CD 화면 리스닝 풀세트",
    "cons": "리딩·라이팅은 Academic이라 GT 난이도 판단 불가, 난이도 비교 후기 거의 없음",
    "verdict": "리스닝 화면 감 익히기용으로만, GT 리딩은 다른 자료로",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/1sp1253/",
     "https://www.reddit.com/r/IELTS/comments/10foqlo/"
    ]
   }
  },
  {
   "id": "idp-essentials-cd",
   "name": "IELTS Essentials computer practice (Listening / GT Reading)",
   "provider": "IDP IELTS",
   "official": true,
   "area": "LR",
   "module": "GT",
   "format": "computer",
   "count": 1,
   "minutes": 60,
   "login": false,
   "url": "https://computer.ieltsessentials.com/general-training-reading/",
   "note": "실제 CD 시험처럼 '응시자 정보 확인' 화면부터 시작하는 GT Reading(41문항)·Listening, 시간제한 있음. IDP 필리핀 페이지에서 링크됨, GT Writing 링크는 IDP 홈으로 리다이렉트(깨짐)",
   "review": {
    "id": "idp-essentials-cd",
    "score": 3.5,
    "real": "similar",
    "mentions": "few",
    "pros": "응시자 확인 화면부터 시작하는 실제 CD 흐름 + 시간제한 GT 리딩",
    "cons": "이 사이트를 직접 평가한 후기는 찾지 못함(공식 IDP 자료라는 점만 근거)",
    "verdict": "BC 친숙화 테스트와 함께 GT 리딩 실전 리허설 1회로 쓰기 — 후기 근거는 약함",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/10foqlo/",
     "https://www.reddit.com/r/IELTS/comments/1vycepa/"
    ]
   }
  },
  {
   "id": "bc-gt-reading",
   "name": "Free IELTS General Training Reading practice",
   "provider": "British Council",
   "official": true,
   "area": "R",
   "module": "GT",
   "format": "computer",
   "count": 1,
   "minutes": null,
   "login": false,
   "url": "https://takeielts.britishcouncil.org/prepare/ielts-free-practice-mock-tests/general-training/reading",
   "note": "GT 리딩 유형 6개 온라인 샘플+정답 PDF, 종이 샘플 PDF. 풀세트 아님 — T/F/NG·매칭 유형 집중 연습용",
   "review": {
    "id": "bc-gt-reading",
    "score": 3.5,
    "real": "similar",
    "mentions": "few",
    "pros": "공식 GT 리딩 유형 샘플, 정답 포함",
    "cons": "풀세트가 아니어서 시간 감각·점수 예측은 안 됨, 직접 후기 드묾",
    "verdict": "T/F/NG·매칭 등 약한 유형만 골라 집중 연습",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/10foqlo/",
     "https://www.reddit.com/r/IELTS/comments/1vycepa/"
    ]
   }
  },
  {
   "id": "bc-gt-writing",
   "name": "Free IELTS General Training Writing practice",
   "provider": "British Council",
   "official": true,
   "area": "W",
   "module": "GT",
   "format": "computer",
   "count": 1,
   "minutes": null,
   "login": false,
   "url": "https://takeielts.britishcouncil.org/prepare/ielts-free-practice-mock-tests/general-training/writing",
   "note": "GT Task1 편지·Task2 에세이 컴퓨터 입력 샘플+채점된 샘플 답안·시험관 코멘트 PDF. 타자 연습+밴드 기준 감 잡기",
   "review": {
    "id": "bc-gt-writing",
    "score": 3.5,
    "real": "similar",
    "mentions": "few",
    "pros": "공식 GT 편지·에세이 과제 형식과 CD 입력 환경 확인",
    "cons": "채점이 없고, AI 채점은 실제보다 짜게 나온다는 후기가 많음",
    "verdict": "과제 형식 확인용 — 점수는 사람(첨삭)에게 받기",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/1wmgnyg/",
     "https://www.reddit.com/r/IELTS/comments/1ws81rv/"
    ]
   }
  },
  {
   "id": "bc-listening",
   "name": "Free IELTS Listening practice (shared Academic/GT)",
   "provider": "British Council",
   "official": true,
   "area": "L",
   "module": "Academic",
   "format": "computer",
   "count": 1,
   "minutes": 30,
   "login": false,
   "url": "https://takeielts.britishcouncil.org/prepare/ielts-free-practice-mock-tests/academic/listening",
   "note": "리스닝은 GT와 동일. 유형별 7개 샘플+4파트 40문항 컴퓨터 풀 연습(Inspera, 무제한 시간), 정답·스크립트 PDF",
   "review": {
    "id": "bc-listening",
    "score": 3.5,
    "real": "similar",
    "mentions": "few",
    "pros": "공식 리스닝 샘플(공통), 실제와 같은 억양·유형",
    "cons": "분량이 적고 직접 후기 드묾",
    "verdict": "리스닝 유형별 워밍업으로, 풀세트는 케임브리지로",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/10foqlo/",
     "https://www.reddit.com/r/IELTS/comments/1vycepa/"
    ]
   }
  },
  {
   "id": "idp-practice-library",
   "name": "IDP IELTS preparation library (GT filter)",
   "provider": "IDP IELTS",
   "official": true,
   "area": "full",
   "module": "both",
   "format": "web",
   "count": null,
   "minutes": null,
   "login": false,
   "url": "https://ielts.idp.com/prepare/ielts-general-training-practice-tests",
   "note": "IDP 자료 모음(72개 중 연습시험은 Familiarisation L/R/W+Speaking Part1~3 음성). '?filter=on-computer'로 컴퓨터용만 걸러보기. 대부분 위 항목과 같은 링크",
   "review": {
    "id": "idp-practice-library",
    "score": 3.5,
    "real": "similar",
    "mentions": "few",
    "pros": "IDP 공식 무료 자료를 GT로 모아볼 수 있음",
    "cons": "풀 모의고사 수가 적고 품질·난이도 평가 후기 거의 없음",
    "verdict": "IDP 응시자라면 등록 후 받는 자료와 함께 유형 보충용으로",
    "sources": [
     "https://m.blog.naver.com/jeonghwa6601/224375372627",
     "https://www.reddit.com/r/IELTS/comments/1vycepa/"
    ]
   }
  },
  {
   "id": "ieltsorg-trial-test",
   "name": "IELTS Trial Test (in-centre, examiner-marked)",
   "provider": "IELTS.org / BC / IDP",
   "official": true,
   "area": "LR",
   "module": "both",
   "format": "web",
   "count": 1,
   "minutes": null,
   "login": true,
   "url": "https://ielts.org/take-a-test/preparation-resources/ielts-trial-test",
   "note": "온라인 아님 — 참여 시험장에서 무료로 L+R+W 실전 시간제 응시, 시험관 채점 13일 후 결과. 한국 시행 센터 여부는 BC/IDP에 문의 필요",
   "review": {
    "id": "ieltsorg-trial-test",
    "score": 4.0,
    "real": "similar",
    "mentions": "few",
    "pros": "시험장에서 공식 문제로 보고 라이팅·스피킹까지 사람 채점 — 유일하게 W/S 실점수 예측 가능",
    "cons": "유료·센터 방문, 응시 후기는 거의 못 찾음",
    "verdict": "라이팅·스피킹 점수가 불안할 때만 고려, L/R만이면 불필요",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/1wmgnyg/",
     "https://www.reddit.com/r/IELTS/comments/1ws81rv/"
    ]
   }
  },
  {
   "id": "iot-gt",
   "name": "IELTS Online Tests — General Training library",
   "provider": "IELTS Online Tests (InterGreat)",
   "official": false,
   "area": "full",
   "module": "GT",
   "format": "computer",
   "count": 36,
   "minutes": null,
   "login": true,
   "url": "https://ieltsonlinetests.com/ielts-exam-library?tab=general",
   "note": "GT 16권(Prepare 2·Master 6·IELTS GT 8)에 연습시험 36세트, 세트마다 L/R/W/S+L·R·W 풀테스트 시뮬레이션. 무료 가입 필요, 비공식이라 난이도·채점 신뢰도는 공식보다 낮음 — 물량 연습용",
   "review": {
    "id": "iot-gt",
    "score": 3.0,
    "real": "harder",
    "mentions": "many",
    "pros": "CD 화면과 가장 비슷한 무료 사이트, 세트가 많아 시간 압박 훈련에 좋음",
    "cons": "리스닝·리딩이 실제보다 어렵고(실제 0.5~1.5 높게 나온 후기 다수) 정답 오류·빈칸 단어수 불일치 지적, '거의 같았다'는 소수 의견도",
    "verdict": "CD 화면 적응·체력 훈련용으로 쓰고 점수는 실제보다 낮게 나온다고 보고 해석",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/139kwsi/",
     "https://www.reddit.com/r/IELTS/comments/1wsmlon/",
     "https://www.reddit.com/r/IELTS/comments/1om9xvx/",
     "https://m.blog.naver.com/kotakjion/224357654739"
    ]
   }
  },
  {
   "id": "liz-listening",
   "name": "IELTS Liz Listening practice lessons",
   "provider": "IELTS Liz",
   "official": false,
   "area": "L",
   "module": "both",
   "format": "web",
   "count": 30,
   "minutes": null,
   "login": false,
   "url": "https://ieltsliz.com/ielts-listening/",
   "note": "유형별 짧은 리스닝 레슨 약 30개+팁 영상. 풀세트 아님, 약한 유형(지도·문장완성) 보강용",
   "review": {
    "id": "liz-listening",
    "score": 3.5,
    "real": "mixed",
    "mentions": "few",
    "pros": "유형별 요령 설명이 친절해 입문 단계에 도움된다는 언급",
    "cons": "모의고사가 아니라 레슨이라 난이도·점수 예측엔 못 씀",
    "verdict": "유형·함정 이해용 강의로, 실전 감은 케임브리지로",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/1n6facc/"
    ]
   }
  },
  {
   "id": "liz-gt-reading",
   "name": "IELTS Liz GT Reading info & lessons",
   "provider": "IELTS Liz",
   "official": false,
   "area": "R",
   "module": "GT",
   "format": "web",
   "count": null,
   "minutes": null,
   "login": false,
   "url": "https://ieltsliz.com/ielts-general-training-reading-information/",
   "note": "GT 리딩 구조·밴드 환산표·유형 팁 정리, 연습문제는 대부분 Academic 리딩 레슨으로 연결. 시험 구조 이해용",
   "review": {
    "id": "liz-gt-reading",
    "score": 3.5,
    "real": "mixed",
    "mentions": "few",
    "pros": "GT 리딩 구조·유형 설명이 정리돼 있음",
    "cons": "풀세트 없음, 직접 후기 적음",
    "verdict": "GT 리딩 첫 주에 구조 파악용으로만",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/1n6facc/"
    ]
   }
  },
  {
   "id": "liz-gt-letter",
   "name": "IELTS Liz GT Writing Task 1 letter lessons",
   "provider": "IELTS Liz",
   "official": false,
   "area": "W",
   "module": "GT",
   "format": "web",
   "count": null,
   "minutes": null,
   "login": false,
   "url": "https://ieltsliz.com/ielts-letter-writing/",
   "note": "GT Task1 편지(공식/반공식/비공식) 쓰는 법·모범 답안 레슨. 편지 톤 잡을 때",
   "review": {
    "id": "liz-gt-letter",
    "score": 3.5,
    "real": "mixed",
    "mentions": "few",
    "pros": "GT 편지 톤(격식/반격식)·구성 예시가 명확",
    "cons": "채점·첨삭 없음, 후기 적음",
    "verdict": "편지 템플릿·톤 익히기용, 쓴 글은 따로 첨삭받기",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/1n6facc/",
     "https://www.reddit.com/r/IELTS/comments/1u7k9pv/"
    ]
   }
  },
  {
   "id": "cambridge-sample-papers",
   "name": "Cambridge English IELTS sample papers",
   "provider": "Cambridge University Press & Assessment",
   "official": true,
   "area": "full",
   "module": "both",
   "format": "pdf",
   "count": null,
   "minutes": null,
   "login": false,
   "url": "https://www.cambridgeenglish.org/exams-and-tests/ielts/preparation/",
   "note": "종이 샘플 문제 zip 다운로드 + ielts.org 샘플로 연결. 내용은 위 공식 샘플과 겹침, 컴퓨터 응시자는 우선순위 낮음 (Cambridge IELTS 책은 유료)",
   "review": {
    "id": "cambridge-sample-papers",
    "score": 4.0,
    "real": "similar",
    "mentions": "few",
    "pros": "출제기관 공식 샘플이라 난이도가 실제와 같은 계열",
    "cons": "분량이 적음, 페이지 자체 후기는 드묾",
    "verdict": "케임브리지 책 들어가기 전 맛보기로",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/10foqlo/",
     "https://www.reddit.com/r/IELTS/comments/1vycepa/"
    ]
   }
  },
  {
   "id": "idp-app",
   "name": "IELTS by IDP app",
   "provider": "IDP IELTS",
   "official": true,
   "area": "LR",
   "module": "both",
   "format": "web",
   "count": null,
   "minutes": null,
   "login": true,
   "url": "https://apps.apple.com/in/app/id1623340137",
   "note": "앱스토어 설명상 무료 L/R 샘플 테스트(자동채점·AI 피드백)·7일 챌린지. 인도 스토어 링크만 확인됨, 한국 계정·GT 포함 여부 미확인",
   "review": {
    "id": "idp-app",
    "score": 3.0,
    "real": "mixed",
    "mentions": "few",
    "pros": "IDP 공식 앱(Prep Hub)으로 짬짬이 유형 연습 가능",
    "cons": "앱 자체 난이도·정확도 후기는 거의 없음, IDP 등록 후 주는 프리미엄 모의고사는 어렵다는 후기",
    "verdict": "출퇴근 자투리 연습용, 실전 점수 예측엔 쓰지 말기",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/156fsa0/",
     "https://www.reddit.com/r/IELTS/comments/1vycepa/"
    ]
   }
  },
  {
   "id": "extra-0",
   "name": "Road to IELTS (British Council)",
   "provider": "Road to IELTS (British Council)",
   "official": false,
   "area": "full",
   "module": "GT",
   "format": "web",
   "count": null,
   "login": null,
   "url": "https://takeielts.britishcouncil.org/prepare/ielts-ready",
   "note": "실제보다 약간 어렵다는 의견과 IOT보다 쉽다는 의견이 갈림. 현재는 IELTS Ready로 통합돼 bc-ready와 같은 계열",
   "review": {
    "name": "Road to IELTS (British Council)",
    "url": "https://takeielts.britishcouncil.org/prepare/ielts-ready",
    "free": true,
    "score": 3.5,
    "real": "mixed",
    "verdict": "실제보다 약간 어렵다는 의견과 IOT보다 쉽다는 의견이 갈림. 현재는 IELTS Ready로 통합돼 bc-ready와 같은 계열",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/wxcq4k/",
     "https://www.reddit.com/r/IELTS/comments/18q6sh2/"
    ]
   }
  },
  {
   "id": "extra-1",
   "name": "Mini-IELTS",
   "provider": "Mini-IELTS",
   "official": false,
   "area": "full",
   "module": "GT",
   "format": "web",
   "count": null,
   "login": null,
   "url": "https://mini-ielts.com/",
   "note": "문제 다수가 케임브리지 출처라 난이도가 실제와 비슷하고 화면이 CD와 닮아 리딩 연습에 좋다는 언급(후기 수 적음)",
   "review": {
    "name": "Mini-IELTS",
    "url": "https://mini-ielts.com/",
    "free": true,
    "score": 3.5,
    "real": "similar",
    "verdict": "문제 다수가 케임브리지 출처라 난이도가 실제와 비슷하고 화면이 CD와 닮아 리딩 연습에 좋다는 언급(후기 수 적음)",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/1472yje/"
    ]
   }
  },
  {
   "id": "extra-2",
   "name": "IELTS-Up",
   "provider": "IELTS-Up",
   "official": false,
   "area": "full",
   "module": "GT",
   "format": "web",
   "count": null,
   "login": null,
   "url": "https://ielts-up.com/",
   "note": "L/R이 케임브리지 수준이라는 긍정 후기가 있으나 너무 쉽게 나온다는 의견도 있어 표본 적음",
   "review": {
    "name": "IELTS-Up",
    "url": "https://ielts-up.com/",
    "free": true,
    "score": 3.5,
    "real": "similar",
    "verdict": "L/R이 케임브리지 수준이라는 긍정 후기가 있으나 너무 쉽게 나온다는 의견도 있어 표본 적음",
    "sources": [
     "https://www.reddit.com/r/IELTS/comments/iy82cl/"
    ]
   }
  }
 ],
 "videos": [
  {
   "yt": "lpF5_EZIKVE",
   "title": "Get BAND 9 After Using These Listening Tips",
   "channel": "IELTS Advantage",
   "lang": "en",
   "area": "L",
   "views": 1821887,
   "published": "2025-07",
   "duration": "13:18",
   "tip": "상위권이 쓰는 리스닝 습관 정리 — 듣기 전 문제 미리 읽고 정답 단어 예측하는 루틴부터 잡기"
  },
  {
   "yt": "ULmeHkHU7YQ",
   "title": "How To Get Band 9 in IELTS Listening in 2026",
   "channel": "IELTS Advantage",
   "lang": "en",
   "area": "L",
   "views": 459625,
   "published": "2025-11",
   "duration": "36:21",
   "tip": "2026 기준 리스닝 전 파트 전략 총정리 — 긴 영상이니 파트별로 끊어 보며 내 약점 유형 표시"
  },
  {
   "yt": "tU7VNrgCJdU",
   "title": "15 Listening Tips & Tricks for IELTS Band 9",
   "channel": "E2 IELTS",
   "lang": "en",
   "area": "L",
   "views": 202034,
   "published": "2023-11",
   "duration": "55:00",
   "tip": "철자·숫자·복수형 실수 등 점수 깎이는 15가지 함정 모음 — 오답노트 체크리스트로 활용"
  },
  {
   "yt": "VUtUOTrJ2Kk",
   "title": "Full IELTS Listening Test with Answers | 2024",
   "channel": "E2 IELTS",
   "lang": "en",
   "area": "L",
   "views": 579570,
   "published": "2024-04",
   "duration": "32:42",
   "tip": "실전 한 세트를 풀고 해설까지 듣기 — 먼저 혼자 풀고 채점 후 틀린 구간만 다시 보기"
  },
  {
   "yt": "ktXJz5xuBzw",
   "title": "BEST IELTS Listening Strategies that ALWAYS Get me BAND 9",
   "channel": "IELTS with Juva",
   "lang": "en",
   "area": "L",
   "views": 114185,
   "published": "2024-10",
   "duration": "10:21",
   "tip": "한 문제 앞서 읽기·패러프레이즈 듣기 — 정답 직전 말 바꾸기(디스트랙터)에 속지 않는 법"
  },
  {
   "yt": "FQ1T-Nm1cGA",
   "title": "New IELTS Listening MAP Strategy & Practice (for Band 9)",
   "channel": "Fastrack IELTS",
   "lang": "en",
   "area": "L",
   "views": 107128,
   "published": "2024-07",
   "duration": "16:55",
   "tip": "GT 섹션2 단골인 지도 문제 — 출발점·방향어(opposite, next to) 먼저 잡고 따라가기"
  },
  {
   "yt": "iJqOyx3qPyE",
   "title": "아이엘츠 리스닝, '이 방법'으로 공부하셔야 됩니다 ✨ 해커스 IELTS 함시윤",
   "channel": "1위 해커스유학 - 토플·아이엘츠·SAT·GRE",
   "lang": "ko",
   "area": "L",
   "views": 9679,
   "published": "2025-10",
   "duration": "27:22",
   "tip": "한국어로 듣는 파트별 난이도와 공부법 — 왜 안 들리는지 원인부터 진단하고 받아쓰기·쉐도잉으로"
  },
  {
   "yt": "apOCnYpR-9g",
   "title": "This BAND 9 IELTS Reading Strategy Changes Everything",
   "channel": "IELTS Advantage",
   "lang": "en",
   "area": "R",
   "views": 910901,
   "published": "2025-07",
   "duration": "10:37",
   "tip": "영어 잘해도 리딩에서 무너지는 이유 — 지문 전체 해석 대신 문제 키워드로 위치 찾기"
  },
  {
   "yt": "Kch2Tb_T2Pg",
   "title": "The Only IELTS Reading Strategy You Need in 2026",
   "channel": "IELTS Advantage",
   "lang": "en",
   "area": "R",
   "views": 1013601,
   "published": "2024-12",
   "duration": "30:23",
   "tip": "유형별 접근 순서 한 번에 정리 — 시간 관리 기준(지문당 분 배분)을 내 것으로 정하기"
  },
  {
   "yt": "Tn7E2PNfASg",
   "title": "Get Better at IELTS Reading in 13 Minutes",
   "channel": "Fastrack IELTS",
   "lang": "en",
   "area": "R",
   "views": 501026,
   "published": "2025-09",
   "duration": "13:42",
   "tip": "13분짜리 핵심 팁+공부 습관 — 매일 짧게 지문 읽고 모르는 어휘 패러프레이즈로 정리"
  },
  {
   "yt": "sxPEE5pBDmw",
   "title": "📌 “IELTS GT Reading Tips 🇨🇦 | Boost Your Score FAST in 2025!”",
   "channel": "Raman IELTS",
   "lang": "en",
   "area": "R",
   "views": 14230,
   "published": "2025-12",
   "duration": "13:45",
   "tip": "GT 리딩 전용 — 섹션1·2 실용문(광고·공지·사내문서)은 빨리 끝내고 섹션3에 시간 몰기"
  },
  {
   "yt": "aLLTq-l0IeY",
   "title": "IELTS Reading Test - Tips & Strategies for True, False, Not Given",
   "channel": "E2 IELTS",
   "lang": "en",
   "area": "R",
   "views": 416994,
   "published": "2023-04",
   "duration": "19:10",
   "tip": "True/False/Not Given 구분법 — '지문과 반대'면 False, '언급 없음'이면 Not Given 원칙 연습"
  },
  {
   "yt": "yI54Y-c0gjk",
   "title": "아이엘츠 리딩 첫 시험에도 7.0+ 받는 공부법 ⭐ 해커스 IELTS 조세핀 육",
   "channel": "1위 해커스유학 - 토플·아이엘츠·SAT·GRE",
   "lang": "ko",
   "area": "R",
   "views": 8209,
   "published": "2025-11",
   "duration": "29:50",
   "tip": "첫 시험 7.0 목표 리딩 풀이법을 한국어로 — 긴 지문에서 정답 근거 문장 빠르게 찾는 순서"
  },
  {
   "yt": "ZwTX-O_WvnM",
   "title": "IELTS Task 1 General Training Writing: Ultimate Guide 2026",
   "channel": "IELTS Advantage",
   "lang": "en",
   "area": "W1",
   "views": 126165,
   "published": "2026-05",
   "duration": "17:46",
   "tip": "2026 GT 편지 최신 총정리 — 정형 편지 단계별 작성, 세 개 bullet을 각 문단에 하나씩 대응"
  },
  {
   "yt": "sR4mnzJatOc",
   "title": "IELTS Task 1 Formal Letters - Ultimate Guide",
   "channel": "IELTS Advantage",
   "lang": "en",
   "area": "W1",
   "views": 386551,
   "published": "2024-04",
   "duration": "15:22",
   "tip": "격식 편지(불만·요청·지원) 집중 — 첫 문장에 편지 목적을 바로 밝히고 어조 끝까지 유지"
  },
  {
   "yt": "TbdP4Sz5Bn0",
   "title": "Complete Guide to IELTS Letters (General Training Writing Task 1)",
   "channel": "Fastrack IELTS",
   "lang": "en",
   "area": "W1",
   "views": 87795,
   "published": "2025-06",
   "duration": "18:28",
   "tip": "편지 어조 판단→인사말→문단3개→맺음말 틀 — 격식 편지용 표현 PDF와 함께 암기"
  },
  {
   "yt": "OxUmxuWx89U",
   "title": "Step-by-Step IELTS General Training Writing Task 1 (Band 9 Semiformal Letter)",
   "channel": "Fastrack IELTS",
   "lang": "en",
   "area": "W1",
   "views": 74795,
   "published": "2024-12",
   "duration": "13:20",
   "tip": "반격식 편지를 실제로 같이 써보는 영상 — 집주인·이웃·동료에게 쓰는 중간 톤 감 잡기"
  },
  {
   "yt": "lBHf7LCWhVs",
   "title": "E2 IELTS General Writing Task 1 | Informal Letters | TOP TIPS with Jay!",
   "channel": "E2 IELTS",
   "lang": "en",
   "area": "W1",
   "views": 2059837,
   "published": "2018-10",
   "duration": "15:11",
   "tip": "친구에게 쓰는 비격식 편지 — 축약형·구어체 써도 되지만 bullet 3개 빠짐없이 다루기 (오래됐지만 조회수 최고)"
  },
  {
   "yt": "3lSPAcIy-RU",
   "title": "IELTS General Training Writing Task 1: how to boost your score",
   "channel": "TakeIELTS Official",
   "lang": "en",
   "area": "W1",
   "views": 25194,
   "published": "2025-04",
   "duration": "4:59",
   "tip": "시험 주관사 공식 5분 요약 — 편지 3종(개인·반격식·격식) 구분과 채점관이 보는 포인트"
  },
  {
   "yt": "UzjW8ycJu9U",
   "title": "From Band 6.5 to 9 in ONE Writing Lesson",
   "channel": "IELTS Advantage",
   "lang": "en",
   "area": "W2",
   "views": 452272,
   "published": "2025-12",
   "duration": "40:38",
   "tip": "6.5 에세이를 9점으로 고치는 실제 첨삭 과정 — 5단계 계획으로 아이디어→문단 짜기"
  },
  {
   "yt": "gsEmGSVU7cA",
   "title": "The Ultimate Guide to IELTS Writing Task 2 (2026)",
   "channel": "Fastrack IELTS",
   "lang": "en",
   "area": "W2",
   "views": 138350,
   "published": "2026-05",
   "duration": "19:59",
   "tip": "2026 기준 Task 2 유형별 구조 총정리 — 질문 유형 먼저 판별하고 그에 맞는 틀 고르기"
  },
  {
   "yt": "NECR879vg-Y",
   "title": "How to Get Band 9 in IELTS Writing Task 2",
   "channel": "IELTS Advantage",
   "lang": "en",
   "area": "W2",
   "views": 333031,
   "published": "2026-01",
   "duration": "28:58",
   "tip": "밴드9 구조 가이드 — 서론에서 입장 명확히, 본론은 주장+설명+예시 한 덩어리로"
  },
  {
   "yt": "aSng9I0LwjY",
   "title": "How to Write a Perfect IELTS Writing Task 2 Essay in 15 Minutes (Step-by-Step Guide for 2025)",
   "channel": "E2 IELTS",
   "lang": "en",
   "area": "W2",
   "views": 95321,
   "published": "2025-07",
   "duration": "15:20",
   "tip": "15분 안에 에세이 완성 단계별 — 계획 5분 습관으로 40분 안에 검토 시간까지 확보"
  },
  {
   "yt": "G9aEKgQp6fs",
   "title": "Nail Your Opinion Essay in 17 Minutes: IELTS Writing Task 2 (Agree or Disagree)",
   "channel": "Fastrack IELTS",
   "lang": "en",
   "area": "W2",
   "views": 197631,
   "published": "2024-01",
   "duration": "17:05",
   "tip": "찬반(의견) 에세이 한 편을 17분에 완성 — GT에서 가장 자주 나오는 유형부터 마스터"
  },
  {
   "yt": "OXYFKoQUcYU",
   "title": "아이엘츠 라이팅, Task2 이것만 잘 써도 고득점이 쉬워집니다 📖 해커스 Jen",
   "channel": "1위 해커스유학 - 토플·아이엘츠·SAT·GRE",
   "lang": "ko",
   "area": "W2",
   "views": 2233,
   "published": "2026-09",
   "duration": "27:25",
   "tip": "한국어 강의 — 예시와 패러프레이징이 고득점 핵심, 같은 말 반복 대신 바꿔 쓰기 연습"
  },
  {
   "yt": "9DTyINOeY-Y",
   "title": "How Do I Get A Band 9 in IELTS Speaking?",
   "channel": "IELTS Advantage",
   "lang": "en",
   "area": "S",
   "views": 2736746,
   "published": "2024-11",
   "duration": "21:48",
   "tip": "스피킹 4개 채점 기준을 쉽게 풀어줌 — 외운 답 대신 자연스럽게 길게 말하는 법"
  },
  {
   "yt": "_kUA_U3GowE",
   "title": "IELTS Speaking Test band score 7 with feedback 2025",
   "channel": "Ross IELTS Academy",
   "lang": "en",
   "area": "S",
   "views": 792635,
   "published": "2025-01",
   "duration": "21:01",
   "tip": "실제 밴드7 수험자 모의시험+피드백 — 목표 점수의 실제 수준과 문법(6점) 약점 보기"
  },
  {
   "yt": "N3x1cvJoy38",
   "title": "3 Steps to a Perfect IELTS Speaking Part 2 Answer",
   "channel": "English Speaking Success",
   "lang": "en",
   "area": "S",
   "views": 186339,
   "published": "2024-12",
   "duration": "14:45",
   "tip": "Keith의 파트2 시작 3단계 — 배경 설명으로 시간 끌지 말고 주제로 바로 들어가기"
  },
  {
   "yt": "pMx9ogGoZN4",
   "title": "How to Start Speaking in IELTS Part 3",
   "channel": "English Speaking Success",
   "lang": "en",
   "area": "S",
   "views": 182812,
   "published": "2024-09",
   "duration": "17:50",
   "tip": "Keith의 파트3 — 생각할 시간 버는 표현, 못 알아들었을 때 되묻기, 답 확장법"
  },
  {
   "yt": "rweKi3PcSI4",
   "title": "아이엘츠 스피킹 7.0 받는 꿀팁, 이 영상 하나로 정리해드립니다 👩‍🏫 해커스 윤성원",
   "channel": "1위 해커스유학 - 토플·아이엘츠·SAT·GRE",
   "lang": "ko",
   "area": "S",
   "views": 12193,
   "published": "2025-12",
   "duration": "30:30",
   "tip": "한국어로 정리한 스피킹 7.0 비법 — 파트별 답변 구조와 한국인이 자주 깎이는 지점"
  },
  {
   "yt": "Gv5TsNiVlko",
   "title": "IELTS Computer Based Test Experience 🖥️ | Official IELTS Test Centre Walkthrough",
   "channel": "IELTS IDP India",
   "lang": "en",
   "area": "G",
   "views": 232774,
   "published": "2025-11",
   "duration": "4:39",
   "tip": "IDP 공식 컴퓨터 시험장 체크인부터 4과목까지 실제 흐름 — 시험 당일 긴장 줄이기"
  },
  {
   "yt": "3SUAfSU0VNo",
   "title": "How to Pass IELTS on Computer",
   "channel": "Fastrack IELTS",
   "lang": "en",
   "area": "G",
   "views": 338272,
   "published": "2025-05",
   "duration": "9:31",
   "tip": "컴퓨터 시험 화면(하이라이트·메모·단어 수 표시)과 장비 — 연습도 컴퓨터로 해야 하는 이유"
  }
 ],
 "channels": [
  {
   "name": "IELTS Advantage",
   "url": "https://www.youtube.com/@Ieltsadvantage",
   "lang": "en",
   "why": "구독 510만, 2025~26 최신 영상이 가장 많고 GT 편지·Task 2 첨삭이 강함"
  },
  {
   "name": "E2 IELTS",
   "url": "https://www.youtube.com/@E2IELTS",
   "lang": "en",
   "why": "Jay·Alex 등 전직 채점관급 강사, 리스닝 실전 모의고사와 컴퓨터 시험 팁이 탄탄"
  },
  {
   "name": "Fastrack IELTS",
   "url": "https://www.youtube.com/@FasTrackIELTS",
   "lang": "en",
   "why": "GT 편지(격식·반격식) 단계별 작성과 컴퓨터 시험 화면 안내가 깔끔"
  },
  {
   "name": "English Speaking Success (Keith O'Hare)",
   "url": "https://www.youtube.com/@EnglishSpeakingSuccess",
   "lang": "en",
   "why": "스피킹 전문, 파트2·3 답변 시작법과 확장법이 체계적"
  },
  {
   "name": "IELTS Liz",
   "url": "https://www.youtube.com/@ieltsliz",
   "lang": "en",
   "why": "영상은 오래됐지만 기본기(TFNG, Task 2 서론) 정석, 웹사이트 자료와 함께 보기 좋음"
  },
  {
   "name": "Ross IELTS Academy",
   "url": "https://www.youtube.com/@RossIELTSAcademy",
   "lang": "en",
   "why": "밴드별 실제 스피킹 모의시험+채점 피드백으로 7점 수준을 눈으로 확인"
  },
  {
   "name": "TakeIELTS Official (British Council)",
   "url": "https://www.youtube.com/@BCIELTS",
   "lang": "en",
   "why": "시험 주관사 공식 채널, 형식·채점 기준을 가장 정확하게 확인"
  },
  {
   "name": "IELTS Official",
   "url": "https://www.youtube.com/@IELTSOfficial",
   "lang": "en",
   "why": "IELTS 공식 채널, 컴퓨터 시험 튜토리얼과 최신 변경사항"
  },
  {
   "name": "IELTS English Academy l edm IELTS",
   "url": "https://www.youtube.com/@ieltsenglishacademy",
   "lang": "ko",
   "why": "한국 학원 채널, 한국인 수험자 스피킹 모의시험+피드백(밴드별)이 수백만 조회"
  },
  {
   "name": "1위 해커스유학 (해커스 아이엘츠)",
   "url": "https://www.youtube.com/@해커스유학",
   "lang": "ko",
   "why": "한국어 과목별 강의(리스닝·리딩·라이팅·스피킹) 최신 업로드, 7.0 목표 전략"
  },
  {
   "name": "공수목",
   "url": "https://www.youtube.com/@gongsumoc",
   "lang": "ko",
   "why": "한국어 독학 입문 가이드와 리딩·리스닝 공부 방향 잡기에 좋음"
  }
 ],
 "books": {
  "id": "cambridge-books",
  "score": 4.5,
  "real": "similar",
  "mentions": "many",
  "pros": "실제 시험과 난이도가 가장 비슷하다는 의견이 압도적, 책 점수≈실제 점수 후기 다수(19 일부 테스트는 약간 어렵고 18은 쉬운 편)",
  "cons": "종이 책이라 CD 화면 적응은 안 되고, GT 리딩은 권당 4세트뿐",
  "verdict": "GT 19·20·21을 점수 예측의 기준으로 삼고, 화면 적응은 BC 친숙화·IOT로 보충",
  "sources": [
   "https://www.reddit.com/r/IELTS/comments/1wmgnyg/",
   "https://www.reddit.com/r/IELTS/comments/1x3gqi4/",
   "https://www.reddit.com/r/IELTS/comments/1ditj0z/",
   "https://m.blog.naver.com/alswjd7226/224371609133"
  ]
 }
};
