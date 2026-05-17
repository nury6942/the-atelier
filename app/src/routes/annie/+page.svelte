<script lang="ts">
	import { onMount } from 'svelte';
	import { fbReadCollection } from '$lib/firestore';
	import { fmtKRW } from '$lib/utils/format';
	import { todayKey } from '$lib/utils/greeting';

	type Lesson = {
		id: string;
		lesson_name?: string;
		date?: string;
		status?: string; // 예정/완료/취소
		track?: string;
		fee?: number | string;
		notes?: string;
	};

	type Session = {
		id: string;
		title?: string;
		expressions?: Array<{ expr?: string; kr?: string; ex?: string; cat?: string }>;
		vocabulary?: Array<any>;
		grammar?: any[];
		date?: string;
	};

	let lessons = $state<Lesson[]>([]);
	let sessions = $state<Session[]>([]);
	let loading = $state(true);
	let error = $state('');
	let selectedSession = $state<Session | null>(null);

	onMount(async () => {
		loading = true;
		try {
			const [l, s] = await Promise.all([
				fbReadCollection<Lesson>('english'),
				fbReadCollection<Session>('englishSessions')
			]);
			lessons = l;
			sessions = s;
		} catch (e: any) {
			error = e?.message || '로드 실패';
		} finally {
			loading = false;
		}
	});

	const today = todayKey();

	const stats = $derived.by(() => {
		const completed = lessons.filter((l) => l.status === '완료').length;
		const upcoming = lessons.filter((l) => l.status === '예정' || !l.status).length;
		const cancelled = lessons.filter((l) => l.status === '취소').length;
		let totalFee = 0;
		lessons.forEach((l) => {
			if (l.status === '취소') return;
			const f = typeof l.fee === 'string' ? parseFloat(l.fee.replace(/[^0-9.]/g, '')) : Number(l.fee);
			if (!isNaN(f)) totalFee += f;
		});
		// 총 표현 학습수
		let totalExpr = 0;
		sessions.forEach((s) => {
			totalExpr += (s.expressions || []).length;
		});
		return {
			completed,
			upcoming,
			cancelled,
			totalFee, // GBP
			totalExpr,
			reviewedCount: sessions.length
		};
	});

	// 정렬된 레슨
	const sortedLessons = $derived(
		[...lessons].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
	);

	// 트라이메스터로 그룹화 (3개월 단위)
	function getTrimesterKey(dateStr?: string): string {
		if (!dateStr) return 'Unknown';
		const m = parseInt(dateStr.split('-')[1]);
		const y = dateStr.split('-')[0];
		if (m <= 4) return `${y} Trimester 1 (Jan~Apr)`;
		if (m <= 8) return `${y} Trimester 2 (May~Aug)`;
		return `${y} Trimester 3 (Sep~Dec)`;
	}

	const groups = $derived.by(() => {
		const map: Record<string, Lesson[]> = {};
		sortedLessons.forEach((l) => {
			const key = getTrimesterKey(l.date);
			if (!map[key]) map[key] = [];
			map[key].push(l);
		});
		return Object.entries(map);
	});

	function hasReview(date?: string): boolean {
		if (!date) return false;
		return sessions.some((s) => s.id === date || s.date === date);
	}

	function getSession(date?: string): Session | undefined {
		if (!date) return undefined;
		return sessions.find((s) => s.id === date || s.date === date);
	}

	// 최근 표현 (모든 세션의 expressions 풀에서 최근 10개)
	const recentExprs = $derived.by(() => {
		const all: Array<{ expr: string; kr: string; ex: string; cat: string; sessionDate: string }> =
			[];
		sessions.forEach((s) => {
			const d = s.id || s.date || '';
			(s.expressions || []).forEach((e) => {
				all.push({
					expr: e.expr || '',
					kr: e.kr || '',
					ex: e.ex || '',
					cat: e.cat || '',
					sessionDate: d
				});
			});
		});
		return all.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate)).slice(0, 10);
	});

	function statusColor(status?: string): { bg: string; text: string } {
		if (status === '완료') return { bg: '#e0e7ff', text: '#3730a3' };
		if (status === '취소') return { bg: '#fee2e2', text: '#b91c1c' };
		return { bg: '#f1f5f9', text: '#475569' };
	}
</script>

