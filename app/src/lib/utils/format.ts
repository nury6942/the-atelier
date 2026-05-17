// 금액/숫자 포맷
export function fmtKRW(n: number): string {
	return '₩' + (n || 0).toLocaleString('ko-KR');
}

export function fmtMan(n: number): string {
	// 만원 단위 (1,234,567 → "123.5만")
	const man = n / 10000;
	if (Math.abs(man) >= 100) return Math.round(man).toLocaleString() + '만';
	return man.toFixed(1) + '만';
}
