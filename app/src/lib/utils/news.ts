// 뉴스 가져오기 — 한겨레 (경제+정치), BBC World
// rss2json.com으로 CORS 우회

export type NewsItem = {
	title: string;
	link: string;
	pubDate?: string;
	section?: string;
	translation?: string;
};

const CACHE_KEY = 'atelier_dash_news_v2';
const CACHE_TTL_MS = 3600_000; // 1시간

export async function fetchDashNews(): Promise<{ kr: NewsItem[]; en: NewsItem[] }> {
	// 캐시 확인
	try {
		const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
		if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
			return { kr: cached.kr || [], en: cached.en || [] };
		}
	} catch (e) {}

	const econRss =
		'https://api.rss2json.com/v1/api.json?rss_url=' +
		encodeURIComponent('https://www.hani.co.kr/rss/economy/');
	const politRss =
		'https://api.rss2json.com/v1/api.json?rss_url=' +
		encodeURIComponent('https://www.hani.co.kr/rss/politics/');
	const enRss =
		'https://api.rss2json.com/v1/api.json?rss_url=' +
		encodeURIComponent('http://feeds.bbci.co.uk/news/world/rss.xml');

	let kr: NewsItem[] = [];
	let en: NewsItem[] = [];

	try {
		const [econRes, politRes, enRes] = await Promise.all([
			fetch(econRss).then((r) => r.json()).catch(() => null),
			fetch(politRss).then((r) => r.json()).catch(() => null),
			fetch(enRss).then((r) => r.json()).catch(() => null)
		]);

		const econ = econRes?.items?.slice(0, 3).map((i: any) => ({ ...i, section: '경제' })) || [];
		const polit = politRes?.items?.slice(0, 3).map((i: any) => ({ ...i, section: '정치' })) || [];
		kr = [...econ, ...polit]
			.sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime())
			.slice(0, 5);
		en = enRes?.items?.slice(0, 5) || [];

		try {
			localStorage.setItem(CACHE_KEY, JSON.stringify({ kr, en, fetchedAt: Date.now() }));
		} catch (e) {}
	} catch (e) {
		console.warn('[news]', e);
	}

	return { kr, en };
}
