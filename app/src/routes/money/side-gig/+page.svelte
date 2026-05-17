<script lang="ts">
	import { onMount } from 'svelte';
	import { fbReadCollection } from '$lib/firestore';
	import { loadWorks, type Work } from '$lib/works';
	import { fmtKRW } from '$lib/utils/format';
	import { todayKey } from '$lib/utils/greeting';

	type IncomeRow = {
		id: string;
		month?: string;
		work_details?: string;
		category?: string;
		status?: string;
		revenue?: number;
	};

	let works = $state<Work[]>([]);
	let income = $state<IncomeRow[]>([]);
	let loading = $state(true);
	let error = $state('');
	let year = $state(new Date().getFullYear());

	onMount(load);

	async function load() {
		loading = true;
		error = '';
		try {
			const [w, inc] = await Promise.all([loadWorks(), fbReadCollection<IncomeRow>('income')]);
			works = w;
			income = inc;
		} catch (e: any) {
			error = e?.message || '로드 실패';
		} finally {
			loading = false;
		}
	}

	const today = todayKey();

	function workStatus(w: Work): 'active' | 'upcoming' | 'past' | 'draft' {
		const s = (w.status || '').toLowerCase();
		if (s === 'draft' || s.includes('draft')) return 'draft';
		if (w.publish_start && w.publish_end) {
			if (today >= w.publish_start && today <= w.publish_end) return 'active';
			if (today < w.publish_start) return 'upcoming';
			return 'past';
		}
		return 'draft';
	}

	const confirmedWorks = $derived(works.filter((w) => (w.status || '').toLowerCase() === 'confirmed'));

	const activeWorks = $derived(confirmedWorks.filter((w) => workStatus(w) === 'active'));
	const upcomingWorks = $derived(confirmedWorks.filter((w) => workStatus(w) === 'upcoming'));
	const pastWorks = $derived(confirmedWorks.filter((w) => workStatus(w) === 'past'));
	const draftWorks = $derived(works.filter((w) => (w.status || '').toLowerCase() === 'draft'));

	// 이번 연도 매출 (income 컬렉션)
	const yearIncome = $derived.by(() => {
		const filtered = income.filter((r) => (r.month || '').startsWith(String(year)));
		let total = 0;
		const byCat: Record<string, number> = {};
		const byMonth: Record<string, number> = {};
		filtered.forEach((r) => {
			const rev = Number(r.revenue) || 0;
			total += rev;
			const c = r.category || '기타';
			byCat[c] = (byCat[c] || 0) + rev;
			if (r.month) byMonth[r.month] = (byMonth[r.month] || 0) + rev;
		});
		return {
			total,
			items: filtered.length,
			byCat: Object.entries(byCat).sort((a, b) => b[1] - a[1]),
			byMonth: Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]))
		};
	});

	const maxMonth = $derived(Math.max(...yearIncome.byMonth.map((m) => m[1]), 1));

	function changeYear(delta: number) {
		year += delta;
	}

	function workCard(w: Work) {
		const status = workStatus(w);
		const colors = {
			active: { bg: '#dcfce7', text: '#15803d', label: '연재 중' },
			upcoming: { bg: '#dbeafe', text: '#1d4ed8', label: '예정' },
			past: { bg: '#f1f5f9', text: '#475569', label: '종료' },
			draft: { bg: '#fef3c7', text: '#92400e', label: '기획' }
		};
		return colors[status];
	}
</script>

