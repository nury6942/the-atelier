<script lang="ts">
	import { onMount } from 'svelte';
	import { ledger, type Tx } from '$lib/stores/ledger.svelte';
	import { fmtKRW } from '$lib/utils/format';
	import { base } from '$app/paths';

	let year = $state(new Date().getFullYear());

	function changeYear(delta: number) {
		year += delta;
	}

	type MonthStats = { income: number; expense: number; saving: number; net: number; txCount: number };

	const monthlyStats = $derived.by(() => {
		const stats: MonthStats[] = [];
		const txs = ledger.data.transactions || [];
		for (let m = 1; m <= 12; m++) {
			const key = `${year}-${String(m).padStart(2, '0')}`;
			const monthTxs = txs.filter((t) => t.date && t.date.substring(0, 7) === key);
			let income = 0,
				expense = 0,
				saving = 0;
			for (const t of monthTxs) {
				const amt = t.금액 || 0;
				if (t.대분류 === '수입') income += amt;
				else if (t.대분류 === '저축') saving += amt;
				else expense += amt;
			}
			stats.push({
				income,
				expense,
				saving,
				net: income - expense - saving,
				txCount: monthTxs.length
			});
		}
		return stats;
	});

	const yearTotal = $derived.by(() => {
		const sum: MonthStats = { income: 0, expense: 0, saving: 0, net: 0, txCount: 0 };
		monthlyStats.forEach((m) => {
			sum.income += m.income;
			sum.expense += m.expense;
			sum.saving += m.saving;
			sum.net += m.net;
			sum.txCount += m.txCount;
		});
		return sum;
	});

	const maxExpense = $derived(
		Math.max(...monthlyStats.map((m) => m.expense), 1)
	);
	const maxIncome = $derived(
		Math.max(...monthlyStats.map((m) => m.income), 1)
	);

	const KO_MONTH_KR = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
	const today = new Date();
	const currentYearMonth = today.getMonth() + 1;
	const currentYear = today.getFullYear();

	onMount(() => {
		ledger.load();
	});

	function fmtMan(n: number): string {
		const man = Math.round(n / 10000);
		return man.toLocaleString() + '만';
	}
</script>

