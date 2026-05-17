// 이번 주(월~일) 날짜 + 일정 매핑
export type WeekDay = {
	date: string; // YYYY-MM-DD
	dayKr: string; // 월화수…
	dayNum: number; // 1~31
	isToday: boolean;
	isWeekend: boolean;
	events: Array<{ title: string; category?: string; color?: string }>;
};

export function getThisWeek(): WeekDay[] {
	const now = new Date();
	const dayOfWeek = now.getDay(); // 0=일, 1=월, …
	const monday = new Date(now);
	monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
	monday.setHours(0, 0, 0, 0);

	const days = ['일', '월', '화', '수', '목', '금', '토'];
	const todayStr =
		now.getFullYear() +
		'-' +
		String(now.getMonth() + 1).padStart(2, '0') +
		'-' +
		String(now.getDate()).padStart(2, '0');

	const week: WeekDay[] = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(monday);
		d.setDate(monday.getDate() + i);
		const date =
			d.getFullYear() +
			'-' +
			String(d.getMonth() + 1).padStart(2, '0') +
			'-' +
			String(d.getDate()).padStart(2, '0');
		const dayIdx = d.getDay();
		week.push({
			date,
			dayKr: days[dayIdx],
			dayNum: d.getDate(),
			isToday: date === todayStr,
			isWeekend: dayIdx === 0 || dayIdx === 6,
			events: []
		});
	}
	return week;
}

export function weekRangeStr(week: WeekDay[]): string {
	if (!week.length) return '';
	const first = week[0];
	const last = week[6];
	const [, m1, d1] = first.date.split('-');
	const [, m2, d2] = last.date.split('-');
	if (m1 === m2) return `${parseInt(m1)}월 ${parseInt(d1)} ~ ${parseInt(d2)}일`;
	return `${parseInt(m1)}/${parseInt(d1)} ~ ${parseInt(m2)}/${parseInt(d2)}`;
}