{#if loading}
	<div class="text-center py-12">
		<p class="text-sm text-slate-400">부업 데이터 불러오는 중...</p>
	</div>
{:else if error}
	<div class="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-700">
		⚠️ {error}
	</div>
{:else}
	<!-- 연도 헤더 -->
	<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
		<div>
			<h2 class="text-xl md:text-2xl font-extrabold headline">{year}년 부업 현황</h2>
			<p class="text-xs text-slate-500">전체 작품 {works.length}개 · 확정 {confirmedWorks.length}개</p>
		</div>
		<div class="flex items-center gap-1">
			<button
				onclick={() => changeYear(-1)}
				class="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold"
			>
				‹
			</button>
			<span class="px-3 text-xs text-slate-500 min-w-[60px] text-center">{year}</span>
			<button
				onclick={() => changeYear(1)}
				class="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold"
			>
				›
			</button>
		</div>
	</div>

	<!-- 작품 상태 KPI -->
	<section class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
		<div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-emerald-700 tracking-widest uppercase mb-1">연재 중</p>
			<p class="text-xl md:text-2xl font-extrabold text-emerald-900">{activeWorks.length}</p>
		</div>
		<div class="bg-blue-50 border border-blue-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-blue-700 tracking-widest uppercase mb-1">예정</p>
			<p class="text-xl md:text-2xl font-extrabold text-blue-900">{upcomingWorks.length}</p>
		</div>
		<div class="bg-slate-50 border border-slate-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-slate-700 tracking-widest uppercase mb-1">종료</p>
			<p class="text-xl md:text-2xl font-extrabold text-slate-900">{pastWorks.length}</p>
		</div>
		<div class="bg-amber-50 border border-amber-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-amber-700 tracking-widest uppercase mb-1">기획</p>
			<p class="text-xl md:text-2xl font-extrabold text-amber-900">{draftWorks.length}</p>
		</div>
	</section>

	<!-- 연간 수익 -->
	<section
		class="bg-white rounded-2xl p-5 border border-violet-200 mb-5"
		style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)"
	>
		<p class="text-[10px] font-bold text-violet-700 tracking-widest uppercase mb-1">
			{year}년 총 수익
		</p>
		<p class="text-3xl md:text-4xl font-extrabold text-violet-950">
			{fmtKRW(yearIncome.total)}
		</p>
		<p class="text-xs text-violet-700 mt-1">
			{yearIncome.items}건 기록 · 평균 {yearIncome.items
				? fmtKRW(Math.round(yearIncome.total / yearIncome.items))
				: '—'}
		</p>
	</section>

	<!-- 월별 수익 -->
	{#if yearIncome.byMonth.length > 0}
		<section
			class="bg-white rounded-2xl p-5 border border-slate-100 mb-5"
			style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
		>
			<h3 class="text-sm font-bold mb-4 text-slate-800">📊 월별 수익</h3>
			<div class="flex flex-col gap-2">
				{#each yearIncome.byMonth as [month, rev]}
					{@const pct = (rev / maxMonth) * 100}
					<div class="flex items-center gap-2">
						<span class="text-[11px] font-bold text-slate-600 w-14 shrink-0 font-mono">
							{month.substring(5)}월
						</span>
						<div class="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
							<div
								class="h-full rounded-full"
								style="width: {pct}%; background: linear-gradient(90deg, #7c3aed, #a855f7)"
							></div>
						</div>
						<span class="text-[11px] font-bold text-slate-700 w-24 text-right shrink-0">
							{fmtKRW(rev)}
						</span>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- 연재 중 작품 -->
	{#if activeWorks.length > 0}
		<section
			class="bg-white rounded-2xl p-5 border border-slate-100 mb-5"
			style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
		>
			<h3 class="text-sm font-bold mb-3 text-slate-800">🟢 연재 중</h3>
			<div class="flex flex-col gap-2">
				{#each activeWorks as w}
					{@const c = workCard(w)}
					<div class="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1 flex-wrap">
								<span
									class="text-[10px] font-bold px-2 py-0.5 rounded-full"
									style="background: {c.bg}; color: {c.text}"
								>
									{c.label}
								</span>
								{#if w.series_name}
									<span class="text-[10px] text-emerald-700 font-semibold">
										{w.series_name}
									</span>
								{/if}
								{#if w.platform}
									<span class="text-[10px] text-slate-500">· {w.platform}</span>
								{/if}
							</div>
							<p class="text-sm font-bold text-slate-900">{w.title || '—'}</p>
							{#if w.publish_start && w.publish_end}
								<p class="text-[10px] text-slate-500 mt-0.5">
									{w.publish_start} ~ {w.publish_end}
								</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- 예정 작품 -->
	{#if upcomingWorks.length > 0}
		<section
			class="bg-white rounded-2xl p-5 border border-slate-100 mb-5"
			style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
		>
			<h3 class="text-sm font-bold mb-3 text-slate-800">🔵 예정 작품</h3>
			<div class="flex flex-col gap-2">
				{#each upcomingWorks as w}
					{@const c = workCard(w)}
					<div class="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1 flex-wrap">
								<span
									class="text-[10px] font-bold px-2 py-0.5 rounded-full"
									style="background: {c.bg}; color: {c.text}"
								>
									{c.label}
								</span>
								{#if w.series_name}
									<span class="text-[10px] text-blue-700 font-semibold">
										{w.series_name}
									</span>
								{/if}
								{#if w.publish_start}
									<span class="text-[10px] text-slate-500">· {w.publish_start} 시작</span>
								{/if}
							</div>
							<p class="text-sm font-bold text-slate-900">{w.title || '—'}</p>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- 기획/Draft -->
	{#if draftWorks.length > 0}
		<section
			class="bg-white rounded-2xl p-5 border border-slate-100 mb-5"
			style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
		>
			<h3 class="text-sm font-bold mb-3 text-slate-800">📝 기획 중 (Draft)</h3>
			<div class="flex flex-wrap gap-2">
				{#each draftWorks as w}
					<span
						class="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700"
					>
						{w.title || '—'}
					</span>
				{/each}
			</div>
		</section>
	{/if}

	<!-- 종료 작품 -->
	{#if pastWorks.length > 0}
		<details class="bg-white rounded-2xl p-5 border border-slate-100">
			<summary class="text-sm font-bold text-slate-800 cursor-pointer">
				⬜ 종료된 작품 {pastWorks.length}개 (펼치기)
			</summary>
			<div class="flex flex-col gap-2 mt-3">
				{#each pastWorks as w}
					<div class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1 flex-wrap">
								{#if w.series_name}
									<span class="text-[10px] text-slate-700 font-semibold">{w.series_name}</span>
								{/if}
								{#if w.publish_end}
									<span class="text-[10px] text-slate-500">· {w.publish_end} 종료</span>
								{/if}
							</div>
							<p class="text-sm font-semibold text-slate-700">{w.title || '—'}</p>
						</div>
					</div>
				{/each}
			</div>
		</details>
	{/if}
{/if}
