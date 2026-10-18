/* IELTS General Training — original practice bank (all content written from scratch, 2026-10-18).
   Not taken from or modelled on any published Cambridge / British Council / IDP test. */
(function () {
  var LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
  var PARK_MAP = "[Millbrook Park plan] The main entrance is in the middle of the south (bottom) edge. A straight main path runs north from the entrance to a lake in the centre. " +
    "A = just inside the entrance, left (west) of the path · B = just inside the entrance, right (east) of the path · C = western side of the park, level with the lake · " +
    "D = eastern shore of the lake · E = just north-west of the lake · F = just north-east of the lake · G = north-west corner · H = north-east corner. — ";
  var STUDIO_MAP = "[Hollow Lane Makerspace plan] The street door is in the middle of the south (bottom) wall and opens into reception. A corridor runs north from reception to a back door, which leads out into a courtyard. " +
    "A = just inside the street door, left (west) of reception · B = just inside the street door, right (east) of reception · C = west side of the corridor, halfway along · " +
    "D = east side of the corridor, halfway along · E = north-west corner, beside the back door · F = north-east corner, beside the back door · G = the courtyard, outside the back door. — ";

  window.IELTS_BANK = {
    version: "2026-10-18",

    /* ============================ LISTENING ============================ */
    listening: [
      {
        id: "L1-s1", test: "L1", section: 1,
        title: "Hiring a room for a party",
        context: "생일 파티용 커뮤니티 센터 방 대여 전화 문의 (접수원 ↔ 고객)",
        voices: { A: { lang: "en-GB", pitch: 1.0, rate: 0.95 }, B: { lang: "en-AU", pitch: 1.15, rate: 0.95 } },
        script: [
          { who: "A", text: "Good morning, Riverside Community Centre, Helen speaking. How can I help you?" },
          { who: "B", text: "Oh, hello. I'm calling about hiring a room for a party. A friend of mine held her son's birthday there last year and said it was really good." },
          { who: "A", text: "That's lovely to hear. Yes, we have two rooms available for private hire at weekends: the Main Hall and the Garden Room. Roughly how many guests are you expecting?" },
          { who: "B", text: "Around forty, I think. Forty-five at the very most." },
          { who: "A", text: "In that case I'd suggest the Garden Room. It takes up to fifty people comfortably, and it opens onto the lawn. The Main Hall is really designed for groups of over a hundred, so you'd find it rather empty." },
          { who: "B", text: "The Garden Room sounds perfect. What does it cost?" },
          { who: "A", text: "On Saturdays it's £32 an hour, and on Sundays it's £38, because we have to pay the caretaker extra at the weekend rate." },
          { who: "B", text: "Saturday is what I had in mind anyway. Could I book Saturday the 14th of November? Oh, wait, no. Sorry, the 14th is my sister's graduation. Could we do the 21st instead?" },
          { who: "A", text: "Let me just look. The 21st... yes, the Garden Room is free all day. What times were you thinking of?" },
          { who: "B", text: "From two in the afternoon until six." },
          { who: "A", text: "So that's four hours. There's also a deposit of £60, which we return after the event as long as the room is left tidy. We call it the cleaning deposit, because that's really what it covers." },
          { who: "B", text: "That's fine. Do you need my details now?" },
          { who: "A", text: "Yes, please. Can I take your name?" },
          { who: "B", text: "It's Priya, P-R-I-Y-A, and my surname is Kowalczyk. That's K, O, W, A, L, C, Z, Y, K." },
          { who: "A", text: "Thank you. And a contact number?" },
          { who: "B", text: "My mobile is 07700 900318. Oh, sorry, no, I always get the last part wrong. It's 07700 900381." },
          { who: "A", text: "Got it. Now, a few practical things. There's a small kitchen next to the Garden Room. It has a fridge and a microwave, but I'm afraid there's no oven, so any hot food would need to arrive ready to serve." },
          { who: "B", text: "That's OK, we're ordering from a caterer. What about parking? Some of my relatives are quite elderly." },
          { who: "A", text: "Our own car park is very small and it's reserved for staff on Saturdays, but your guests can use the car park behind the library, just across the road. It's free at weekends. And there's a drop-off space right outside our front door." },
          { who: "B", text: "Perfect. And are we allowed to decorate the room? The children will want balloons everywhere." },
          { who: "A", text: "Balloons and banners are fine, but please attach them with tape only. No pins or nails in the walls, please. They were repainted in the summer." },
          { who: "B", text: "Understood. Is there anything else I need to do to confirm the booking?" },
          { who: "A", text: "I'll email you a booking form this afternoon. We normally ask for it back within ten days, but because your date is quite close, could you return it within five days?" },
          { who: "B", text: "Of course. I'll do it this weekend. Thanks so much for your help, Helen." },
          { who: "A", text: "You're welcome. Enjoy the party." }
        ],
        questions: [
          { n: 1, type: "l-form", q: "Room recommended: the ______ Room", limit: "ONE WORD AND/OR A NUMBER", answer: ["Garden"], why: "Main Hall은 100명 이상용 — 인원(40~45명) 듣고 Garden으로 확정" },
          { n: 2, type: "l-form", q: "Cost on Saturdays: £______ per hour", limit: "ONE WORD AND/OR A NUMBER", answer: ["32", "£32", "thirty-two"], why: "일요일 £38은 숫자 오답 유도, 토요일 요금만" },
          { n: 3, type: "l-form", q: "Date of party: Saturday ______ November", limit: "ONE WORD AND/OR A NUMBER", answer: ["21st", "21", "twenty-first"], why: "'the 14th... no, sorry' 정정 함정 — 21일로 바뀜" },
          { n: 4, type: "l-form", q: "Deposit: £60 (called the ______ deposit)", limit: "ONE WORD AND/OR A NUMBER", answer: ["cleaning"], why: "'left tidy'로 먼저 돌려 말하고 뒤에 'cleaning deposit' 명칭 등장" },
          { n: 5, type: "l-form", q: "Customer's surname: ______", limit: "ONE WORD AND/OR A NUMBER", answer: ["Kowalczyk"], why: "한 글자씩 철자 받아쓰기 — C-Z-Y 순서 주의" },
          { n: 6, type: "l-form", q: "Mobile number: ______", limit: "ONE WORD AND/OR A NUMBER", answer: ["07700 900381", "07700900381"], why: "'900318... sorry' 끝자리 정정 함정 → 381" },
          { n: 7, type: "l-form", q: "Kitchen has a fridge and a ______ (no oven)", limit: "ONE WORD AND/OR A NUMBER", answer: ["microwave"], why: "'no oven'은 부정 — 있는 것은 fridge와 microwave" },
          { n: 8, type: "l-form", q: "Guests should park behind the ______ (free at weekends)", limit: "ONE WORD AND/OR A NUMBER", answer: ["library"], why: "센터 주차장은 직원 전용 — 'behind the library'가 손님용" },
          { n: 9, type: "l-form", q: "Decorations must be attached with ______ only", limit: "ONE WORD AND/OR A NUMBER", answer: ["tape"], why: "'No pins or nails'는 금지 항목, 허용은 tape" },
          { n: 10, type: "l-form", q: "Return the booking form within ______ days", limit: "ONE WORD AND/OR A NUMBER", answer: ["five", "5"], why: "'normally ten days, but...' — but 뒤 5일이 정답" }
        ]
      },

      {
        id: "L1-s2", test: "L1", section: 2,
        title: "Millbrook Park reopening talk",
        context: "리모델링 후 재개장하는 동네 공원 안내 설명회 (공원 관리자 독백, 지도 문제 포함)",
        voices: { A: { lang: "en-GB", pitch: 0.95, rate: 0.95 }, B: { lang: "en-AU", pitch: 1.15, rate: 0.95 } },
        script: [
          { who: "A", text: "Good evening, everyone, and thank you for coming to this information session about Millbrook Park, which reopens to the public next month. My name's Daniel Ford and I'm the park manager." },
          { who: "A", text: "As many of you know, the park has been closed for almost a year. A lot of people assumed this was because of the flooding two winters ago, but in fact the flood damage was repaired quite quickly. The real reason for the long closure was the installation of a completely new drainage system under the main lawns, which meant digging up most of the park. The good news is that the lawns should now stay usable even after heavy rain." },
          { who: "A", text: "Let me tell you about opening hours. From April to September the gates will open at seven in the morning and close at nine at night. In winter, the opening time stays exactly the same, but the closing time will depend on the daylight: we'll lock the gates half an hour after sunset. There'll be a sign at each gate showing that day's closing time." },
          { who: "A", text: "Dog owners will be pleased to hear that we've created a fenced area where dogs can run freely off the lead. Elsewhere in the park, dogs must be kept on a lead, and that includes the lakeside paths. We did consider banning dogs from the lake area altogether, but after the public consultation we decided that wasn't necessary. We'd also considered providing free bags, but for now you'll need to bring your own." },
          { who: "A", text: "We're also looking for volunteers. We've had plenty of people offering to help with gardening, which is wonderful, and our nature walks are already fully staffed by the wildlife trust. What we really need is people to help run the Saturday morning activities for children: story sessions, treasure hunts, that kind of thing. If that sounds like you, please speak to me afterwards." },
          { who: "A", text: "Now, let me show you where things are. Please have a look at the plan on your handout. When you come in through the main entrance, the first building you'll see, immediately on your right, is the new visitor centre. The public toilets are opposite it, on the left of the path." },
          { who: "A", text: "If you carry on up the main path you'll reach the lake. The café has moved. It used to be on the north side of the lake, but it's now on the east shore, so you can sit on the terrace and look across the water towards the sunset." },
          { who: "A", text: "Bike hire is on the opposite side of the park, the western side, in the old bandstand, level with the lake. You can hire bikes by the hour there, and there are child seats available." },
          { who: "A", text: "And finally, the children's playground. Parents told us they were worried about traffic, so we've moved it as far from the road as possible. It's now right up in the north-west corner. The north-east corner, by contrast, has been left as a wildflower meadow, so please keep to the paths there." },
          { who: "A", text: "Two last things. The guided bird walks start again on the first Sunday of next month. They're free, and they leave from the bridge at the southern end of the lake at eight o'clock sharp. Bring binoculars if you have them." },
          { who: "A", text: "And the summer concerts are back. Please note that tickets won't be sold at the visitor centre this year. They're only available online, through the council website, and they tend to sell out fast. Right, are there any questions?" }
        ],
        questions: [
          { n: 11, type: "l-mcq", q: "Why was the park closed for almost a year?", options: ["A  to repair damage caused by flooding", "B  to put in a new drainage system", "C  to build a new visitor centre"], answer: "B", why: "'flooding'은 오답 유도 — 'in fact... the real reason' 뒤가 정답" },
          { n: 12, type: "l-mcq", q: "In winter, the park will", options: ["A  open later in the morning", "B  close at the same time every day", "C  close at a time that depends on sunset"], answer: "C", why: "'opening time stays the same' → A 함정, 'half an hour after sunset' = C" },
          { n: 13, type: "l-mcq", q: "What new arrangement has been made for dogs?", options: ["A  an enclosed area where they can run freely", "B  a ban on dogs near the lake", "C  free bags for dog owners"], answer: "A", why: "'fenced area' = enclosed. 금지·무료 봉투는 '고려했지만 안 함'" },
          { n: 14, type: "l-mcq", q: "The park most urgently needs volunteers to", options: ["A  help with the gardening", "B  lead nature walks", "C  help with children's activities"], answer: "C", why: "gardening·nature walks는 이미 충분 — 'What we really need' 뒤" },
          { n: 15, type: "l-map", q: PARK_MAP + "Visitor centre", options: LETTERS, answer: "B", why: "'immediately on your right' 입구 기준 오른쪽 = B (화장실은 맞은편 A)" },
          { n: 16, type: "l-map", q: PARK_MAP + "Café", options: LETTERS, answer: "D", why: "'used to be on the north side' 과거 위치 함정 → 지금은 east shore" },
          { n: 17, type: "l-map", q: PARK_MAP + "Bike hire", options: LETTERS, answer: "C", why: "'opposite side, western side, level with the lake' = C" },
          { n: 18, type: "l-map", q: PARK_MAP + "Children's playground", options: LETTERS, answer: "G", why: "north-west corner = G. north-east(H)는 wildflower meadow" },
          { n: 19, type: "l-sentence", q: "Bird-watching walks leave from the ______ at 8 am.", limit: "ONE WORD ONLY", answer: ["bridge"], why: "'at the southern end of the lake'는 위치 수식, 핵심 명사는 bridge" },
          { n: 20, type: "l-sentence", q: "Tickets for the summer concerts can only be bought ______.", limit: "ONE WORD ONLY", answer: ["online"], why: "'won't be sold at the visitor centre' 부정 함정 → online" }
        ]
      },

      {
        id: "L1-s3", test: "L1", section: 3,
        title: "Business plan: a campus clothing repair service",
        context: "경영 수업 과제(캠퍼스 옷 수선 서비스 사업계획서)에 대한 지도교수 피드백 — 학생 2명 + 교수",
        voices: { A: { lang: "en-GB", pitch: 0.9, rate: 0.95 }, B: { lang: "en-AU", pitch: 1.2, rate: 0.98 }, C: { lang: "en-US", pitch: 1.0, rate: 1.0 } },
        script: [
          { who: "A", text: "Come in, both of you. Have a seat. So, I've read the draft of your business plan for the repair service. Remind me of the basic idea in a sentence or two?" },
          { who: "B", text: "Sure. It's called Second Stitch. Students bring in clothes that need mending, like broken zips, holes, hems that have come down, and we fix them for a small fee. Originally we wanted to sell second-hand clothes as well, but we dropped that part." },
          { who: "C", text: "Yeah. There are already two charity shops right next to the campus, and they're really cheap, so we just didn't think we could compete with them." },
          { who: "B", text: "Storage would have been a headache as well, to be honest, but that wasn't really what decided it." },
          { who: "A", text: "That seems sensible. Where will you actually operate from?" },
          { who: "C", text: "The student union building, two afternoons a week. We asked the library first, because it's so central, but they won't allow sewing machines because of the noise. And renting a shop was never realistic." },
          { who: "A", text: "And the name, Second Stitch. It's memorable and it does say what you do. My only concern is whether somebody else is already trading under it. Have you checked?" },
          { who: "B", text: "Not yet. We'll do that this week." },
          { who: "A", text: "Please do. Now, the market research. How did you collect your data?" },
          { who: "C", text: "We did an online questionnaire over one week and got two hundred and twelve responses. We did try running a stall in the canteen first, but hardly anyone stopped, so we gave up after a day." },
          { who: "A", text: "Two hundred is a decent sample. But the conclusions go well beyond what the figures show. You write that most students would use the service regularly, yet your survey only asked whether they'd ever needed a repair. You need some evidence that they'd actually be willing to pay for one." },
          { who: "B", text: "That's fair. We could add a question about price and run it again." },
          { who: "A", text: "Which brings me to pricing. Honestly, this is the best section in the whole plan. You've compared high-street tailors, you've costed your thread and zips and your own time. It's really thorough." },
          { who: "C", text: "Thanks. Mina did most of that." },
          { who: "A", text: "The marketing plan, on the other hand, goes on for six pages, and half of it repeats the market research. The content is fine, but I'd cut it down to about two pages." },
          { who: "B", text: "OK, we can merge some of it." },
          { who: "A", text: "And the risk section. The content is sensible, but at the moment it's right at the end, after the financial tables. Readers want to know early on what could go wrong, so I'd put it straight after the summary." },
          { who: "C", text: "Should we add diagrams anywhere? We weren't sure." },
          { who: "A", text: "Your charts are already clear, so I wouldn't worry about that. What I would like, before the final submission, is for you to run a small trial. Offer free repairs for one afternoon and record exactly how long each job takes. At the moment your time estimates are guesses." },
          { who: "B", text: "That's a good idea. We could do it next week." },
          { who: "A", text: "Good. The final deadline is the 3rd of May, but I'd like to see a revised draft by the 19th of April, so there's time for one more round of comments." },
          { who: "C", text: "Great. Thanks, Dr Wells." }
        ],
        questions: [
          { n: 21, type: "l-mcq", q: "Why did the students decide not to sell second-hand clothes?", options: ["A  They had nowhere to store them.", "B  Similar shops nearby were too strong to compete with.", "C  The clothes would have cost too much to buy."], answer: "B", why: "storage는 'wasn't really what decided it' — 결정 이유는 charity shops" },
          { n: 22, type: "l-mcq", q: "Where will the service be based?", options: ["A  in the library", "B  in the student union building", "C  in a rented shop"], answer: "B", why: "library는 소음 때문에 거절, 상점 임대는 비현실적" },
          { n: 23, type: "l-mcq", q: "What does the tutor say about the name Second Stitch?", options: ["A  It does not explain the service clearly.", "B  It is too similar to a well-known brand.", "C  The students should check it is not already in use."], answer: "C", why: "'it does say what you do' → A 반대. 'somebody else trading under it' = 사용 중인지 확인" },
          { n: 24, type: "l-mcq", q: "How did the students collect most of their survey data?", options: ["A  through an online questionnaire", "B  through face-to-face interviews", "C  at a stall in the canteen"], answer: "A", why: "canteen stall은 하루 만에 포기 — 오답 유도" },
          { n: 25, type: "l-match", q: "Tutor's comment on — Market research", options: ["A  needs more supporting evidence", "B  should be made shorter", "C  is the strongest part", "D  should be moved earlier", "E  needs clearer charts"], answer: "A", why: "'need some evidence that they'd actually pay' = more supporting evidence" },
          { n: 26, type: "l-match", q: "Tutor's comment on — Pricing", options: ["A  needs more supporting evidence", "B  should be made shorter", "C  is the strongest part", "D  should be moved earlier", "E  needs clearer charts"], answer: "C", why: "'the best section in the whole plan' = strongest part" },
          { n: 27, type: "l-match", q: "Tutor's comment on — Marketing plan", options: ["A  needs more supporting evidence", "B  should be made shorter", "C  is the strongest part", "D  should be moved earlier", "E  needs clearer charts"], answer: "B", why: "'six pages... cut it down to about two' = shorter" },
          { n: 28, type: "l-match", q: "Tutor's comment on — Risk section", options: ["A  needs more supporting evidence", "B  should be made shorter", "C  is the strongest part", "D  should be moved earlier", "E  needs clearer charts"], answer: "D", why: "'straight after the summary' = earlier. E(charts)는 '이미 clear' 오답" },
          { n: 29, type: "l-sentence", q: "Before the final submission, the students will run a ______ to measure how long repairs take.", limit: "ONE WORD ONLY", answer: ["trial"], why: "'Offer free repairs for one afternoon' 설명보다 앞의 명사 trial을 잡아야 함" },
          { n: 30, type: "l-sentence", q: "The revised draft must be handed in by the ______ of April.", limit: "ONE WORD AND/OR A NUMBER", answer: ["19th", "19", "nineteenth"], why: "3rd of May는 최종 마감 — 수정본은 19th of April" }
        ]
      },

      {
        id: "L1-s4", test: "L1", section: 4,
        title: "Lecture: cooling the city",
        context: "도시 열섬 현상의 원인과 해결책에 대한 대학 강의 (노트 완성)",
        voices: { A: { lang: "en-GB", pitch: 1.05, rate: 0.93 }, B: { lang: "en-AU", pitch: 1.15, rate: 0.95 } },
        script: [
          { who: "A", text: "Good morning. Today we're looking at what's known as the urban heat island effect: the fact that cities are often several degrees warmer than the countryside around them. I'll look at the causes first, and then at some of the solutions that cities are experimenting with." },
          { who: "A", text: "Let's start with the causes. The first is simply the materials we build with. Concrete, brick and particularly asphalt absorb heat during the day and then release it slowly after sunset. That's why the difference between city and countryside is usually greatest not at midday, as most people expect, but at night. And that matters for health, because people who can't cool down at night sleep badly and are more vulnerable during heatwaves." },
          { who: "A", text: "The second cause is the shape of the city itself. Tall buildings on both sides of a narrow street create what are known as canyons. Heat reflected from one wall simply hits the opposite wall, and the air between them can't circulate properly." },
          { who: "A", text: "Third, there's waste heat from human activity: from cars, from factories, and increasingly from air-conditioning units, which of course push hot air out into the street while they cool the inside of a building. There's a rather cruel irony there: the hotter the city gets, the more air conditioning we use, and the hotter the street becomes." },
          { who: "A", text: "And finally, there's the lack of vegetation. Plants cool the air around them by releasing water vapour through their leaves, and turning water into vapour takes energy, in the form of heat, from the surrounding air. A city with few plants loses this natural cooling system." },
          { who: "A", text: "So, what can be done? The most obvious solution is planting trees. One study found that streets with good tree cover were up to four degrees cooler on summer afternoons than similar streets without trees. But trees take decades to mature, and they need space underground for their roots, space that in older cities is usually taken up by cables and pipes." },
          { who: "A", text: "A faster option is what's called the cool roof. This simply means painting a roof white or covering it with a reflective coating. It's cheap, and it can lower the temperature in a top-floor flat considerably. However, in cities with cold winters there's a downside: the building may need more heating in winter, because it no longer absorbs the sun's warmth." },
          { who: "A", text: "Green roofs, that is, roofs covered with soil and plants, go further. They cool the building, but they also absorb rainwater, which reduces the risk of flooding in the streets below. Their main disadvantage is weight. Many older buildings simply can't support them without expensive strengthening work." },
          { who: "A", text: "Then there are pavements. Engineers are now testing permeable surfaces, which allow rainwater to drain through into a layer underneath, where it is stored and later evaporates, cooling the street above, much as plants do." },
          { who: "A", text: "Finally, the point I most want you to take away. None of these measures works well on its own. The cities that have achieved real reductions combine several of them, and, crucially, they involve local residents in deciding where trees and green spaces should go. Projects that are simply imposed from above tend to be neglected. Newly planted trees often die in their first summer because nobody feels responsible for watering them. Next week, we'll look at some case studies in detail." }
        ],
        questions: [
          { n: 31, type: "l-form", q: "Building materials release stored heat slowly, so the city–countryside difference is greatest at ______.", limit: "ONE WORD ONLY", answer: ["night"], why: "'not at midday, as most people expect' 예상 뒤집기 함정" },
          { n: 32, type: "l-form", q: "Tall buildings along narrow streets form ______ that trap heat.", limit: "ONE WORD ONLY", answer: ["canyons"], why: "'what are known as' 뒤 전문용어 — 복수형 s 주의" },
          { n: 33, type: "l-form", q: "Waste heat comes from cars, factories and air-conditioning ______.", limit: "ONE WORD ONLY", answer: ["units"], why: "air-conditioning 뒤 명사 units — 'air conditioning'만 쓰면 오답" },
          { n: 34, type: "l-form", q: "Plants cool the air by releasing water ______.", limit: "ONE WORD ONLY", answer: ["vapour", "vapor"], why: "'through their leaves'는 부가 정보, 빈칸은 vapour (vapor 철자도 인정)" },
          { n: 35, type: "l-form", q: "Trees: roots need space underground, often occupied by cables and ______.", limit: "ONE WORD ONLY", answer: ["pipes"], why: "'taken up by' = occupied by 패러프레이즈" },
          { n: 36, type: "l-form", q: "Cool roofs — drawback in cold climates: more ______ needed in winter.", limit: "ONE WORD ONLY", answer: ["heating"], why: "'However... downside' 신호어 뒤" },
          { n: 37, type: "l-form", q: "Green roofs absorb rainwater, which reduces the risk of ______.", limit: "ONE WORD ONLY", answer: ["flooding"], why: "'in the streets below' 앞 명사 — floods 아닌 flooding" },
          { n: 38, type: "l-form", q: "Main disadvantage of green roofs: their ______.", limit: "ONE WORD ONLY", answer: ["weight"], why: "'expensive strengthening'은 결과 — 원인 명사는 weight" },
          { n: 39, type: "l-form", q: "Permeable pavements store rainwater, which later ______ and cools the street.", limit: "ONE WORD ONLY", answer: ["evaporates", "evaporate"], why: "'drain through'는 앞단계 함정, 냉각은 evaporates" },
          { n: 40, type: "l-form", q: "Successful cities involve local ______ in deciding where trees go.", limit: "ONE WORD ONLY", answer: ["residents"], why: "'imposed from above'와 대비되는 주체 — residents" }
        ]
      },

      /* ---------------- TEST 2 ---------------- */
      {
        id: "L2-s1", test: "L2", section: 1,
        title: "Reporting a bag left on a train",
        context: "기차에 두고 내린 가방 분실물 신고 전화 (분실물 센터 직원 ↔ 승객)",
        voices: { A: { lang: "en-IE", g: "m", pitch: 0.9, rate: 0.95 }, B: { lang: "en-AU", g: "f", pitch: 1.15, rate: 0.97 } },
        script: [
          { who: "A", text: "Good afternoon, Northline Rail lost property, Declan speaking. How can I help?" },
          { who: "B", text: "Oh, hello. I left a bag on one of your trains yesterday evening, and I'm really hoping someone has handed it in." },
          { who: "A", text: "Well, you've come to the right place. Let me take a few details, and I'll search our system while we talk. Which journey were you on?" },
          { who: "B", text: "I got on at Ashford and travelled into the city. I was supposed to be on the 5.40, but that one was cancelled, so in the end I caught the 6.10." },
          { who: "A", text: "The 6.10 from Ashford, yesterday, Tuesday. And can you remember where you were sitting?" },
          { who: "B", text: "Yes, I was in the quiet coach, right at the back of the train. I put the bag on the rack above my seat and then completely forgot about it when I got off. I was on the phone, which didn't help." },
          { who: "A", text: "It happens more often than you'd think. Can you describe the bag for me?" },
          { who: "B", text: "It's a canvas tote bag, quite a big one. It's dark green with brown leather handles, and it's got the name of a bookshop printed on the side: Pageturner, all one word." },
          { who: "A", text: "Pageturner. Lovely. And what was inside it?" },
          { who: "B", text: "My laptop, which is in a black padded sleeve, a grey wool scarf, and a plastic folder full of sketches. I'm studying design, so honestly the sketches matter to me more than the laptop. They're for an assessment next week." },
          { who: "A", text: "Right. I can see we've had three green bags logged since yesterday afternoon. One of them was found on the 6.10, and the note mentions a laptop, so that looks very promising. I just need to take your details so I can match it to you. Your name, please?" },
          { who: "B", text: "Rosalind Thackeray." },
          { who: "A", text: "Could you spell the surname for me?" },
          { who: "B", text: "Of course. T, H, A, C, K, E, R, A, Y." },
          { who: "A", text: "Thank you. And your postcode?" },
          { who: "B", text: "It's BN2 7QD. Oh, hang on, no, that was my old flat. It's BN2 7QB now. B as in Bravo." },
          { who: "A", text: "BN2 7QB. Got it. And a phone number in case we need to reach you?" },
          { who: "B", text: "It's 07781 446205." },
          { who: "A", text: "Thanks. Now, before you come in, there are a couple of things you should know. We make a small handling charge when you collect an item. For most things it's three pounds, but where the item is electronic, or the bag contains anything electronic, it's eight pounds, because of the extra security checks we have to do." },
          { who: "B", text: "So it'll be eight pounds for me, then, because of the laptop. That's fine." },
          { who: "A", text: "As for where to collect it: our office used to be in the main ticket hall, but it moved last month. It's now on the lower level, next to the taxi rank. If you come through the ticket barriers and follow the signs for taxis, you'll walk straight past us." },
          { who: "B", text: "Next to the taxi rank. And when are you open?" },
          { who: "A", text: "Monday to Saturday, eight till seven. We're closed on Sundays." },
          { who: "B", text: "I'll come in tomorrow after college. Do I need to bring anything?" },
          { who: "A", text: "You'll need some photo ID, a passport or a driving licence. And because there's a laptop involved, we'll ask you to unlock it in front of us. That's just to prove it's really yours. You'd be surprised how many people try to claim things that don't belong to them." },
          { who: "B", text: "That makes sense. I can do that." },
          { who: "A", text: "And one last thing. We only keep items for twenty-eight days, but as you're coming tomorrow, that won't be a problem." },
          { who: "B", text: "Brilliant. Thank you so much, Declan. You've made my day." }
        ],
        questions: [
          { n: 1, type: "l-form", q: "Train caught: the ______ from Ashford", limit: "ONE WORD AND/OR A NUMBER", answer: ["6.10", "6:10", "ten past six"], why: "5.40은 취소된 열차 — 'in the end I caught the 6.10'" },
          { n: 2, type: "l-form", q: "Seat: in the ______ coach", limit: "ONE WORD AND/OR A NUMBER", answer: ["quiet"], why: "'right at the back of the train'은 위치 부연, 칸 이름은 quiet" },
          { n: 3, type: "l-form", q: "Bag: large canvas ______ bag, dark green", limit: "ONE WORD AND/OR A NUMBER", answer: ["tote"], why: "'canvas tote bag' — leather는 손잡이 재질이라 오답" },
          { n: 4, type: "l-form", q: "Name printed on the side: ______", limit: "ONE WORD AND/OR A NUMBER", answer: ["Pageturner"], why: "'all one word' — Page turner로 띄우면 오답" },
          { n: 5, type: "l-form", q: "Contents: laptop, grey wool scarf, folder of ______", limit: "ONE WORD AND/OR A NUMBER", answer: ["sketches"], why: "'a plastic folder full of sketches' — 노트북 슬리브 색(black)은 다른 항목" },
          { n: 6, type: "l-form", q: "Surname: ______", limit: "ONE WORD AND/OR A NUMBER", answer: ["Thackeray"], why: "한 글자씩 철자 — C-K 연속, 끝은 -RAY" },
          { n: 7, type: "l-form", q: "Postcode: ______", limit: "ONE WORD AND/OR A NUMBER", answer: ["BN2 7QB", "BN27QB"], why: "'7QD... that was my old flat' 정정 함정 — B as in Bravo" },
          { n: 8, type: "l-form", q: "Handling charge to pay: £______", limit: "ONE WORD AND/OR A NUMBER", answer: ["eight", "8", "£8"], why: "'For most things it's three pounds' — 노트북(전자제품)이 있어 8파운드" },
          { n: 9, type: "l-form", q: "Office location: lower level, next to the ______ rank", limit: "ONE WORD AND/OR A NUMBER", answer: ["taxi"], why: "'used to be in the main ticket hall' — 지난달 옮기기 전 위치 함정" },
          { n: 10, type: "l-form", q: "Bring photo ID and be ready to ______ the laptop", limit: "ONE WORD AND/OR A NUMBER", answer: ["unlock"], why: "'unlock it in front of us' — 본인 소유 증명 방법" }
        ]
      },

      {
        id: "L2-s2", test: "L2", section: 2,
        title: "Open day at the Hollow Lane Makerspace",
        context: "동네 공유 공방(메이커스페이스) 오픈데이 안내 (코디네이터 독백, 평면도 문제 포함)",
        voices: { A: { lang: "en-AU", g: "f", pitch: 1.1, rate: 0.95 } },
        script: [
          { who: "A", text: "Hi, everyone, and welcome to the open day here at the Hollow Lane Makerspace. I'm Tamsin Reilly, and I'm the coordinator. In a moment I'll take you round the building, but first let me tell you a little about how we got here and how membership works." },
          { who: "A", text: "The building you're standing in was a bakery for almost sixty years, and when it closed, the council planned to sell it to a developer for flats. What actually saved it wasn't a council grant, as people often assume. It was a group of local residents who raised the money themselves through a community share offer. More than four hundred people each bought a small stake in the building, so in a very real sense the place belongs to the neighbourhood." },
          { who: "A", text: "Now, membership. A lot of people expect a monthly subscription, and we did think about that, but in the end we went for something more flexible. You buy a card of ten visits for forty pounds, and you use the visits whenever you like over the year. There's no joining fee. The one thing we do insist on is that before you use any of the powered machines, you attend a short safety induction. Those run every Wednesday evening, and they're free, but they must be booked in advance, because we keep the groups very small." },
          { who: "A", text: "Right, let me explain the layout. If you look at the plan in your welcome pack, you'll see we're in reception, just inside the street door. The corridor in front of us runs straight up to the back door, which leads out to the courtyard." },
          { who: "A", text: "Immediately on your left as you came in is the tool library. Members can borrow drills, sanders, ladders, that kind of thing, for up to a week at a time. The idea is that it saves you buying something you'll only use twice a year. On the right of reception is the office, and that's where you'll find me most days." },
          { who: "A", text: "Halfway down the corridor, on the right-hand side, is the sewing studio. We've got eight sewing machines, two overlockers and a large cutting table. When we first opened, the studio was on the left, in the room opposite, but we swapped the rooms over because the right-hand room gets much better natural light, and that really matters when you're matching colours." },
          { who: "A", text: "So what's in the room on the left now? That's the laser cutter. It's noisy and it needs proper ventilation, so it's in the room with an extraction fan fitted to the outside wall." },
          { who: "A", text: "At the far end of the corridor, in the north-east corner beside the back door, is the kitchen. Members can make tea and coffee there, and there's a fridge for your lunch. Please do label anything you put in it. The north-west corner is our storeroom, which is staff only." },
          { who: "A", text: "And finally, out in the courtyard, we've got the pottery kiln. It was originally going to go inside, but our insurers wouldn't allow it in the main building, so it lives in its own little shed out there." },
          { who: "A", text: "A couple of dates for your diaries before we start the tour. Our repair café, where volunteers help people fix broken household items and clothes, runs on the last Saturday of every month. Bring along anything that needs mending, from a toaster to a torn coat. And in June we're holding a weekend exhibition of members' work in the courtyard. If you'd like to take part, entries close at the end of April, and you'll need to send us a photo of your piece by email. We're not accepting entries on paper this year." },
          { who: "A", text: "OK, follow me, and mind the step." }
        ],
        questions: [
          { n: 11, type: "l-mcq", q: "What saved the building from being sold?", options: ["A  a grant from the council", "B  an agreement with a developer", "C  money raised by local people"], answer: "C", why: "'wasn't a council grant, as people often assume' — 주민 community share offer가 정답" },
          { n: 12, type: "l-mcq", q: "How do members pay to use the makerspace?", options: ["A  by monthly subscription", "B  by buying a card for a set number of visits", "C  by paying a joining fee and an hourly rate"], answer: "B", why: "monthly subscription은 '생각했지만 안 함', 'a card of ten visits'" },
          { n: 13, type: "l-mcq", q: "What does the speaker say about the safety inductions?", options: ["A  They are only needed for the laser cutter.", "B  They must be reserved beforehand.", "C  There is a small charge for them."], answer: "B", why: "'they're free' → C 함정, 'must be booked in advance' = reserved beforehand" },
          { n: 14, type: "l-mcq", q: "According to the speaker, the main benefit of the tool library is that members", options: ["A  avoid buying tools they rarely need.", "B  can be trained to use new tools.", "C  can keep tools for as long as they like."], answer: "A", why: "'saves you buying something you'll only use twice a year' — 대여는 최대 1주라 C 오답" },
          { n: 15, type: "l-map", q: STUDIO_MAP + "Tool library", options: LETTERS.slice(0, 7), answer: "A", why: "'Immediately on your left as you came in' = A (오른쪽 B는 office)" },
          { n: 16, type: "l-map", q: STUDIO_MAP + "Sewing studio", options: LETTERS.slice(0, 7), answer: "D", why: "'was on the left'은 처음 위치 함정 — 지금은 복도 중간 오른쪽(east) D" },
          { n: 17, type: "l-map", q: STUDIO_MAP + "Laser cutter", options: LETTERS.slice(0, 7), answer: "C", why: "'the room on the left now' — 재봉실과 맞바꾼 복도 중간 왼쪽 C" },
          { n: 18, type: "l-map", q: STUDIO_MAP + "Pottery kiln", options: LETTERS.slice(0, 7), answer: "G", why: "'originally going to go inside' 함정 — 보험 문제로 courtyard(G)" },
          { n: 19, type: "l-sentence", q: "The repair café takes place on the ______ Saturday of every month.", limit: "ONE WORD ONLY", answer: ["last"], why: "'on the last Saturday of every month' — June 전시와 혼동 주의" },
          { n: 20, type: "l-sentence", q: "Photos for the exhibition must be sent by ______.", limit: "ONE WORD ONLY", answer: ["email", "e-mail"], why: "'not accepting entries on paper' 부정 함정 → by email" }
        ]
      },

      {
        id: "L2-s3", test: "L2", section: 3,
        title: "Planning a deadstock capsule collection",
        context: "패션디자인 지속가능성 모듈 과제(데드스톡 원단 캡슐 컬렉션) 기획 상담 — 학생 2명 + 지도교수",
        voices: { A: { lang: "en-GB", g: "f", pitch: 1.0, rate: 0.95 }, B: { lang: "en-AU", g: "f", pitch: 1.2, rate: 0.98 }, C: { lang: "en-US", g: "m", pitch: 0.9, rate: 1.0 } },
        script: [
          { who: "A", text: "Come in, both of you. So, you're here to talk me through the plan for your capsule collection, the one for the sustainable design module. Remind me of the brief you set yourselves." },
          { who: "B", text: "So the idea is a collection of six pieces made entirely from deadstock, that's fabric left over in factories, or that brands ordered and never used. We started out wanting to cut up second-hand clothes instead, but we dropped that." },
          { who: "C", text: "Mostly because every garment's a different size and a different fabric, so you can't cut a pattern consistently. We'd have ended up with six one-off pieces rather than a collection that hangs together. Cleaning everything was a pain as well, but that wasn't the main reason." },
          { who: "A", text: "Fair enough. And where are you sourcing the deadstock?" },
          { who: "C", text: "We've been to four places. There's a wholesaler in the city that sells end-of-roll fabric, a curtain factory that's closing down, a uniform company that changed supplier and has rolls of navy twill it can't use, and a mill shop out of town." },
          { who: "A", text: "Interesting. What have you decided about each of them?" },
          { who: "B", text: "The wholesaler's stock is lovely, but most of the rolls are only two or three metres long, so we'll use those for the small details: pockets, collars, facings, maybe the odd lining." },
          { who: "A", text: "Sensible." },
          { who: "C", text: "The uniform twill is the opposite. There's loads of it, far more than we could ever need, so there's no question of buying extra, and it's a really solid fabric. That's going to be the main fabric for the jackets and trousers." },
          { who: "A", text: "And the curtain factory?" },
          { who: "B", text: "That's the tricky one. They've got a heavy cotton jacquard with a fantastic woven pattern, but curtain fabric isn't designed to go in a washing machine, so we don't know how it'll behave. Before we commit, we're going to wash some samples and measure how much they shrink." },
          { who: "A", text: "Good. Do that before you buy any quantity. And the mill shop?" },
          { who: "C", text: "They had some polyester satin that looked great, but we've ruled it out completely. It's a blend we couldn't recycle at the end of the garment's life, and that goes against the whole point of the project." },
          { who: "A", text: "I'm glad you've thought about end of life. Now, the target customer. In your proposal you describe them as eighteen to twenty-five year olds, and I'm not convinced." },
          { who: "B", text: "Because of the price?" },
          { who: "A", text: "Partly. Your costings put the jacket at around two hundred pounds. And the tailoring, the twill, the jacquard: it all feels rather more grown-up. I'd look again at that age range, or at least justify it with some evidence." },
          { who: "C", text: "We could run a short survey at the graduate show, maybe." },
          { who: "A", text: "Possibly. What about the presentation? The module asks for a lookbook and a short written report." },
          { who: "B", text: "We were going to photograph the pieces in the studio, but we think it'd say more if we shot them in the uniform company's warehouse, with the rolls of fabric in the background. It tells the story of where the material came from." },
          { who: "A", text: "I like that very much. Have you asked their permission?" },
          { who: "C", text: "Not yet. I'll email them this afternoon." },
          { who: "A", text: "Do. Now, what I'd like to see more of in the report is the process. At the moment there's plenty about the finished designs and hardly anything about the problems you've run into along the way. The examiners on this module care a great deal about reflection. Keep a diary, with photographs, of every decision and every mistake." },
          { who: "B", text: "Even the mistakes?" },
          { who: "A", text: "Especially the mistakes. That's where the learning shows. And keep a careful note of the length of every piece of fabric you use and every offcut you throw away. If you can show how little you wasted, that's a strong point in a sustainability project." },
          { who: "C", text: "OK. So a waste record as well as the diary." },
          { who: "A", text: "Exactly. When's the toile fitting?" },
          { who: "B", text: "We'd planned it for the fourteenth of March, but the studio's booked that day, so it'll be the twenty-first." },
          { who: "A", text: "Fine. Send me some photos of the toiles afterwards and I'll comment by email." },
          { who: "C", text: "Great. Thanks, Dr Haddad." }
        ],
        questions: [
          { n: 21, type: "l-mcq", q: "Why did the students decide not to use second-hand clothes?", options: ["A  Cleaning the garments would take too long.", "B  The pieces would not form a consistent collection.", "C  They could not find enough suitable garments."], answer: "B", why: "cleaning은 'wasn't the main reason' — 핵심은 'six one-off pieces rather than a collection'" },
          { n: 22, type: "l-mcq", q: "What is the tutor's opinion of the target customer?", options: ["A  The age group may not suit the product.", "B  The price is too low for the age group.", "C  The collection should also target men."], answer: "A", why: "200파운드·'more grown-up' → 'look again at that age range'. 가격은 낮은 게 아니라 높음" },
          { n: 23, type: "l-mcq", q: "Why do the students want to take photographs in the warehouse?", options: ["A  It would cost less than using the studio.", "B  It would show the origin of the fabric.", "C  The lighting there is better."], answer: "B", why: "'tells the story of where the material came from' = origin" },
          { n: 24, type: "l-mcq", q: "The tutor says the written report needs more about", options: ["A  the finished designs.", "B  the difficulties met during the process.", "C  similar collections by other designers."], answer: "B", why: "'plenty about the finished designs' → A 함정, 'problems you've run into' = difficulties" },
          { n: 25, type: "l-match", q: "Decision about fabric from — the city wholesaler", options: ["A  use only for small details", "B  use as the main fabric", "C  test before deciding", "D  reject completely", "E  order a larger quantity"], answer: "A", why: "2~3미터 짜투리 → 'pockets, collars, facings' = small details" },
          { n: 26, type: "l-match", q: "Decision about fabric from — the uniform company", options: ["A  use only for small details", "B  use as the main fabric", "C  test before deciding", "D  reject completely", "E  order a larger quantity"], answer: "B", why: "'main fabric for the jackets and trousers'. 'no question of buying extra' → E 함정" },
          { n: 27, type: "l-match", q: "Decision about fabric from — the curtain factory", options: ["A  use only for small details", "B  use as the main fabric", "C  test before deciding", "D  reject completely", "E  order a larger quantity"], answer: "C", why: "'Before we commit... wash some samples and measure' = test first" },
          { n: 28, type: "l-match", q: "Decision about fabric from — the mill shop", options: ["A  use only for small details", "B  use as the main fabric", "C  test before deciding", "D  reject completely", "E  order a larger quantity"], answer: "D", why: "'ruled it out completely' — 재활용 불가 혼방" },
          { n: 29, type: "l-sentence", q: "As well as a diary, the students will keep a ______ record.", limit: "ONE WORD ONLY", answer: ["waste"], why: "'every offcut you throw away' → 'a waste record as well as the diary'" },
          { n: 30, type: "l-sentence", q: "The toile fitting will now take place on the ______ of March.", limit: "ONE WORD AND/OR A NUMBER", answer: ["twenty-first", "21st", "21"], why: "14일은 스튜디오 예약으로 무산 — 정정된 21일" }
        ]
      },

      {
        id: "L2-s4", test: "L2", section: 4,
        title: "Lecture: learning from nature — biomimicry",
        context: "자연의 원리를 디자인에 옮기는 바이오미미크리 — 대학 강의 (노트 완성)",
        voices: { A: { lang: "en-US", g: "m", pitch: 0.95, rate: 0.93 } },
        script: [
          { who: "A", text: "Good afternoon. Today I want to introduce biomimicry, the practice of looking to living things for solutions to design problems. Now, people have always copied nature in a loose sort of way, but biomimicry is more specific than that. It means studying how an organism actually solves a problem, the underlying mechanism, rather than simply copying its appearance. A building shaped like a shell isn't biomimicry. A building that controls its temperature the way an animal does might well be." },
          { who: "A", text: "Let me start with probably the best-known example, the hook-and-loop fastener. In the 1940s, a Swiss engineer coming back from a walk with his dog noticed that burrs, the seed heads of a common plant, had stuck to his trousers and to the dog's fur. Under a microscope, he saw that each burr was covered in tiny hooks that caught on loops of fibre. It took him years to reproduce this in nylon, and the fashion industry initially dismissed the product as ugly. Its first real success came not in clothing at all, but in the space programme, where astronauts needed a simple way to attach objects to surfaces in zero gravity." },
          { who: "A", text: "A second example concerns surfaces. The leaves of the lotus plant stay remarkably clean, even in muddy water. For a long time, people assumed this was because the leaves were extremely smooth. In fact, the opposite is true. The surface is covered in microscopic bumps coated with wax. Water droplets can't spread out on it, so they roll off and carry the dirt away with them. This principle has been used in self-cleaning paints and glass, and more recently in textile finishes that resist stains." },
          { who: "A", text: "Third, transport. When high-speed trains in Japan first entered tunnels, they pushed a wave of air pressure ahead of them, which produced a loud boom at the tunnel exit and disturbed people living nearby. An engineer who happened to be a keen birdwatcher thought about the kingfisher, which dives from air into water, a much denser medium, with hardly any splash. The secret is its long, narrow beak. Redesigning the nose of the train to resemble the beak reduced the noise and, as an unexpected bonus, cut the train's energy use as well." },
          { who: "A", text: "Architecture gives us a fourth example. Some species of termite build large mounds in which the temperature stays fairly constant, even though the temperature outside varies enormously between day and night. The secret is a network of tunnels through which air circulates. An office building in Zimbabwe used a similar principle, with chimneys and vents in place of tunnels, and it uses a fraction of the energy of a conventional building of the same size, because it has no conventional air-conditioning." },
          { who: "A", text: "Now, I don't want to give you the impression that biomimicry always works. There are some important limitations. The first is scale. Something that works for a burr a few millimetres across won't necessarily work for an object a thousand times bigger. The second is materials. Nature builds at normal temperatures, from a small range of ingredients, mostly proteins and minerals, whereas we rely on high temperatures and on materials such as plastics and metals. So a natural mechanism usually has to be translated rather than copied." },
          { who: "A", text: "And the final limitation, which I think is the most interesting, is that copying a single feature can miss the point. Every organism is the product of trade-offs. The kingfisher's beak is excellent for diving, but it would be useless for, say, cracking seeds. Designers who borrow one feature without understanding the whole system are often disappointed. So the real lesson of biomimicry may be less about individual inventions and more about a way of thinking: asking how a system as a whole uses energy and materials efficiently. Next week, we'll look at how that thinking is being applied to entire cities." }
        ],
        questions: [
          { n: 31, type: "l-form", q: "Biomimicry: copying the underlying ______ an organism uses, not just its appearance.", limit: "ONE WORD ONLY", answer: ["mechanism"], why: "'the underlying mechanism, rather than simply copying its appearance'" },
          { n: 32, type: "l-form", q: "Hook-and-loop fastener: inspired by ______ stuck to trousers and fur.", limit: "ONE WORD ONLY", answer: ["burrs"], why: "'seed heads'는 burrs의 풀이 — 복수형 s 주의" },
          { n: 33, type: "l-form", q: "First real success: in the ______ programme.", limit: "ONE WORD ONLY", answer: ["space"], why: "fashion industry는 처음에 'ugly'라고 외면 — 'not in clothing at all'" },
          { n: 34, type: "l-form", q: "Lotus leaf: surface has microscopic ______ coated with wax.", limit: "ONE WORD ONLY", answer: ["bumps"], why: "'extremely smooth'는 통념 함정 — 'the opposite is true'" },
          { n: 35, type: "l-form", q: "Now used in textile finishes that resist ______.", limit: "ONE WORD ONLY", answer: ["stains"], why: "paints·glass 다음 'more recently in textile finishes'" },
          { n: 36, type: "l-form", q: "Trains entering tunnels caused a loud ______ at the exit.", limit: "ONE WORD ONLY", answer: ["boom"], why: "'wave of air pressure'는 원인, 소리는 boom" },
          { n: 37, type: "l-form", q: "Train nose redesigned to resemble the beak of the ______.", limit: "ONE WORD ONLY", answer: ["kingfisher"], why: "birdwatcher는 엔지니어 취미 — 새 이름은 kingfisher" },
          { n: 38, type: "l-form", q: "Termite mounds: air circulates through a network of ______.", limit: "ONE WORD ONLY", answer: ["tunnels"], why: "'chimneys and vents'는 짐바브웨 건물 쪽 — 흰개미 집은 tunnels" },
          { n: 39, type: "l-form", q: "Nature builds mainly from proteins and ______.", limit: "ONE WORD ONLY", answer: ["minerals"], why: "plastics·metals는 인간 쪽 재료 — 대비 함정" },
          { n: 40, type: "l-form", q: "Organisms are the product of ______, so copying one feature can fail.", limit: "ONE WORD ONLY", answer: ["trade-offs", "tradeoffs", "trade offs"], why: "'Every organism is the product of trade-offs' — 물총새 부리 예시" }
        ]
      }
    ],

    /* ============================ READING (GT) ============================ */
    reading: [
      {
        id: "R1-s1", test: "R1", section: 1, minutes: 15,
        title: "Evening classes · Leisure pool reopening",
        context: "생활 지문 2개 — 성인 저녁 강좌 광고 + 수영장 재개장 공지",
        passage: [
          { label: "", text: "HARTLEY ADULT LEARNING CENTRE — EVENING AND WEEKEND CLASSES, SPRING TERM" },
          { label: "A", text: "Beginners' Pottery. Tuesdays, 7–9 pm, 10 weeks. Learn to shape bowls, cups and plates on the wheel. No previous experience needed. The fee of £120 covers everything you will use, including clay, glazes and the firing of your finished pieces. Maximum eight students per group." },
          { label: "B", text: "Digital Photography. Wednesdays, 6.30–8.30 pm, 8 weeks. Get to grips with exposure, composition and editing. You will need your own camera with manual settings; smartphones are not suitable for this course. The final session is a day trip to the coast to practise landscape shots; coach travel for this is charged separately." },
          { label: "C", text: "Conversational Spanish. Thursdays, 7–8.30 pm, 12 weeks. Aimed at learners who already know basic greetings and the present tense and want to build confidence in speaking. Classes are taught by a native speaker. If you cannot travel to the centre, you may follow every session live from home via video link." },
          { label: "D", text: "Upholstery for the Home. Saturdays, 10 am–1 pm, 6 weeks. Give tired furniture a new life. Each student should bring a small chair or footstool to work on throughout the course. Tools are provided; fabric is not included in the fee, but students can buy it from our partner supplier at a 15% discount." },
          { label: "E", text: "Creative Writing. Mondays, 7–9 pm, 10 weeks. Explore short fiction, memoir and poetry in a friendly workshop. At the end of the course, a selection of students' work will be printed in a small anthology. The fee of £140 may be paid in two equal instalments if preferred." },
          { label: "", text: "LAKESIDE LEISURE POOL — WE'RE REOPENING!" },
          { label: "", text: "After a four-month refurbishment, Lakeside Leisure Pool reopens on Monday 6 March. Improvements include brand-new changing rooms with individual cubicles, better lighting throughout and a new learner pool for young children. Please note that the sauna is still being fitted and will not be available until May." },
          { label: "", text: "Opening hours: Monday to Friday 6.30 am–10 pm; Saturday and Sunday 8 am–6 pm. Lanes are reserved for adults only before 8 am and after 8 pm on weekdays. Family sessions, with inflatables and music, run on weekend afternoons." },
          { label: "", text: "Members: to thank you for your patience, all existing memberships have been extended by four months at no extra charge. Non-members: a single adult swim costs £5.20 and a junior swim (under 16) costs £3.00." },
          { label: "", text: "Lockers: the old coin-operated lockers have been replaced. The new lockers work with a reusable token, which you can collect from reception and return when you leave." },
          { label: "", text: "Swimming lessons for children aged 4–12 restart in the week of 13 March. Places are limited and bookings can only be made online, from 20 February. Unfortunately, reception staff are unable to take bookings in person or by phone." }
        ],
        questions: [
          { n: 1, type: "r-match", q: "Which class can be attended without coming to the centre?", options: ["A", "B", "C", "D", "E"], answer: "C", why: "C: 'follow every session live from home via video link'" },
          { n: 2, type: "r-match", q: "Which class includes an outing that costs extra?", options: ["A", "B", "C", "D", "E"], answer: "B", why: "B: 'day trip to the coast... charged separately'" },
          { n: 3, type: "r-match", q: "Which class requires students to bring a piece of furniture?", options: ["A", "B", "C", "D", "E"], answer: "D", why: "D: 'bring a small chair or footstool'" },
          { n: 4, type: "r-match", q: "Which class allows the fee to be paid in parts?", options: ["A", "B", "C", "D", "E"], answer: "E", why: "E: 'paid in two equal instalments'" },
          { n: 5, type: "r-match", q: "Which class fee includes all the materials needed?", options: ["A", "B", "C", "D", "E"], answer: "A", why: "A: 'covers everything you will use' — D는 fabric 별도" },
          { n: 6, type: "r-match", q: "Which class is not intended for complete beginners?", options: ["A", "B", "C", "D", "E"], answer: "C", why: "C: 'learners who already know basic greetings and the present tense'" },
          { n: 7, type: "r-tfng", q: "The pool has been closed for more than six months.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "FALSE", why: "'After a four-month refurbishment' — 6개월 아님" },
          { n: 8, type: "r-tfng", q: "Swimmers will be able to use the sauna from the day the pool reopens.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "FALSE", why: "'will not be available until May'" },
          { n: 9, type: "r-tfng", q: "The refurbishment cost more than had originally been planned.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "NOT GIVEN", why: "비용·예산 언급 전혀 없음" },
          { n: 10, type: "r-tfng", q: "Existing members will not be charged for the period when the pool was closed.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "TRUE", why: "'extended by four months at no extra charge' = 휴관 기간 보상" },
          { n: 11, type: "r-tfng", q: "A 14-year-old may swim in the lanes at 9 pm on a Tuesday.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "FALSE", why: "'adults only... after 8 pm on weekdays' — 16세 미만은 junior" },
          { n: 12, type: "r-short", q: "What do swimmers now need in order to use a locker?", limit: "NO MORE THAN TWO WORDS", answer: ["reusable token", "token", "a token", "a reusable token"], why: "'work with a reusable token' — coin은 옛 방식" },
          { n: 13, type: "r-short", q: "When are the family sessions held?", limit: "NO MORE THAN TWO WORDS", answer: ["weekend afternoons", "weekends", "at weekends"], why: "'run on weekend afternoons'" },
          { n: 14, type: "r-short", q: "How must parents book swimming lessons?", limit: "ONE WORD ONLY", answer: ["online"], why: "'can only be made online' — 전화·방문 불가" }
        ]
      },

      {
        id: "R1-s2", test: "R1", section: 2, minutes: 20,
        title: "Flexible working guide · New staff induction",
        context: "직장 지문 2개 — 유연근무 사내 규정(헤딩 매칭) + 신입 오리엔테이션 안내(노트 완성)",
        passage: [
          { label: "", text: "HOLLIS & GRANT — A GUIDE TO FLEXIBLE WORKING" },
          { label: "A", text: "We believe that people do their best work when their working pattern fits the rest of their lives. Since introducing flexible arrangements, staff turnover in our design and logistics teams has fallen noticeably, and sickness absence has dropped. Flexibility also allows us to recruit talented people who could not commit to a traditional nine-to-five day, such as those with caring responsibilities." },
          { label: "B", text: "Flexible working can take many forms. Some colleagues reduce their hours and work part-time; others work their full hours over four longer days instead of five, an arrangement known as compressed hours. Two people may share a single role, dividing the week between them. Most office-based staff now also split their time between the office and home, although every team keeps at least two shared 'anchor days' when everyone is expected on site." },
          { label: "C", text: "Any employee who has worked for the company continuously for 26 weeks may make a formal request. Requests should be submitted through the HR portal, using the flexible working form, and should explain how the proposed pattern would work in practice. Because changes take time to plan, only one formal request may be made in any twelve-month period." },
          { label: "D", text: "Your line manager will arrange a meeting with you within two weeks of receiving your request, and will give you a decision in writing within four weeks. In deciding, they will consider the needs of the business: for example, whether customer cover would be affected, whether the work could be reorganised among the team, and whether there would be additional costs. A request may only be turned down for one of the business reasons listed in the staff handbook." },
          { label: "E", text: "Where both sides are unsure how a new pattern will work, the change will normally begin with a three-month trial. During this time, you and your manager should keep a simple record of any problems. At the end of the trial, the arrangement is either confirmed as a permanent change to your contract or, if it has caused serious difficulties, your previous pattern resumes." },
          { label: "F", text: "If you reduce your hours, your salary will be adjusted in proportion. For example, an employee who moves from five days a week to four will receive 80% of their previous salary. Annual leave is calculated in the same way, so a four-day worker receives four-fifths of the full-time entitlement, including public holidays. Your pension contributions will be based on your new salary." },
          { label: "", text: "INDUCTION TRAINING FOR NEW STAFF" },
          { label: "", text: "Welcome to Hollis & Grant. All new employees attend a two-day induction during their first week. Day one is held at head office and covers the history of the company, health and safety procedures and an introduction to our IT systems. Please bring photo identification with you, as you will be issued with your security pass on arrival. Lunch is provided on both days." },
          { label: "", text: "Day two takes place in your own department. You will meet your team and be paired with a buddy: an experienced colleague who is not your line manager and who can answer the everyday questions that new starters often feel uncomfortable asking. Your buddy will check in with you regularly during your first three months." },
          { label: "", text: "In addition, within your first month you must complete three short online modules: data protection, anti-bribery and equality. Each takes about forty minutes. Your progress is recorded automatically, so there is no need to send certificates to HR." },
          { label: "", text: "All new employees have a probation period of six months. Towards the end of this period, you will have a review meeting with your line manager to discuss your progress and agree objectives for the year ahead." }
        ],
        questions: [
          { n: 15, type: "r-heading", q: "Paragraph A", options: ["i  Who is eligible to apply", "ii  Testing a new pattern before it becomes permanent", "iii  The different arrangements on offer", "iv  How managers reach a decision", "v  Why the company supports flexibility", "vi  Appealing against a refusal", "vii  The effect on pay and holidays", "viii  Working from another country"], answer: "v", why: "turnover·sickness 감소, 인재 채용 = 회사가 지지하는 이유" },
          { n: 16, type: "r-heading", q: "Paragraph B", options: ["i  Who is eligible to apply", "ii  Testing a new pattern before it becomes permanent", "iii  The different arrangements on offer", "iv  How managers reach a decision", "v  Why the company supports flexibility", "vi  Appealing against a refusal", "vii  The effect on pay and holidays", "viii  Working from another country"], answer: "iii", why: "'can take many forms' — part-time, compressed hours, job share 나열" },
          { n: 17, type: "r-heading", q: "Paragraph C", options: ["i  Who is eligible to apply", "ii  Testing a new pattern before it becomes permanent", "iii  The different arrangements on offer", "iv  How managers reach a decision", "v  Why the company supports flexibility", "vi  Appealing against a refusal", "vii  The effect on pay and holidays", "viii  Working from another country"], answer: "i", why: "'worked continuously for 26 weeks may make a request' = 자격" },
          { n: 18, type: "r-heading", q: "Paragraph D", options: ["i  Who is eligible to apply", "ii  Testing a new pattern before it becomes permanent", "iii  The different arrangements on offer", "iv  How managers reach a decision", "v  Why the company supports flexibility", "vi  Appealing against a refusal", "vii  The effect on pay and holidays", "viii  Working from another country"], answer: "iv", why: "'In deciding, they will consider...' — 거절(turned down) 언급 있지만 이의제기(vi) 없음" },
          { n: 19, type: "r-heading", q: "Paragraph E", options: ["i  Who is eligible to apply", "ii  Testing a new pattern before it becomes permanent", "iii  The different arrangements on offer", "iv  How managers reach a decision", "v  Why the company supports flexibility", "vi  Appealing against a refusal", "vii  The effect on pay and holidays", "viii  Working from another country"], answer: "ii", why: "'three-month trial... confirmed as a permanent change'" },
          { n: 20, type: "r-heading", q: "Paragraph F", options: ["i  Who is eligible to apply", "ii  Testing a new pattern before it becomes permanent", "iii  The different arrangements on offer", "iv  How managers reach a decision", "v  Why the company supports flexibility", "vi  Appealing against a refusal", "vii  The effect on pay and holidays", "viii  Working from another country"], answer: "vii", why: "salary in proportion + annual leave four-fifths" },
          { n: 21, type: "r-gap", q: "Induction notes — Day 1 location: ______", limit: "NO MORE THAN TWO WORDS", answer: ["head office"], why: "'Day one is held at head office'" },
          { n: 22, type: "r-gap", q: "Bring photo ID in order to receive your ______", limit: "NO MORE THAN TWO WORDS", answer: ["security pass"], why: "'issued with your security pass on arrival' — photo identification = photo ID" },
          { n: 23, type: "r-gap", q: "Day 2: each new starter is paired with a ______", limit: "NO MORE THAN TWO WORDS", answer: ["buddy"], why: "'be paired with a buddy'" },
          { n: 24, type: "r-gap", q: "This colleague is never your ______", limit: "NO MORE THAN TWO WORDS", answer: ["line manager"], why: "'who is not your line manager'" },
          { n: 25, type: "r-gap", q: "Online modules must be finished within the first ______", limit: "NO MORE THAN TWO WORDS", answer: ["month", "first month"], why: "'within your first month' — 'first three months'는 buddy 기간 함정" },
          { n: 26, type: "r-gap", q: "Module topics: data protection, anti-bribery and ______", limit: "NO MORE THAN TWO WORDS", answer: ["equality"], why: "모듈 3개 나열의 마지막" },
          { n: 27, type: "r-gap", q: "Length of probation period: ______", limit: "NO MORE THAN TWO WORDS", answer: ["six months", "6 months"], why: "'probation period of six months'" }
        ]
      },

      {
        id: "R1-s3", test: "R1", section: 3, minutes: 25,
        title: "Old Clothes, New Cloth: The Long Life of Recycled Wool",
        context: "재생 울(shoddy)의 200년 역사와 지속가능 소재로서의 부활 — 일반 교양 장문",
        passage: [
          { label: "A", text: "Ask most people when textile recycling began and they will probably name a date within the last thirty years, picturing clothing banks in supermarket car parks and brands advertising jackets made from plastic bottles. The assumption is understandable, but it is wrong. Long before sustainability became a marketing term, whole towns earned their living by turning worn-out garments back into new cloth. The story of recycled wool is not only an interesting piece of industrial history; it also contains lessons that today's fashion industry would do well to learn." },
          { label: "B", text: "The practice took off in the early nineteenth century in the north of England, in a cluster of mill towns that later became known as the Heavy Woollen District. The technique was simple in principle. Woollen rags were fed into machines fitted with rapidly turning rollers covered in sharp spikes, which tore the fabric apart until only loose fibres remained. These fibres could then be spun into yarn again and woven into new cloth. A local manufacturer, Benjamin Law, is often credited with developing the process around 1813, although, as with many inventions of the period, others were experimenting with similar ideas at the same time. The fibre recovered from ordinary woollen cloth was called shoddy, while fibre from finer, more tightly woven material, which produced a better-quality yarn, was known as mungo." },
          { label: "C", text: "As the industry grew, local rags were no longer enough, and bales of used clothing were shipped in from across Europe and beyond. Before any tearing could begin, the rags had to be sorted, a job done largely by women working by hand in long, dusty sheds. Buttons, linings and any cotton or silk had to be removed, because only wool could be processed. Crucially, the rags were also sorted by colour. A pile of navy rags would become navy yarn, and a pile of grey rags would become grey yarn. This meant that the finished cloth often needed no dyeing at all, saving manufacturers a great deal of money as well as the large quantities of water and chemicals that dyeing required." },
          { label: "D", text: "Recycled wool did have a weakness. Each time cloth is torn apart, its fibres become shorter, and shorter fibres produce a weaker, less durable yarn. For this reason, shoddy was usually blended with a proportion of new wool. Some unscrupulous manufacturers, however, used too little new wool, and their cloth wore out quickly. Over time the word shoddy itself came to mean anything cheap and badly made, a meaning it still carries today. Yet this reputation is, in my view, deeply unfair. For more than a century, recycled wool provided warm, affordable clothing to millions of working people who could never have paid for garments made entirely from new fleece, and it was used in vast quantities for blankets and military uniforms." },
          { label: "E", text: "In the twentieth century, the centre of the trade gradually shifted to Prato, a town near Florence in Italy. There, the craft of rag sorting developed into a highly respected skill. Experienced sorters can identify the fibre content of a piece of cloth simply by rubbing it between their fingers, distinguishing pure wool from a blend that contains a small percentage of nylon. Prato's mills, many of them small family firms, continue to sort by colour, just as their English predecessors did, and the town still processes a significant share of the world's recycled wool." },
          { label: "F", text: "From the 1970s onwards, however, the industry faced serious decline. The arrival of cheap synthetic fibres such as polyester and acrylic reduced demand for recycled wool. More importantly, these new fibres were increasingly mixed with wool in the same fabric. Mechanical recycling depends on the material being largely made of a single fibre; when wool and polyester are spun together, there is no practical way to pull them apart again, so a blended garment that reaches a recycling plant is often good only for insulation or industrial wiping cloths. At the same time, falling clothing prices meant that consumers had less reason to value what they bought, and fewer garments were made to last." },
          { label: "G", text: "Today, the industry is enjoying something of a revival. Several well-known brands now sell coats and knitwear made partly from recycled wool, attracted by figures suggesting that it has a far smaller environmental footprint than virgin wool. I am hopeful about this renewed interest, but I do not believe that it will be enough by itself. If recycled wool is to play a serious role again, designers must take responsibility for what happens to a garment at the end of its life, choosing single-fibre fabrics wherever possible and avoiding unnecessary blends. Consumers, too, will need to abandon the old prejudice that recycled means inferior. The sorters of Yorkshire and Prato showed long ago that waste can be a resource; what we need now is the will to design with that in mind." }
        ],
        questions: [
          { n: 28, type: "r-match", q: "Which paragraph contains an explanation of why mixed-fibre garments are hard to recycle?", options: ["A", "B", "C", "D", "E", "F", "G"], answer: "F", why: "F: 'no practical way to pull them apart again'" },
          { n: 29, type: "r-match", q: "Which paragraph contains a reference to a skill that relies on the sense of touch?", options: ["A", "B", "C", "D", "E", "F", "G"], answer: "E", why: "E: 'simply by rubbing it between their fingers'" },
          { n: 30, type: "r-match", q: "Which paragraph contains an account of how a word gained a negative meaning?", options: ["A", "B", "C", "D", "E", "F", "G"], answer: "D", why: "D: 'shoddy itself came to mean anything cheap and badly made'" },
          { n: 31, type: "r-match", q: "Which paragraph contains the name of a person linked to the invention of a process?", options: ["A", "B", "C", "D", "E", "F", "G"], answer: "B", why: "B: 'Benjamin Law, is often credited with developing the process'" },
          { n: 32, type: "r-match", q: "Which paragraph contains a way of preparing material that reduced the need for certain resources?", options: ["A", "B", "C", "D", "E", "F", "G"], answer: "C", why: "C: 색별 분류 → 'needed no dyeing... water and chemicals' 절약" },
          { n: 33, type: "r-ynng", q: "The common belief that textile recycling is a recent development is incorrect.", options: ["YES", "NO", "NOT GIVEN"], answer: "YES", why: "A: 'The assumption is understandable, but it is wrong.'" },
          { n: 34, type: "r-ynng", q: "Recycled wool was of too low a quality to be of real benefit to anyone.", options: ["YES", "NO", "NOT GIVEN"], answer: "NO", why: "D: 'this reputation is, in my view, deeply unfair... warm, affordable clothing to millions'" },
          { n: 35, type: "r-ynng", q: "Prato's recycling mills will eventually become larger than its other textile businesses.", options: ["YES", "NO", "NOT GIVEN"], answer: "NOT GIVEN", why: "E는 현재 점유율만 언급 — 다른 섬유 산업과의 비교·전망 없음" },
          { n: 36, type: "r-ynng", q: "Designers should consider how a garment can be recycled when they create it.", options: ["YES", "NO", "NOT GIVEN"], answer: "YES", why: "G: 'designers must take responsibility for what happens to a garment at the end of its life'" },
          { n: 37, type: "r-mcq", q: "According to paragraph C, rags were sorted by colour so that", options: ["A  the cloth could be sold at a higher price.", "B  the finished cloth did not need to be dyed.", "C  sorters could work more quickly.", "D  fewer rags needed to be imported."], answer: "B", why: "C: 'the finished cloth often needed no dyeing at all'" },
          { n: 38, type: "r-mcq", q: "Which best describes the writer's attitude to the current revival of recycled wool?", options: ["A  cautiously optimistic", "B  strongly critical", "C  completely uncertain", "D  wholly enthusiastic"], answer: "A", why: "G: 'I am hopeful... but I do not believe that it will be enough by itself'" },
          { n: 39, type: "r-gap", q: "Summary: Spiked rollers tore rags into loose fibres. Fibre from ordinary cloth was called shoddy, while fibre from finer, tightly woven material was known as ______.", limit: "ONE WORD ONLY", answer: ["mungo"], why: "B 마지막 문장 'was known as mungo'" },
          { n: 40, type: "r-gap", q: "Summary: Because tearing makes the fibres ______, recycled yarn is weaker, so it was usually blended with new wool.", limit: "ONE WORD ONLY", answer: ["shorter"], why: "D: 'its fibres become shorter... weaker, less durable yarn'" }
        ]
      },

      /* ---------------- TEST 2 ---------------- */
      {
        id: "R2-s1", test: "R2", section: 1, minutes: 15,
        title: "Removal companies · Library changes",
        context: "생활 지문 2개 — 이사업체 광고 5개(매칭) + 도서관 변경 공지(T/F/NG·단답)",
        passage: [
          { label: "", text: "MOVING HOUSE? LOCAL REMOVAL SERVICES" },
          { label: "A", text: "Swift & Sons Removals. Family-run since 1987. We handle everything from a single room to a five-bedroom house. Our packing service is optional and charged by the hour, but boxes and tape are supplied free with every booking. Fully insured. Please note that we do not work on Sundays." },
          { label: "B", text: "Two Hands Van Hire. Need a van but happy to do the lifting yourself? Hire one of our vans by the half day or the full day. Drivers must be over 25 and must have held a full licence for at least three years. A loading trolley is included at no extra cost." },
          { label: "C", text: "Haverly Moves. Specialists in pianos, antiques and artworks. Every item is wrapped in custom-made padding and carried in our climate-controlled lorries. If your new home is not ready in time, we can also look after your belongings in our secure storage for up to six months." },
          { label: "D", text: "StudentShift. Cheap and cheerful moves for students at the start and end of term. Our prices are fixed according to the number of boxes, not the distance travelled, so you know exactly what you will pay before you book. Bookings must be made at least ten days in advance." },
          { label: "E", text: "Greenway Removals. Our fleet runs entirely on electric vehicles, and any unwanted furniture you leave behind is collected and passed on to local charities. We cover the whole of the UK and can also arrange moves to France and Spain." },
          { label: "", text: "CHANGES AT KINGSMERE LIBRARY" },
          { label: "", text: "From 3 June, Kingsmere Library will introduce a new self-service system. Members will be able to borrow and return items using the machines by the entrance at any time the library is open. Staff will still be available at the information desk to help with enquiries, but they will no longer issue books at the counter." },
          { label: "", text: "Opening hours are also changing. On weekdays the library will now open at 9 am rather than 10 am, but to make this possible it will close at 5 pm on Saturdays instead of 6 pm. Sunday opening (11 am–3 pm) continues as before." },
          { label: "", text: "Late-return charges on adult books, previously 20p per day, have been abolished. Instead, members who have not returned an item within four weeks of its due date will be asked to pay the cost of replacing it. Children's books have never been subject to late-return charges, and this remains unchanged." },
          { label: "", text: "The first-floor study area has been redesigned, with power sockets at every desk. Desks can be reserved for up to three hours at a time using the library app; unreserved desks are available on a first-come, first-served basis." },
          { label: "", text: "The local history collection is moving to the county archive building on Market Street, where it can be viewed by appointment. Copies of documents from the collection can still be ordered through Kingsmere Library." },
          { label: "", text: "Finally, we are looking for volunteers to help with our Saturday morning homework club for primary school children. No teaching experience is needed, but all volunteers must complete a background check, which the library will arrange and pay for." }
        ],
        questions: [
          { n: 1, type: "r-match", q: "Which company does not provide people to carry your belongings?", options: ["A", "B", "C", "D", "E"], answer: "B", why: "B: 'happy to do the lifting yourself?' — 차량만 대여" },
          { n: 2, type: "r-match", q: "Which company's price does not depend on how far you are moving?", options: ["A", "B", "C", "D", "E"], answer: "D", why: "D: 'fixed according to the number of boxes, not the distance travelled'" },
          { n: 3, type: "r-match", q: "Which company can keep your possessions for a period before delivery?", options: ["A", "B", "C", "D", "E"], answer: "C", why: "C: 'secure storage for up to six months'" },
          { n: 4, type: "r-match", q: "Which company supplies packing materials without charge?", options: ["A", "B", "C", "D", "E"], answer: "A", why: "A: 'boxes and tape are supplied free' — 포장 서비스 자체는 시간당 유료" },
          { n: 5, type: "r-match", q: "Which company will deal with furniture you no longer want?", options: ["A", "B", "C", "D", "E"], answer: "E", why: "E: 'unwanted furniture... passed on to local charities'" },
          { n: 6, type: "r-match", q: "Which company sets conditions on who may drive its vehicles?", options: ["A", "B", "C", "D", "E"], answer: "B", why: "B: 'Drivers must be over 25... full licence for at least three years'" },
          { n: 7, type: "r-tfng", q: "Library staff will continue to issue books at the counter.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "FALSE", why: "'will no longer issue books at the counter' — 문의 응대만 남음" },
          { n: 8, type: "r-tfng", q: "The library will be open for fewer hours on Saturdays than before.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "TRUE", why: "'close at 5 pm on Saturdays instead of 6 pm'" },
          { n: 9, type: "r-tfng", q: "Opening hours on Sundays will be extended.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "FALSE", why: "'Sunday opening... continues as before'" },
          { n: 10, type: "r-tfng", q: "The new self-service machines were paid for by a local business.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "NOT GIVEN", why: "기계 비용·후원자 언급 전혀 없음" },
          { n: 11, type: "r-tfng", q: "Children who return books late have to pay a charge.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "FALSE", why: "'Children's books have never been subject to late-return charges'" },
          { n: 12, type: "r-short", q: "What is the longest time a study desk can be reserved for at once?", limit: "NO MORE THAN THREE WORDS", answer: ["three hours", "3 hours", "up to three hours"], why: "'reserved for up to three hours at a time'" },
          { n: 13, type: "r-short", q: "Where can people now go to see the local history collection?", limit: "NO MORE THAN THREE WORDS", answer: ["county archive building", "the county archive", "county archive", "Market Street"], why: "'moving to the county archive building' — 도서관에선 사본 주문만" },
          { n: 14, type: "r-short", q: "What must every homework club volunteer complete?", limit: "NO MORE THAN THREE WORDS", answer: ["background check", "a background check"], why: "'No teaching experience is needed, but... background check' — but 뒤가 조건" }
        ]
      },

      {
        id: "R2-s2", test: "R2", section: 2, minutes: 20,
        title: "Safe lifting guidance · Professional development fund",
        context: "직장 지문 2개 — 물류창고 안전 취급 지침(노트 완성) + 직원 교육비 지원 제도(객관식·T/F/NG)",
        passage: [
          { label: "", text: "CORRAN DISTRIBUTION — SAFE LIFTING AND CARRYING" },
          { label: "", text: "Most injuries in our warehouses are caused not by machinery but by the everyday lifting, pushing and carrying of goods. Back injuries in particular can take months to heal, so please read this guidance carefully." },
          { label: "", text: "Before you lift anything, assess the load. Check its weight, which is printed on the label of every carton we receive, and look for sharp edges or leaking contents. If an item weighs more than 20 kg, it must not be lifted by one person: either ask a colleague to help or use the equipment provided." },
          { label: "", text: "Plan your route. Make sure the path is clear of obstacles and that there is space at your destination to put the load down. Doors should be propped open in advance, never pushed open with the load." },
          { label: "", text: "When lifting, stand close to the load with your feet apart, one slightly in front of the other. Bend your knees rather than your back, keep the load close to your waist and avoid twisting your body; if you need to change direction, turn by moving your feet." },
          { label: "", text: "Pallet trucks are available in every aisle. Before using one, check that the wheels move freely and that the brake works. Pushing a truck is safer than pulling it, as it allows you to see where you are going and keeps your back straight." },
          { label: "", text: "Staff who regularly carry out heavy lifting may request a back-support belt from the stores supervisor. However, a belt is not a substitute for good technique." },
          { label: "", text: "All accidents, however minor, must be recorded in the accident book kept in the first-aid room. Near misses, situations in which nobody was hurt but someone could have been, should be reported to your shift leader before the end of the same shift." },
          { label: "", text: "THE PROFESSIONAL DEVELOPMENT FUND" },
          { label: "", text: "Corran Distribution sets aside money each year to help employees gain qualifications and skills that will support their careers with the company. The fund is open to all permanent staff, whether full-time or part-time, who have completed their probation period. Agency workers and staff on fixed-term contracts are not currently eligible, although this is under review." },
          { label: "", text: "The fund will pay up to £1,500 per employee per year towards course fees, examination fees and essential books. It does not cover travel or accommodation, except where a course can only be taken at a centre more than 50 miles from your place of work." },
          { label: "", text: "Courses do not have to be directly related to your current role, but you must be able to show how they would be useful to the company in the future. For example, a warehouse operative who wishes to train in logistics management, or to learn a language spoken by one of our major suppliers, would be considered." },
          { label: "", text: "To apply, complete the development fund form together with your line manager, who will add a short statement of support. Applications are reviewed by a panel from Human Resources, which meets on the first Monday of each month." },
          { label: "", text: "If you leave the company within twelve months of finishing a course paid for by the fund, you will be asked to repay some or all of the cost: the full amount if you leave within six months, and half if you leave between six and twelve months. This does not apply if you are made redundant." },
          { label: "", text: "Employees may also request up to five days of paid study leave per year to attend classes or sit examinations." }
        ],
        questions: [
          { n: 15, type: "r-gap", q: "Safe lifting notes — Most injuries are caused by everyday handling, not by ______", limit: "NO MORE THAN TWO WORDS", answer: ["machinery"], why: "'caused not by machinery but by the everyday lifting'" },
          { n: 16, type: "r-gap", q: "The weight of each carton is shown on its ______", limit: "NO MORE THAN TWO WORDS", answer: ["label"], why: "'printed on the label of every carton'" },
          { n: 17, type: "r-gap", q: "Items over 20 kg: ask a ______ or use equipment", limit: "NO MORE THAN TWO WORDS", answer: ["colleague"], why: "'either ask a colleague to help or use the equipment'" },
          { n: 18, type: "r-gap", q: "Before moving a load, doors should be ______", limit: "NO MORE THAN TWO WORDS", answer: ["propped open"], why: "'propped open in advance, never pushed open with the load'" },
          { n: 19, type: "r-gap", q: "To change direction, move your ______ rather than twist", limit: "NO MORE THAN TWO WORDS", answer: ["feet"], why: "'turn by moving your feet' — knees는 굽히는 부위 함정" },
          { n: 20, type: "r-gap", q: "Pallet trucks: ______ rather than pull them", limit: "NO MORE THAN TWO WORDS", answer: ["push", "push them"], why: "'Pushing a truck is safer than pulling it'" },
          { n: 21, type: "r-gap", q: "Report near misses to your ______ before the shift ends", limit: "NO MORE THAN TWO WORDS", answer: ["shift leader"], why: "사고는 accident book, near miss는 shift leader — 구분 함정" },
          { n: 22, type: "r-mcq", q: "Who can currently apply to the fund?", options: ["A  agency workers with six months' service", "B  part-time permanent staff who have passed probation", "C  staff on fixed-term contracts", "D  full-time permanent staff only"], answer: "B", why: "'whether full-time or part-time, who have completed their probation' — 계약직은 'under review'일 뿐" },
          { n: 23, type: "r-mcq", q: "The fund will pay for travel when", options: ["A  the course lasts more than a week.", "B  the employee's manager approves it.", "C  the course is only available far from the workplace.", "D  the examination is held at a weekend."], answer: "C", why: "'except where a course can only be taken at a centre more than 50 miles' away" },
          { n: 24, type: "r-mcq", q: "Which course is the fund most likely to support?", options: ["A  any course the employee would enjoy", "B  only a course linked to the employee's present job", "C  a course that could benefit the company later", "D  a course run by one of the company's suppliers"], answer: "C", why: "'do not have to be directly related... useful to the company in the future' — B는 정반대" },
          { n: 25, type: "r-tfng", q: "An application must include a statement from the employee's line manager.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "TRUE", why: "'your line manager, who will add a short statement of support'" },
          { n: 26, type: "r-tfng", q: "An employee who resigns eight months after finishing a funded course must repay the full cost.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "FALSE", why: "6~12개월 사이는 'half' — 전액은 6개월 이내" },
          { n: 27, type: "r-tfng", q: "Most applications to the fund are approved.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "NOT GIVEN", why: "승인 비율 언급 없음 — 심사 주체·일정만 나옴" }
        ]
      },

      {
        id: "R2-s3", test: "R2", section: 3, minutes: 25,
        title: "The Slow Rise of the Zip",
        context: "지퍼가 발명에서 일상 의류의 표준이 되기까지 40년 — 일반 교양 장문 (헤딩·필자 견해·요약)",
        passage: [
          { label: "A", text: "Few objects are as ordinary as the zip. Most of us fasten and unfasten several every day without a second thought, and the average wardrobe probably contains dozens. Yet the zip took a remarkably long time to become ordinary. Between its first patent and its general acceptance in clothing lay roughly forty years of failed products, sceptical customers and patient engineering. Its history is a useful reminder that a good idea is rarely enough on its own: an invention must also be reliable, cheap to produce and, above all, wanted." },
          { label: "B", text: "The first device that resembles a modern zip was patented in Chicago in 1893 by Whitcomb Judson, an engineer who had previously worked on railway brakes. His 'clasp locker' was intended for boots, which at the time were fastened with long rows of buttons or laces. The design consisted of a series of hooks and eyes drawn together by a sliding guide. It was ingenious, but it had serious flaws: it had a tendency to spring open without warning, and it was expensive to make, because many of its parts had to be assembled by hand. Sales were tiny, and for years the company set up to manufacture it struggled to survive." },
          { label: "C", text: "The breakthrough came from an engineer at that company, Gideon Sundback, a Swedish immigrant who joined it in the early 1900s. Rather than refining Judson's hooks, Sundback abandoned them. His design used two rows of small identical teeth, each with a tiny hollow on one side and a bump on the other, so that the bump of one tooth fitted neatly into the hollow of the tooth opposite. Just as important as the design itself was the machine Sundback built to manufacture it, which stamped out the teeth and fixed them to a fabric tape in a single continuous process. For the first time, the fastener could be produced quickly, cheaply and in large quantities." },
          { label: "D", text: "Even so, the clothing trade showed little interest. The first significant buyers were makers of tobacco pouches and money belts, followed by a rubber company that fitted the device to a new style of overshoe. It was this company that gave the fastener its popular name, apparently inspired by the sound it made, and the word quickly entered everyday speech. Tailors, however, remained unconvinced. Early zips were made of metal that rusted after washing, so a garment often had to be unpicked to remove the fastener before cleaning and then sewn back together afterwards. Few customers were prepared to go to such trouble." },
          { label: "E", text: "Acceptance came first in children's clothing. In the 1930s, manufacturers began to promote zips as a way of helping young children to dress themselves, an argument that appealed both to parents and to the educational experts of the day, who were keen to encourage independence in the young. Men's trousers followed later in the decade, after fashion writers declared the zip fly more modern than buttons, which could be fastened in the wrong order and leave the wearer looking foolish. Women's dresses were slower to change. Many dressmakers felt that a zip spoiled the line of a garment, and it was not until after the Second World War that it became standard there too." },
          { label: "F", text: "In the second half of the twentieth century, the centre of the industry moved to Asia. One Japanese manufacturer, founded in the 1930s, built its success on a principle that its rivals had overlooked: it made almost every component itself, from the metal alloy and the dye for the tape to the machines that assembled the finished product. This gave it unusually tight control over quality, and today a large share of the world's zips come from this single company. Its initials, stamped on the slider, must be among the most frequently seen letters on earth, though few of the people who see them every day could say what they stand for." },
          { label: "G", text: "What can designers learn from this story? In my view, the most important lesson is that the zip did not succeed simply because it was clever; Judson's original was clever too. It succeeded because Sundback solved the problem of making it reliably and cheaply, and because its promoters found particular groups, first parents and then men anxious to look modern, who had a genuine reason to want it. I would also argue that the zip's dominance is not permanent. Zips are difficult to repair, and a broken one often means the end of a garment. As interest grows in clothing that is built to last, buttons, which anyone can replace with a needle and thread, may well win back some of the ground they lost a century ago." }
        ],
        questions: [
          { n: 28, type: "r-heading", q: "Paragraph A", options: ["i  Slow progress towards something we now take for granted", "ii  A clever idea with practical weaknesses", "iii  Rethinking both the product and the way it was made", "iv  Early customers outside the clothing trade", "v  Persuading particular groups of buyers", "vi  The advantage of making everything in-house", "vii  A lesson from the past and a possible reversal", "viii  A dispute over who invented the fastener", "ix  The search for a metal that would not rust", "x  How wartime shortages spread the zip"], answer: "i", why: "'took a remarkably long time to become ordinary... forty years'" },
          { n: 29, type: "r-heading", q: "Paragraph B", options: ["i  Slow progress towards something we now take for granted", "ii  A clever idea with practical weaknesses", "iii  Rethinking both the product and the way it was made", "iv  Early customers outside the clothing trade", "v  Persuading particular groups of buyers", "vi  The advantage of making everything in-house", "vii  A lesson from the past and a possible reversal", "viii  A dispute over who invented the fastener", "ix  The search for a metal that would not rust", "x  How wartime shortages spread the zip"], answer: "ii", why: "'ingenious, but it had serious flaws' — 특허는 나오지만 분쟁(viii)은 없음" },
          { n: 30, type: "r-heading", q: "Paragraph C", options: ["i  Slow progress towards something we now take for granted", "ii  A clever idea with practical weaknesses", "iii  Rethinking both the product and the way it was made", "iv  Early customers outside the clothing trade", "v  Persuading particular groups of buyers", "vi  The advantage of making everything in-house", "vii  A lesson from the past and a possible reversal", "viii  A dispute over who invented the fastener", "ix  The search for a metal that would not rust", "x  How wartime shortages spread the zip"], answer: "iii", why: "새 이빨 구조 + 'Just as important... the machine' = 제품과 제조법 모두" },
          { n: 31, type: "r-heading", q: "Paragraph D", options: ["i  Slow progress towards something we now take for granted", "ii  A clever idea with practical weaknesses", "iii  Rethinking both the product and the way it was made", "iv  Early customers outside the clothing trade", "v  Persuading particular groups of buyers", "vi  The advantage of making everything in-house", "vii  A lesson from the past and a possible reversal", "viii  A dispute over who invented the fastener", "ix  The search for a metal that would not rust", "x  How wartime shortages spread the zip"], answer: "iv", why: "담배 파우치·덧신 회사가 첫 구매자, 재단사는 외면 — rust는 언급만, 해결 탐색(ix) 없음" },
          { n: 32, type: "r-heading", q: "Paragraph E", options: ["i  Slow progress towards something we now take for granted", "ii  A clever idea with practical weaknesses", "iii  Rethinking both the product and the way it was made", "iv  Early customers outside the clothing trade", "v  Persuading particular groups of buyers", "vi  The advantage of making everything in-house", "vii  A lesson from the past and a possible reversal", "viii  A dispute over who invented the fastener", "ix  The search for a metal that would not rust", "x  How wartime shortages spread the zip"], answer: "v", why: "아동복→남성 바지→여성복 순 설득. 'after the Second World War'는 시점일 뿐, 물자부족(x) 아님" },
          { n: 33, type: "r-heading", q: "Paragraph F", options: ["i  Slow progress towards something we now take for granted", "ii  A clever idea with practical weaknesses", "iii  Rethinking both the product and the way it was made", "iv  Early customers outside the clothing trade", "v  Persuading particular groups of buyers", "vi  The advantage of making everything in-house", "vii  A lesson from the past and a possible reversal", "viii  A dispute over who invented the fastener", "ix  The search for a metal that would not rust", "x  How wartime shortages spread the zip"], answer: "vi", why: "'made almost every component itself' = in-house" },
          { n: 34, type: "r-heading", q: "Paragraph G", options: ["i  Slow progress towards something we now take for granted", "ii  A clever idea with practical weaknesses", "iii  Rethinking both the product and the way it was made", "iv  Early customers outside the clothing trade", "v  Persuading particular groups of buyers", "vi  The advantage of making everything in-house", "vii  A lesson from the past and a possible reversal", "viii  A dispute over who invented the fastener", "ix  The search for a metal that would not rust", "x  How wartime shortages spread the zip"], answer: "vii", why: "'What can designers learn' + 'buttons... may well win back' = 반전 가능성" },
          { n: 35, type: "r-ynng", q: "The success of an invention depends on more than the quality of the original idea.", options: ["YES", "NO", "NOT GIVEN"], answer: "YES", why: "A: 'a good idea is rarely enough on its own'" },
          { n: 36, type: "r-ynng", q: "The zip is likely to remain the dominant fastener in clothing.", options: ["YES", "NO", "NOT GIVEN"], answer: "NO", why: "G: 'I would also argue that the zip's dominance is not permanent'" },
          { n: 37, type: "r-ynng", q: "The Japanese company's zips are more expensive than those of its competitors.", options: ["YES", "NO", "NOT GIVEN"], answer: "NOT GIVEN", why: "F는 품질 관리·점유율만 — 가격 비교 없음" },
          { n: 38, type: "r-gap", q: "Summary: Judson's 1893 device was originally designed for fastening ______.", limit: "ONE WORD ONLY", answer: ["boots"], why: "B: 'His clasp locker was intended for boots'" },
          { n: 39, type: "r-gap", q: "Summary: Because early metal zips ______ after washing, they often had to be removed before a garment was cleaned.", limit: "ONE WORD ONLY", answer: ["rusted"], why: "D: 'metal that rusted after washing'" },
          { n: 40, type: "r-gap", q: "Summary: Zips were promoted as helping young children dress themselves, which appealed to experts who wanted to encourage ______.", limit: "ONE WORD ONLY", answer: ["independence"], why: "E: 'keen to encourage independence in the young'" }
        ]
      }
    ],

    /* ============================ WRITING ============================ */
    writing: {
      task1: [
        { id: "w1-01", tone: "formal", situation: "You recently ordered a bookshelf from an online furniture company, but it arrived damaged and with parts missing. Write a letter to the company's customer service manager.", bullets: ["give details of your order", "describe the problems with the bookshelf", "say what you would like the company to do"], opener: "Dear Sir or Madam," },
        { id: "w1-02", tone: "semi", situation: "You would like to take a short evening course that is related to your job, but the classes start before your usual finishing time. Write a letter to your manager.", bullets: ["describe the course you want to take", "explain how it would benefit your work", "suggest how you could make up the time"], opener: "Dear Mr Harris," },
        { id: "w1-03", tone: "informal", situation: "A friend from abroad is planning to visit your city for a long weekend and has asked for your advice. Write a letter to your friend.", bullets: ["recommend the best time of year to come", "suggest some places to visit", "offer to help in some way during the visit"], opener: "Dear Sam," },
        { id: "w1-04", tone: "formal", situation: "Building work near your home has been starting very early in the morning and causing disturbance to local residents. Write a letter to your local council.", bullets: ["describe the building work and where it is", "explain how it is affecting you and your neighbours", "say what action you would like the council to take"], opener: "Dear Sir or Madam," },
        { id: "w1-05", tone: "semi", situation: "A parcel addressed to your neighbour was delivered to you by mistake while they were away, and you had to sign for it. Write a letter to your neighbour, whom you do not know well.", bullets: ["explain what happened", "describe the condition of the parcel", "suggest how and when they can collect it"], opener: "Dear Ms Lee," },
        { id: "w1-06", tone: "informal", situation: "A friend looked after your pet while you were away on holiday. Write a letter to thank your friend.", bullets: ["thank them and say how the holiday went", "mention something about your pet you were pleased to hear", "invite them to do something together as a thank you"], opener: "Dear Jo," },
        { id: "w1-07", tone: "formal", situation: "You have seen an advertisement for weekend volunteers at a local museum of textiles and fashion. Write a letter to the volunteer coordinator.", bullets: ["say which role you are interested in", "describe the relevant experience and skills you have", "explain when you would be available"], opener: "Dear Sir or Madam," },
        { id: "w1-08", tone: "semi", situation: "A colleague from your company's overseas office is coming to work in your team for two weeks. You have been asked to help them settle in. Write a letter to this colleague.", bullets: ["introduce yourself and your role", "explain what they will be working on", "give some practical advice about the office and the area"], opener: "Dear Daniel," },
        { id: "w1-09", tone: "formal", situation: "You stayed at a hotel last weekend and have just realised that you left an important item in your room. Write a letter to the hotel manager.", bullets: ["give details of your stay", "describe the item and where you think you left it", "explain how you would like it returned to you"], opener: "Dear Sir or Madam," },
        { id: "w1-10", tone: "informal", situation: "A friend has invited you to their wedding, but you will not be able to attend. Write a letter to your friend.", bullets: ["congratulate them and explain why you cannot come", "describe the present you are sending", "suggest meeting soon after the wedding"], opener: "Dear Alex," }
      ],
      task2: [
        { id: "w2-01", kind: "opinion", prompt: "Some people believe that fashion companies should be legally required to take back and recycle the clothes they sell. To what extent do you agree or disagree?", ideas: ["producer responsibility shifts cost of waste back to brands", "incentive to design durable, single-fibre garments", "risk: higher prices for low-income shoppers", "small brands may lack recycling infrastructure", "alternative: tax on virgin synthetic fibres"] },
        { id: "w2-02", kind: "opinion", prompt: "Working from home is better for employees than working in an office. To what extent do you agree or disagree?", ideas: ["no commute saves time and money", "fewer interruptions for focused tasks", "loneliness and blurred work–life boundaries", "creative teams lose spontaneous idea-sharing", "hybrid model captures most benefits"] },
        { id: "w2-03", kind: "opinion", prompt: "Some people think that all young people should be required to learn a second language at school until the age of eighteen. Do you agree or disagree?", ideas: ["wider job opportunities in a global economy", "language learning improves cognitive flexibility", "deeper understanding of other cultures", "time taken from maths or science", "motivation drops when learning is compulsory"] },
        { id: "w2-04", kind: "discuss", prompt: "Some people think that public money should be spent on museums and art galleries, while others believe it should be spent on more practical things such as hospitals and roads. Discuss both views and give your own opinion.", ideas: ["culture preserves identity and attracts tourism", "free museums widen access to education", "health and safety are basic needs", "limited budgets require priorities", "culture budgets are tiny relative to total spending"] },
        { id: "w2-05", kind: "discuss", prompt: "Some people believe that experience is more valuable than qualifications when choosing new employees. Others think formal qualifications are more important. Discuss both views and give your own opinion.", ideas: ["experience shows proven ability to deliver", "qualifications offer an objective, comparable standard", "some professions need certified knowledge (medicine, law)", "portfolios matter more in creative fields", "best hiring combines both with a practical test"] },
        { id: "w2-06", kind: "problem", prompt: "In many cities, people are throwing away more clothing than ever before. What are the causes of this problem, and what solutions can you suggest?", ideas: ["fast fashion: cheap, low-quality, trend-driven items", "social media pressure to wear new outfits", "lack of repair skills and services", "solution: repair cafés and alteration discounts", "solution: clear durability labels on garments"] },
        { id: "w2-07", kind: "problem", prompt: "Many people today find it difficult to maintain a healthy work–life balance. What problems does this cause, and how can they be solved?", ideas: ["burnout and stress-related illness", "damaged family relationships", "lower productivity over time", "right-to-disconnect policies after work hours", "managers modelling healthy behaviour"] },
        { id: "w2-08", kind: "problem", prompt: "In some countries, young adults are finding it increasingly hard to afford their own homes. Why is this happening, and what can be done to address it?", ideas: ["house prices rising faster than wages", "investors buying property as an asset", "limited supply of new housing in cities", "government-backed affordable housing schemes", "better public transport to open cheaper areas"] },
        { id: "w2-09", kind: "advdis", prompt: "More and more people are choosing to shop online rather than in physical stores. Do the advantages of this trend outweigh the disadvantages?", ideas: ["convenience and wider choice", "easy price comparison", "high return rates create waste and emissions", "local high streets lose shops and jobs", "cannot check fit or fabric before buying"] },
        { id: "w2-10", kind: "advdis", prompt: "Some companies now use artificial intelligence to help design products such as clothing and furniture. What are the advantages and disadvantages of this development?", ideas: ["faster generation of design options", "data-driven prediction of popular styles", "risk of homogenised, similar-looking products", "questions over originality and ownership", "designers freed for higher-level creative decisions"] },
        { id: "w2-11", kind: "twopart", prompt: "Many people now change careers several times during their working lives. Why do people do this? Is it a positive or negative development?", ideas: ["technology makes some jobs obsolete", "longer working lives invite new challenges", "desire for meaning and better balance", "positive: transferable skills and resilience", "negative: retraining costs and loss of seniority"] },
        { id: "w2-12", kind: "twopart", prompt: "In many countries, people are spending less time outdoors than in the past. What are the reasons for this? What effects does this have on individuals and society?", ideas: ["screen-based entertainment at home", "long working hours and indoor jobs", "fewer green spaces in dense cities", "effects: weaker physical and mental health", "effects: less community contact in public spaces"] }
      ]
    },

    /* ============================ SPEAKING ============================ */
    speaking: {
      part1: [
        { topic: "Work", qs: ["What do you do for a living?", "What do you enjoy most about your job?", "Is there anything you would like to change about your work?", "Do you think you will do the same job in five years' time?"] },
        { topic: "Hometown", qs: ["Where is your hometown?", "What do you like most about it?", "How has it changed since you were a child?", "Would you recommend it to tourists? Why?"] },
        { topic: "Home", qs: ["Do you live in a house or a flat?", "Which room do you spend the most time in?", "What would you change about your home if you could?", "Do you plan to live there for a long time?"] },
        { topic: "Clothes", qs: ["What kind of clothes do you usually wear?", "Do you wear different clothes at work and at weekends?", "Where do you usually buy your clothes?", "Have your tastes in clothing changed over the years?"] },
        { topic: "Weekends", qs: ["What do you usually do at weekends?", "Do you prefer busy or relaxing weekends?", "What did you do last weekend?", "Are weekends in your country different from in the past?"] },
        { topic: "Shopping", qs: ["Do you enjoy shopping?", "Do you prefer shopping online or in stores?", "What was the last thing you bought?", "Is there anything you would never buy online?"] },
        { topic: "Technology", qs: ["Which piece of technology do you use most?", "How does technology help you in your work?", "Is there any technology you find annoying?", "Do you think people rely too much on their phones?"] },
        { topic: "Weather", qs: ["What's the weather like in your country?", "What's your favourite kind of weather?", "Does the weather affect your mood?", "Do you check the weather forecast every day?"] },
        { topic: "Music", qs: ["What kind of music do you like?", "When do you usually listen to music?", "Did you learn to play an instrument as a child?", "Has your taste in music changed as you've got older?"] },
        { topic: "Travel", qs: ["Do you like travelling?", "Where did you go on your last trip?", "Do you prefer travelling alone or with others?", "Where would you like to travel in the future?"] }
      ],
      part2: [
        { id: "s2-01", cue: "Describe a piece of clothing that is special to you.", points: ["You should say: what it is", "where you got it", "how often you wear it", "and explain why it is special to you."], part3: ["Why do some people spend a lot of money on clothes?", "How has the way people shop for clothes changed in recent years?", "Do you think clothing still shows a person's social status?", "Should schools and workplaces have dress codes?"] },
        { id: "s2-02", cue: "Describe a time when you solved a difficult problem at work.", points: ["You should say: what the problem was", "who was involved", "how you solved it", "and explain how you felt afterwards."], part3: ["What skills do people need to solve problems at work?", "Is it better to solve problems alone or in a team?", "Why do some people avoid dealing with problems?", "How can companies encourage employees to suggest new ideas?"] },
        { id: "s2-03", cue: "Describe a skill you learned that has been useful in your job.", points: ["You should say: what the skill is", "how and when you learned it", "how difficult it was to learn", "and explain how it has helped you in your work."], part3: ["Which skills will be most important for workers in the future?", "Should employers pay for staff training?", "Is it easier for young people or older people to learn new skills?", "How has technology changed the way people learn at work?"] },
        { id: "s2-04", cue: "Describe a designer or creative person you admire.", points: ["You should say: who this person is", "what kind of work they do", "how you learned about them", "and explain why you admire them."], part3: ["Why are creative jobs often poorly paid at the start of a career?", "Can creativity be taught, or is it something people are born with?", "How important is design in the products people buy?", "Will artificial intelligence replace creative professionals?"] },
        { id: "s2-05", cue: "Describe a place you visited that was very peaceful.", points: ["You should say: where it was", "when you went there", "what you did there", "and explain why it felt peaceful."], part3: ["Why do people in cities find it hard to relax?", "Should governments protect quiet natural areas?", "Do you think tourism damages beautiful places?", "How do young and old people relax differently?"] },
        { id: "s2-06", cue: "Describe a book or film that changed the way you think.", points: ["You should say: what it was", "when you read or saw it", "what it was about", "and explain how it changed your thinking."], part3: ["Do people read fewer books than in the past?", "Should films that are based on true stories be completely accurate?", "Why are some stories popular across many cultures?", "Is it important for children to read printed books?"] },
        { id: "s2-07", cue: "Describe a time when you helped someone.", points: ["You should say: who you helped", "what the situation was", "how you helped them", "and explain how you felt about it."], part3: ["Are people less willing to help strangers than in the past?", "Should volunteering be part of the school curriculum?", "Who should take care of elderly people: families or the state?", "Why do some people find it hard to ask for help?"] },
        { id: "s2-08", cue: "Describe an app or website you use often.", points: ["You should say: what it is", "how you found it", "what you use it for", "and explain why you find it useful."], part3: ["What are the risks of sharing personal information online?", "Do apps make people more or less productive?", "How has the internet changed the way people make friends?", "Should children's screen time be limited by law?"] },
        { id: "s2-09", cue: "Describe a goal you hope to achieve in the next few years.", points: ["You should say: what the goal is", "why you chose it", "what you are doing to achieve it", "and explain how you will feel when you achieve it."], part3: ["Is it better to have long-term or short-term goals?", "Why do many people give up on their goals?", "Do parents put too much pressure on children to succeed?", "How do people's goals change as they get older?"] },
        { id: "s2-10", cue: "Describe a celebration you enjoyed.", points: ["You should say: what was being celebrated", "where it took place", "who was there", "and explain why you enjoyed it."], part3: ["Are traditional celebrations becoming less important?", "Why do some people spend too much money on weddings?", "How do companies use festivals for marketing?", "Should public holidays be based on religion or national history?"] },
        { id: "s2-11", cue: "Describe a teacher who influenced you.", points: ["You should say: who this teacher was", "what subject they taught", "what they were like", "and explain how they influenced you."], part3: ["What makes a good teacher?", "Will online learning replace classroom teaching?", "Should teachers be paid more?", "Is it better to learn from a teacher or from experience?"] },
        { id: "s2-12", cue: "Describe a time when you changed your mind about something.", points: ["You should say: what you changed your mind about", "what your original opinion was", "what made you change it", "and explain whether you think it was the right decision."], part3: ["Why do some people find it hard to change their opinions?", "How much does advertising influence people's choices?", "Is it a sign of weakness for a politician to change their mind?", "How can people tell whether information online is reliable?"] },
        { id: "s2-13", cue: "Describe a building you find attractive.", points: ["You should say: where it is", "what it looks like", "what it is used for", "and explain why you find it attractive."], part3: ["Should old buildings always be preserved?", "How does architecture affect people's mood?", "Do modern cities all look the same?", "Who should decide what new buildings look like?"] },
        { id: "s2-14", cue: "Describe a time you were very busy.", points: ["You should say: when it was", "why you were so busy", "what you had to do", "and explain how you managed it."], part3: ["Why are people busier today than in the past?", "Is being busy a sign of success?", "How can people manage their time better?", "Should the working week be shortened to four days?"] }
      ]
    },

    /* ============================ VOCAB ============================ */
    vocab: [
      { en: "pose a risk to", ko: "~에 위험이 되다", ex: "Cheap synthetic fabrics pose a risk to both workers' health and the environment.", tag: "w" },
      { en: "be a double-edged sword", ko: "양날의 검이다", ex: "Social media is a double-edged sword for small fashion brands.", tag: "w" },
      { en: "strike a balance between A and B", ko: "A와 B 사이 균형을 잡다", ex: "Companies must strike a balance between cost and quality.", tag: "w" },
      { en: "have a detrimental effect on", ko: "~에 해로운 영향을 미치다", ex: "Long commutes have a detrimental effect on employees' wellbeing.", tag: "w" },
      { en: "it is widely argued that", ko: "~라는 주장이 널리 제기된다", ex: "It is widely argued that fast fashion encourages waste.", tag: "w" },
      { en: "address the root cause of", ko: "~의 근본 원인을 해결하다", ex: "Recycling alone does not address the root cause of overconsumption.", tag: "w" },
      { en: "outweigh the drawbacks", ko: "단점보다 크다", ex: "In my view, the benefits of hybrid work outweigh the drawbacks.", tag: "w" },
      { en: "place a burden on", ko: "~에 부담을 주다", ex: "Higher taxes would place a heavy burden on low-income families.", tag: "w" },
      { en: "a growing number of", ko: "점점 더 많은 ~", ex: "A growing number of consumers are buying second-hand clothing.", tag: "w" },
      { en: "raise awareness of", ko: "~에 대한 인식을 높이다", ex: "Campaigns can raise awareness of how much water a pair of jeans uses.", tag: "w" },
      { en: "take responsibility for", ko: "~에 대해 책임지다", ex: "Brands should take responsibility for the full life cycle of their products.", tag: "w" },
      { en: "from a long-term perspective", ko: "장기적 관점에서", ex: "From a long-term perspective, durable clothing is cheaper.", tag: "w" },
      { en: "I am writing to enquire about", ko: "~에 대해 문의드리고자 편지 드립니다", ex: "I am writing to enquire about the volunteer positions at your museum.", tag: "w" },
      { en: "I would be grateful if you could", ko: "~해 주시면 감사하겠습니다", ex: "I would be grateful if you could arrange a replacement at your earliest convenience.", tag: "w" },
      { en: "at your earliest convenience", ko: "가능한 한 빨리", ex: "Please contact me at your earliest convenience.", tag: "w" },
      { en: "I look forward to hearing from you", ko: "회신 기다리겠습니다", ex: "Thank you for your attention. I look forward to hearing from you.", tag: "w" },
      { en: "to make matters worse", ko: "설상가상으로", ex: "The parcel arrived late and, to make matters worse, two parts were missing.", tag: "w" },
      { en: "fall short of expectations", ko: "기대에 못 미치다", ex: "The quality of the fabric fell far short of my expectations.", tag: "w" },
      { en: "it goes without saying that", ko: "~는 말할 필요도 없다", ex: "It goes without saying that I will cover any extra costs.", tag: "w" },
      { en: "have a knock-on effect on", ko: "~에 연쇄적 영향을 주다", ex: "Delays in fabric delivery had a knock-on effect on the whole season.", tag: "w" },
      { en: "to be honest with you", ko: "솔직히 말하면", ex: "To be honest with you, I'm not really a morning person.", tag: "s" },
      { en: "it depends on", ko: "~에 따라 다르다", ex: "It depends on the season; in summer I wear much lighter colours.", tag: "s" },
      { en: "I've never really thought about it, but", ko: "생각해 본 적은 없지만", ex: "I've never really thought about it, but I suppose I prefer quiet places.", tag: "s" },
      { en: "get a sense of satisfaction from", ko: "~에서 성취감을 느끼다", ex: "I get a real sense of satisfaction from seeing my designs in stores.", tag: "s" },
      { en: "be under a lot of pressure", ko: "압박이 크다", ex: "Before a sales fair we're under a lot of pressure to finish samples.", tag: "s" },
      { en: "keep up with trends", ko: "트렌드를 따라가다", ex: "As a designer, I have to keep up with trends on social media.", tag: "s" },
      { en: "a turning point", ko: "전환점", ex: "Moving to Seoul for university was a turning point in my life.", tag: "s" },
      { en: "looking back", ko: "돌이켜 보면", ex: "Looking back, I think that teacher shaped my career.", tag: "s" },
      { en: "on the whole", ko: "대체로", ex: "On the whole, I'd say people are becoming more eco-conscious.", tag: "s" },
      { en: "that's a tricky question", ko: "어려운 질문이네요", ex: "That's a tricky question, but I'd probably say no.", tag: "s" },
      { en: "be credited with", ko: "~의 공로를 인정받다", ex: "He is often credited with inventing the process.", tag: "r" },
      { en: "in proportion", ko: "비례하여", ex: "Your salary will be adjusted in proportion to your hours.", tag: "r" },
      { en: "be entitled to", ko: "~할 자격이 있다", ex: "Part-time staff are entitled to the same training as full-time staff.", tag: "r" },
      { en: "with the exception of", ko: "~을 제외하고", ex: "All facilities are open, with the exception of the sauna.", tag: "r" },
      { en: "come to mean", ko: "~를 뜻하게 되다", ex: "The word gradually came to mean anything of poor quality.", tag: "r" },
      { en: "give way to", ko: "~에 자리를 내주다", ex: "Natural dyes gradually gave way to cheaper synthetic ones.", tag: "r" },
      { en: "on second thoughts", ko: "다시 생각해 보니 (정정 신호)", ex: "On second thoughts, let's make it Thursday instead.", tag: "l" },
      { en: "that's not quite right", ko: "그건 정확하지 않아요 (정정 신호)", ex: "Fourteen pounds? No, that's not quite right — it's forty.", tag: "l" },
      { en: "the main thing is", ko: "핵심은 ~이다 (정답 신호)", ex: "The main thing is that bookings can only be made online.", tag: "l" },
      { en: "by contrast", ko: "반면에 (대비 신호)", ex: "The north-east corner, by contrast, has been left as a meadow.", tag: "l" }
    ]
  };
})();