<div class="p-4 md:p-8 max-w-[1280px] mx-auto">
	<div class="flex items-center gap-3 mb-1">
		<h1 class="text-2xl md:text-3xl font-extrabold headline">Annie</h1>
		<span class="text-xs text-slate-400">— English Lessons</span>
	</div>

	{#if loading}
		<div class="text-center py-12">
			<p class="text-sm text-slate-400">레슨 데이터 불러오는 중...</p>
		</div>
	{:else if error}
		<div class="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-700">
			⚠️ {error}
		</div>
	{:else}
		<!-- KPI -->
		<section class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 mt-4">
			<div class="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
				<p class="text-[10px] font-bold text-indigo-700 tracking-widest uppercase mb-1">완료</p>
				<p class="text-xl md:text-2xl font-extrabold text-indigo-900">
					{stats.completed}
					<span class="text-xs font-bold opacity-70">회차</span>
				</p>
			</div>
			<div class="bg-slate-50 border border-slate-200 rounded-2xl p-4">
				<p class="text-[10px] font-bold text-slate-700 tracking-widest uppercase mb-1">예정</p>
				<p class="text-xl md:text-2xl font-extrabold text-slate-900">
					{stats.upcoming}
					<span class="text-xs font-bold opacity-70">회차</span>
				</p>
			</div>
			<div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
				<p class="text-[10px] font-bold text-emerald-700 tracking-widest uppercase mb-1">
					리뷰 작성
				</p>
				<p class="text-xl md:text-2xl font-extrabold text-emerald-900">
					{stats.reviewedCount}
				</p>
			</div>
			<div class="bg-violet-50 border border-violet-200 rounded-2xl p-4">
				<p class="text-[10px] font-bold text-violet-700 tracking-widest uppercase mb-1">
					학습 표현
				</p>
				<p class="text-xl md:text-2xl font-extrabold text-violet-900">
					{stats.totalExpr}
				</p>
			</div>
		</section>

		<!-- 수업료 -->
		{#if stats.totalFee > 0}
			<section class="bg-white rounded-2xl p-5 border border-slate-100 mb-5">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">
							총 수업료 (취소 제외)
						</p>
						<p class="text-xl md:text-2xl font-extrabold text-slate-900">
							£{stats.totalFee.toFixed(0)}
						</p>
					</div>
					<div class="text-right text-xs text-slate-400">
						{stats.completed + stats.upcoming}회 기준
					</div>
				</div>
			</section>
		{/if}

		<!-- 최근 학습 표현 -->
		{#if recentExprs.length > 0}
			<section
				class="bg-white rounded-2xl p-5 border border-slate-100 mb-5"
				style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
			>
				<h3 class="text-sm font-bold mb-3 text-slate-800">💬 최근 학습 표현</h3>
				<div class="flex flex-col gap-2">
					{#each recentExprs as expr}
						<div class="p-3 bg-violet-50 rounded-xl">
							<div class="flex items-center gap-2 mb-1 flex-wrap">
								{#if expr.cat}
									<span
										class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-200 text-violet-800"
									>
										{expr.cat}
									</span>
								{/if}
								<span class="text-[10px] text-slate-400 font-mono">{expr.sessionDate}</span>
							</div>
							<p class="text-sm font-bold italic text-violet-950 mb-0.5">{expr.expr}</p>
							{#if expr.kr}
								<p class="text-xs text-slate-700">{expr.kr}</p>
							{/if}
							{#if expr.ex}
								<p class="text-xs text-slate-500 italic mt-1">{expr.ex}</p>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- 레슨 일정 (트라이메스터별 그룹) -->
		<section
			class="bg-white rounded-2xl p-4 border border-slate-100"
			style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
		>
			<h3 class="text-sm font-bold mb-3 text-slate-800">📚 레슨 일정</h3>
			{#if groups.length === 0}
				<p class="text-xs text-slate-400 italic py-4 text-center">등록된 레슨 없음</p>
			{:else}
				<div class="flex flex-col gap-4">
					{#each groups as [trimester, items]}
						<div>
							<h4 class="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-2">
								{trimester} · {items.length}회차
							</h4>
							<div class="flex flex-col gap-1.5">
								{#each items as l, idx}
									{@const sc = statusColor(l.status)}
									{@const isReviewed = hasReview(l.date)}
									{@const isPast = (l.date || '') < today}
									<div
										class="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl
											{l.status === '취소' ? 'opacity-50' : ''}"
									>
										<span class="text-xs font-bold text-slate-600 w-12 shrink-0">
											{idx + 1}회차
										</span>
										<span class="text-xs text-slate-500 font-mono w-24 shrink-0">
											{l.date || '—'}
										</span>
										<span
											class="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
											style="background: {sc.bg}; color: {sc.text}"
										>
											{l.status || '예정'}
										</span>
										<span class="flex-1 text-xs text-slate-500 italic truncate">
											{l.notes || ''}
										</span>
										<div class="flex items-center gap-2 shrink-0">
											{#if l.fee}
												<span class="text-[11px] font-bold text-slate-700">
													£{typeof l.fee === 'string'
														? parseFloat(l.fee.replace(/[^0-9.]/g, '')).toFixed(0)
														: Number(l.fee).toFixed(0)}
												</span>
											{/if}
											{#if isReviewed}
												<span
													class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"
												>
													📝 리뷰 있음
												</span>
											{:else if isPast && l.status === '완료'}
												<span class="text-[10px] text-slate-400">미작성</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<!-- 안내 -->
		<section class="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
			💡 레슨/리뷰 추가는 다음 단계. main 사이트에서 입력하면 여기서 확인 가능.
		</section>
	{/if}
</div>
