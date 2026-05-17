<script lang="ts">
	import { onMount } from 'svelte';
	import { fbReadCollection } from '$lib/firestore';
	import { fmtKRW } from '$lib/utils/format';

	type Work = {
		id: string;
		month?: string;
		work_details?: string;
		category?: string;
		status?: string;
		revenue?: number;
	};

	let works = $state<Work[]>([]);
	let loading = $state(true);
	let error = $state('');
	let year = $state(new Date().getFullYear());

	onMount(load);

	async function load() {
		loading = true;
		error = '';
		try {
			works = await fbReadCollection<Work>('income');
		} catch (e: any) {
			error = e?.message || '로드 실패';
		} finally {
			loading = false;
		}
	}

	// 올해 데이터만 필터
	const yearWorks = $derived(works.filter((w) => (w.month || '').startsWith(String(year))));

	const stats = $derived.by(() => {
		let total = 0;
		const byCategory: Record<string, number> = {};
		const byStatus: Record<string, number> = {};
		const byMonth: Record<string, number> = {};
		yearWorks.forEach((w) => {
			const rev = Number(w.revenue) || 0;
			total += rev;
			const cat = w.category || '기타';
			byCategory[cat] = (byCategory[cat] || 0) + rev;
			const st = w.status || '미지정';
			byStatus[st] = (byStatus[st] || 0) + 1;
			if (w.month) byMonth[w.month] = (byMonth[w.month] || 0) + rev;
		});
		return {
			total,
			count: yearWorks.length,
			byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]),
			byStatus: Object.entries(byStatus).sort((a, b) => b[1] - a[1]),
			byMonth: Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])),
			avgPerWork: yearWorks.length > 0 ? total / yearWorks.length : 0
		};
	});

	const maxMonthRev = $derived(Math.max(...stats.byMonth.map((m) => m[1]), 1));

	function statusColor(status: string): { bg: string; text: string } {
		const s = status.toLowerCase();
		if (s.includes('완료') || s.includes('confirmed'))
			return { bg: '#dcfce7', text: '#15803d' };
		if (s.includes('진행') || s.includes('연재')) return { bg: '#dbeafe', text: '#1d4ed8' };
		if (s.includes('대기') || s.includes('pending')) return { bg: '#fef3c7', text: '#92400e' };
		if (s.includes('중단') || s.includes('드롭')) return { bg: '#fee2e2', text: '#b91c1c' };
		return { bg: '#f1f5f9', text: '#475569' };
	}

	function changeYear(delta: number) {
		year += delta;
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
			<h2 class="text-xl md:text-2xl font-extrabold headline">{year}년 부업 수익</h2>
			<p class="text-xs text-slate-500">{stats.count}개 작품 · 전체 {works.length}건</p>
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

	<!-- KPI -->
	<section class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
		<div
			class="bg-white rounded-2xl p-5 border border-violet-200"
			style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)"
		>
			<p class="text-[10px] font-bold text-violet-700 tracking-widest uppercase mb-1">
				연간 총 수익
			</p>
			<p class="text-xl md:text-2xl font-extrabold text-violet-950">{fmtKRW(stats.total)}</p>
		</div>
		<div class="bg-white rounded-2xl p-5 border border-emerald-200">
			<p class="text-[10px] font-bold text-emerald-700 tracking-widest uppercase mb-1">작품 수</p>
			<p class="text-xl md:text-2xl font-extrabold text-emerald-900">{stats.count}</p>
		</div>
		<div class="bg-white rounded-2xl p-5 border border-blue-200">
			<p class="text-[10px] font-bold text-blue-700 tracking-widest uppercase mb-1">평균 수익</p>
			<p class="text-xl md:text-2xl font-extrabold text-blue-900">
				{fmtKRW(Math.round(stats.avgPerWork))}
			</p>
		</div>
	</section>

	<!-- 월별 추이 -->
	{#if stats.byMonth.length > 0}
		<section
			class="bg-white rounded-2xl p-5 border border-slate-100 mb-5"
			style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
		>
			<h3 class="text-sm font-bold mb-4 text-slate-800">📊 월별 수익</h3>
			<div class="flex flex-col gap-2">
				{#each stats.byMonth as [month, rev]}
					{@const pct = (rev / maxMonthRev) * 100}
					<div class="flex items-center gap-2">
						<span class="text-[11px] font-bold text-slate-600 w-14 shrink-0">{month}</span>
						<div class="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
							<div
								class="h-full rounded-full"
								style="width: {pct}%; background: linear-gradient(90deg, #7c3aed, #a855f7)"
							></div>
						</div>
						<span class="text-[11px] font-bold text-slate-700 w-20 text-right shrink-0">
							{fmtKRW(rev)}
						</span>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- 카테고리별 -->
	{#if stats.byCategory.length > 0}
		<section
			class="bg-white rounded-2xl p-5 border border-slate-100 mb-5"
			style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
		>
			<h3 class="text-sm font-bold mb-3 text-slate-800">🏷 카테고리별</h3>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
				{#each stats.byCategory as [cat, rev]}
					<div class="bg-slate-50 rounded-xl p-3">
						<p class="text-[11px] font-bold text-slate-600 mb-1">{cat}</p>
						<p class="text-sm font-extrabold text-slate-900">{fmtKRW(rev)}</p>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- 작품 목록 -->
	<section
		class="bg-white rounded-2xl p-4 border border-slate-100"
		style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
	>
		<h3 class="text-sm font-bold mb-3 text-slate-800">📋 작품 목록</h3>
		{#if yearWorks.length === 0}
			<p class="text-xs text-slate-400 italic py-4 text-center">{year}년 작품 없음</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-xs">
					<thead>
						<tr class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
							<th class="text-left py-2 pr-3">월</th>
							<th class="text-left py-2 pr-3">작품</th>
							<th class="text-left py-2 pr-3">카테고리</th>
							<th class="text-left py-2 pr-3">상태</th>
							<th class="text-right py-2">수익</th>
						</tr>
					</thead>
					<tbody>
						{#each yearWorks.sort((a, b) => (a.month || '').localeCompare(b.month || '')) as w}
							{@const sc = statusColor(w.status || '')}
							<tr class="border-t border-slate-50">
								<td class="py-2 pr-3 text-slate-500 font-mono">{w.month || '—'}</td>
								<td class="py-2 pr-3 text-slate-800 font-semibold">
									{w.work_details || '—'}
								</td>
								<td class="py-2 pr-3 text-slate-600">{w.category || '—'}</td>
								<td class="py-2 pr-3">
									{#if w.status}
										<span
											class="text-[10px] px-2 py-0.5 rounded font-bold"
											style="background: {sc.bg}; color: {sc.text}"
										>
											{w.status}
										</span>
									{/if}
								</td>
								<td class="py-2 text-right font-extrabold text-slate-900">
									{w.revenue ? fmtKRW(Number(w.revenue)) : '—'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<!-- 안내 -->
	<section class="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
		💡 작품 추가/편집은 다음 단계 마이그레이션. main 사이트에서 입력하면 여기서 확인 가능.
	</section>
{/if}