{#if ledger.loading}
	<div class="text-center py-12">
		<p class="text-sm text-slate-400">불러오는 중...</p>
	</div>
{:else}
	<!-- 서브 토글 -->
	<div class="flex items-center justify-between mb-4 flex-wrap gap-3">
		<div class="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
			<a
				href={base + '/money'}
				class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700"
			>
				월별 뷰
			</a>
			<button class="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-violet-700 shadow-sm">
				연간 뷰
			</button>
		</div>
	</div>

	<!-- 연도 헤더 -->
	<div class="flex items-center justify-between mb-5">
		<div>
			<h2 class="text-xl md:text-2xl font-extrabold headline">{year}년 연간 통계</h2>
			<p class="text-xs text-slate-500">{yearTotal.txCount}개 항목</p>
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

	<!-- 연간 합계 KPI -->
	<section class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
		<div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-emerald-700 tracking-widest uppercase mb-1">
				연간 수입
			</p>
			<p class="text-base md:text-xl font-extrabold text-emerald-900">{fmtKRW(yearTotal.income)}</p>
		</div>
		<div class="bg-rose-50 border border-rose-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-rose-700 tracking-widest uppercase mb-1">연간 지출</p>
			<p class="text-base md:text-xl font-extrabold text-rose-900">{fmtKRW(yearTotal.expense)}</p>
		</div>
		<div class="bg-blue-50 border border-blue-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-blue-700 tracking-widest uppercase mb-1">연간 저축</p>
			<p class="text-base md:text-xl font-extrabold text-blue-900">{fmtKRW(yearTotal.saving)}</p>
		</div>
		<div class="bg-violet-50 border border-violet-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-violet-700 tracking-widest uppercase mb-1">연간 순익</p>
			<p
				class="text-base md:text-xl font-extrabold {yearTotal.net >= 0
					? 'text-violet-900'
					: 'text-red-700'}"
			>
				{fmtKRW(yearTotal.net)}
			</p>
		</div>
	</section>

	<!-- 월별 막대 그래프 (CSS) -->
	<section
		class="bg-white rounded-2xl p-5 border border-slate-100 mb-5"
		style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
	>
		<h3 class="text-sm font-bold mb-4 text-slate-800">📊 월별 추이</h3>
		<div class="flex flex-col gap-3">
			{#each monthlyStats as ms, i}
				{@const m = i + 1}
				{@const isCurrent = year === currentYear && m === currentYearMonth}
				{@const incomePct = (ms.income / maxIncome) * 100}
				{@const expensePct = (ms.expense / maxExpense) * 100}
				<div class="flex items-center gap-2 md:gap-3">
					<span
						class="text-[11px] font-bold w-8 shrink-0 {isCurrent
							? 'text-violet-700'
							: 'text-slate-500'}"
					>
						{KO_MONTH_KR[i]}
					</span>
					<div class="flex-1 flex flex-col gap-1">
						<!-- 수입 -->
						<div class="flex items-center gap-2">
							<div class="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
								<div
									class="h-full rounded-full bg-emerald-500"
									style="width: {incomePct}%"
								></div>
							</div>
							<span class="text-[10px] font-bold text-emerald-700 w-16 text-right shrink-0">
								{ms.income ? fmtMan(ms.income) : '—'}
							</span>
						</div>
						<!-- 지출 -->
						<div class="flex items-center gap-2">
							<div class="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
								<div
									class="h-full rounded-full bg-rose-500"
									style="width: {expensePct}%"
								></div>
							</div>
							<span class="text-[10px] font-bold text-rose-700 w-16 text-right shrink-0">
								{ms.expense ? fmtMan(ms.expense) : '—'}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
		<div class="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-[11px]">
			<div class="flex items-center gap-1.5">
				<span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
				<span class="text-slate-600">수입</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
				<span class="text-slate-600">지출</span>
			</div>
		</div>
	</section>

	<!-- 월별 표 -->
	<section
		class="bg-white rounded-2xl p-4 border border-slate-100"
		style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
	>
		<h3 class="text-sm font-bold mb-3 text-slate-800">📅 월별 상세</h3>
		<div class="overflow-x-auto">
			<table class="w-full text-xs">
				<thead>
					<tr class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
						<th class="text-left py-2 pr-3">월</th>
						<th class="text-right py-2 pr-3">수입</th>
						<th class="text-right py-2 pr-3">지출</th>
						<th class="text-right py-2 pr-3">저축</th>
						<th class="text-right py-2 pr-3">순익</th>
						<th class="text-right py-2">건수</th>
					</tr>
				</thead>
				<tbody>
					{#each monthlyStats as ms, i}
						{@const m = i + 1}
						{@const isCurrent = year === currentYear && m === currentYearMonth}
						<tr
							class="border-t border-slate-50 {isCurrent ? 'bg-violet-50/50' : ''}"
						>
							<td class="py-2 pr-3 font-bold {isCurrent ? 'text-violet-700' : 'text-slate-700'}">
								{m}월
							</td>
							<td class="py-2 pr-3 text-right text-emerald-700">
								{ms.income ? fmtKRW(ms.income) : '—'}
							</td>
							<td class="py-2 pr-3 text-right text-rose-700">
								{ms.expense ? fmtKRW(ms.expense) : '—'}
							</td>
							<td class="py-2 pr-3 text-right text-blue-700">
								{ms.saving ? fmtKRW(ms.saving) : '—'}
							</td>
							<td
								class="py-2 pr-3 text-right font-bold {ms.net >= 0
									? 'text-slate-900'
									: 'text-red-700'}"
							>
								{ms.txCount ? fmtKRW(ms.net) : '—'}
							</td>
							<td class="py-2 text-right text-slate-500">{ms.txCount || '—'}</td>
						</tr>
					{/each}
					<!-- 합계 -->
					<tr class="border-t-2 border-slate-200 bg-slate-50 font-bold">
						<td class="py-2.5 pr-3 text-slate-900">합계</td>
						<td class="py-2.5 pr-3 text-right text-emerald-700">{fmtKRW(yearTotal.income)}</td>
						<td class="py-2.5 pr-3 text-right text-rose-700">{fmtKRW(yearTotal.expense)}</td>
						<td class="py-2.5 pr-3 text-right text-blue-700">{fmtKRW(yearTotal.saving)}</td>
						<td
							class="py-2.5 pr-3 text-right {yearTotal.net >= 0
								? 'text-slate-900'
								: 'text-red-700'}"
						>
							{fmtKRW(yearTotal.net)}
						</td>
						<td class="py-2.5 text-right text-slate-500">{yearTotal.txCount}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
{/if}
