// 시간대별 한국어 인사말
export function getGreeting(): string {
	const h = new Date().getHours();
	if (h < 5) return '늦은 시간이네요';
	if (h < 11) return '좋은 아침이에요';
	if (h < 14) return '오늘도 화이팅';
	if (h < 18) return '잘 보내고 있어요?';
	if (h < 22) return '저녁 무렵이네요';
	return '오늘 하루도 수고했어요';
}

export function formatToday(): string {
	const d = new Date();
	const days = ['일', '월', '화', '수', '목', '금', '토'];
	return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

export function todayKey(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
