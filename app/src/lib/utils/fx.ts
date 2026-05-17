// 환율 가져오기 — exchangerate-api.com (무료, API 키 없이 사용)
// localStorage 12시간 캐시 + 환전 수수료 마크업 1.75%

const FX_MARKUP_RATE = 1.0175;
const CACHE_TTL_MS = 12 * 3600_000; // 12시간

export async function fetchKrwRate(currency: string): Promise<number | null> {
	const key = (currency || '').toUpperCase();
	if (!key) return null;
	if (key === 'KRW') return 1;

	const cacheKey = `atelier_fx_${key}_krw`;
	try {
		const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
		if (cached && cached.rate && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
			return Math.round(cached.rate * FX_MARKUP_RATE);
		}
	} catch (e) {}

	try {
		const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${key}`);
		const data = await res.json();
		if (data?.rates?.KRW) {
			localStorage.setItem(cacheKey, JSON.stringify({ rate: data.rates.KRW, fetchedAt: Date.now() }));
			return Math.round(data.rates.KRW * FX_MARKUP_RATE);
		}
	} catch (e) {
		console.warn('[FX]', key, '실패:', e);
	}

	// 폴백: 오래된 캐시
	try {
		const old = JSON.parse(localStorage.getItem(cacheKey) || 'null');
		if (old?.rate) return Math.round(old.rate * FX_MARKUP_RATE);
	} catch (e) {}

	return null;
}

export const DEFAULT_CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'CAD'];
