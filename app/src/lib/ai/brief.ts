// AI 브리프 생성 — Claude API 직접 호출
// 데이터 수집 + 프롬프트 빌드 + JSON 파싱

import { fbReadCollection, fbReadDoc } from '../firestore';
import { todayKey } from '../utils/greeting';

export type BriefItem = { icon: string; title: string; tag: string };

const API_KEY_STORAGE = 'atelier_anthropic_api_key';
const CACHE_PREFIX = 'atelier_brief_v5_';

export function getApiKey(): string | null {
	return localStorage.getItem(API_KEY_STORAGE);
}

export function setApiKey(key: string): void {
	if (key) localStorage.setItem(API_KEY_STORAGE, key);
	else localStorage.removeItem(API_KEY_STORAGE);
}

export function getCachedBrief(): { items: BriefItem[]; time: string } | null {
	const cacheKey = CACHE_PREFIX + todayKey();
	try {
		const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
		if (cached?.items?.length) return cached;
	} catch (e) {}
	return null;
}

function setCachedBrief(items: BriefItem[]): void {
	const cacheKey = CACHE_PREFIX + todayKey();
	const time =
		new Date().getHours().toString().padStart(2, '0') +
		':' +
		new Date().getMinutes().toString().padStart(2, '0');
	localStorage.setItem(cacheKey, JSON.stringify({ items, time }));
}

async function buildSummary(): Promise<string> {
	const today = todayKey();
	const dayLater = new Date();
	dayLater.setDate(dayLater.getDate() + 14);
	const horizon = dayLater.toISOString().split('T')[0];

	// 병렬 로드
	const [planner, trips, income] = await Promise.all([
		fbReadCollection<{ date?: string; title?: string; category?: string }>('planner'),
		fbReadCollection<{ name?: string; start_date?: string; end_date?: string }>('trips'),
		fbReadCollection<{ work_details?: string; status?: string; month?: string; revenue?: number }>(
			'income'
		)
	]);

	// 재정 (Daily Ledger)
	type LedgerData = { transactions?: Array<{ date: string; 대분류: string; 금액: number }> };
	const ledger = await fbReadDoc<LedgerData>('appSettings/ledgerData');
	const txs = ledger?.transactions || [];
	const month = today.substring(0, 7);
	let inc = 0,
		exp = 0;
	for (const t of txs) {
		if (!t.date || t.date.substring(0, 7) !== month) continue;
		if (t.대분류 === '수입') inc += t.금액 || 0;
		else if (t.대분류 !== '저축') exp += t.금액 || 0;
	}
	const incomeMan = Math.round(inc / 10000);
	const expenseMan = Math.round(exp / 10000);
	const balanceMan = incomeMan - expenseMan;

	// 다음 여행
	const sortedTrips = [...trips].sort((a, b) =>
		(a.start_date || '').localeCompare(b.start_date || '')
	);
	const nextTrip = sortedTrips.find((t) => (t.start_date || '') >= today);
	let tripSummary = '없음';
	if (nextTrip?.name && nextTrip.start_date) {
		const dDay = Math.ceil(
			(new Date(nextTrip.start_date).getTime() - new Date(today).getTime()) / 86400000
		);
		tripSummary = `${nextTrip.name} (D-${dDay})`;
	}

	// 이번 주~2주 일정 + 업무
	const upcoming = planner.filter((p) => {
		const d = (p.date || '').toString();
		return d >= today && d <= horizon;
	});
	const bizEvents = upcoming.filter((p) => {
		const combo = `${p.category || ''} ${p.title || ''}`;
		return /업무|회사|출장|야근|미팅|회의/i.test(combo);
	});

	// 작품 (이번달 진행 중)
	const works = income.filter((w) => {
		const s = (w.status || '').toLowerCase();
		if (s.includes('완료') || s.includes('중단') || s.includes('드롭')) return false;
		return (w.month || '').startsWith(month) || !w.month;
	});

	// 요약 빌드
	let summary = `날짜: ${today}\n\n`;
	summary += `【다음 여행】 ${tripSummary}\n\n`;
	summary += `【이번 주~2주 일정】 총 ${upcoming.length}건`;
	if (bizEvents.length) summary += ` (업무/회의 ${bizEvents.length}건)`;
	summary += '\n';
	if (bizEvents.length) {
		summary += bizEvents
			.slice(0, 5)
			.map((r) => `  - ${r.date} ${r.title || ''}`)
			.join('\n');
		summary += '\n';
	}
	summary += `\n【작품 진행】 ${works.length}개\n`;
	if (works.length) {
		summary += works
			.slice(0, 5)
			.map((w) => `  - ${w.work_details || ''}`)
			.join('\n');
		summary += '\n';
	}
	summary += `\n【이번 달 재정】 수입 ${incomeMan}만, 지출 ${expenseMan}만, 잔액 ${balanceMan}만\n`;
	return summary;
}

export async function generateBrief(): Promise<BriefItem[]> {
	const apiKey = getApiKey();
	if (!apiKey) throw new Error('API_KEY_MISSING');

	const summary = await buildSummary();

	const prompt = `당신은 사용자의 개인 비서입니다. 아래 데이터를 보고 사용자가 오늘/이번 주에 가장 신경 써야 할 항목 4개를 골라 한국어 친근한 톤으로 알려주세요.

응답 형식 — 반드시 아래 JSON 배열만. 다른 텍스트(설명/머리말/\`\`\`json) 절대 금지:
[
  { "icon": "⚡", "title": "내일까지 '첫사랑 개' 마감", "tag": "오늘 집중하세요" },
  { "icon": "⏰", "title": "이번 주 일정 36건", "tag": "놓친 건 없는지 확인" },
  { "icon": "✈️", "title": "독일 여행 사전예약 2건 안 됨", "tag": "D-133 점검 필요" },
  { "icon": "💰", "title": "이번 달 잔액 1.38억", "tag": "지출 흐름 점검" }
]

규칙:
- 정확히 4개 객체
- icon: 단일 이모지 1개만 (⚡⏰💰✈️📋📅🔥💼🎯 등)
- title: 25자 이내, 구체적 (이름·날짜·숫자 포함)
- tag: 15자 이내, 행동 지향
- 마크다운/HTML 절대 사용 금지
- 우선순위 높은 것부터

데이터:
${summary}

JSON 배열만 응답:`;

	const model = localStorage.getItem('atelier_anthropic_model') || 'claude-sonnet-4-5';

	const res = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
			'anthropic-dangerous-direct-browser-access': 'true',
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			model: model,
			max_tokens: 600,
			messages: [{ role: 'user', content: prompt }]
		})
	});

	if (!res.ok) {
		const errText = await res.text().catch(() => '');
		throw new Error(`HTTP ${res.status}: ${errText.substring(0, 200)}`);
	}

	const data = await res.json();
	const text = (data.content?.[0]?.text || '').trim();

	// JSON 파싱
	let items: BriefItem[] = [];
	let jsonText = text;
	const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
	if (fenceMatch) jsonText = fenceMatch[1].trim();
	const firstBracket = jsonText.indexOf('[');
	const lastBracket = jsonText.lastIndexOf(']');
	if (firstBracket !== -1 && lastBracket !== -1) {
		jsonText = jsonText.substring(firstBracket, lastBracket + 1);
	}
	try {
		items = JSON.parse(jsonText);
	} catch (e) {
		throw new Error('PARSE_FAILED: ' + text.substring(0, 100));
	}

	if (!Array.isArray(items) || items.length === 0) throw new Error('EMPTY_RESPONSE');

	setCachedBrief(items);
	return items;
}
