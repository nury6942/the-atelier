// 작품 데이터 — works/list 단일 문서 (JSON 문자열로 저장됨)
import { fbReadDoc } from './firestore';

export type Work = {
	id: string;
	title?: string;
	series_name?: string;
	series_id?: string;
	platform?: string;
	status?: string; // 'draft', 'confirmed', '연재중', etc.
	publish_start?: string;
	publish_end?: string;
	episodes?: number;
	[key: string]: any;
};

export async function loadWorks(): Promise<Work[]> {
	try {
		// 1) 클라우드 (works/list)
		const doc = await fbReadDoc<{ data?: string; updatedAt?: string }>('works/list');
		if (doc?.data) {
			return JSON.parse(doc.data) as Work[];
		}
	} catch (e) {
		console.error('[works load]', e);
	}
	// 2) localStorage 폴백
	try {
		const s = localStorage.getItem('atelier_works');
		if (s) return JSON.parse(s) as Work[];
	} catch (e) {}
	return [];
}
