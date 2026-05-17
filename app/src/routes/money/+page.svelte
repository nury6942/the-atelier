<script lang="ts">
	import { onMount } from 'svelte';
	import { ledger, type Tx } from '$lib/stores/ledger.svelte';
	import { fmtKRW } from '$lib/utils/format';
	import TransactionModal from '$lib/components/TransactionModal.svelte';

	let txModalOpen = $state(false);
	let editingTx = $state<Tx | null>(null);

	function openAddTx() {
		editingTx = null;
		txModalOpen = true;
	}

	function openEditTx(t: Tx) {
		editingTx = t;
		txModalOpen = true;
	}

	const KO_MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const KO_MONTH_KR = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

	const monthStats = $derived(ledger.getMonthStats());
	const monthTx = $derived(ledger.getMonthTx());

	// 일별 지출 합산 (캘린더용)
	const dailyExpense = $derived.by(() => {
		const map: Record<number, number> = {};
		for (const t of monthTx) {
			if (!ledger.isExpense(t)) continue;
			const day = parseInt(t.date.split('-')[2]);
			map[day] = (map[day] || 0) + (t.금액 || 0);
		}
		return map;
	});

	// 카테고리 별 지출 (Top)
	const categoryStats = $derived.by(() => {
		const map: Record<string, number> = {};
		for (const t of monthTx) {
			if (!ledger.isExpense(t)) continue;
			map[t.대분류] = (map[t.대분류] || 0) + (t.금액 || 0);
		}
		return Object.entries(map)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 6);
	});

	// 결제수단별 지출
	const paymentStats = $derived.by(() => {
		const map: Record<string, number> = {};
		for (const t of monthTx) {
			if (!ledger.isExpense(t)) continue;
			const pm = t.결제수단 || '미분류';
			map[pm] = (map[pm] || 0) + (t.금액 || 0);
		}
		return Object.entries(map).sort((a, b) => b[1] - a[1]);
	});

	// 캘린더 생성
	const calendar = $derived.by(() => {
		const year = ledger.year;
		const month = ledger.month;
		const daysInMonth = new Date(year, month, 0).getDate();
		const firstDay = new Date(year, month - 1, 1).getDay(); // 0=일
		const today = new Date();
		const todayDate =
			year === today.getFullYear() && month === today.getMonth() + 1 ? today.getDate() : -1;

		const cells: Array<{ day: number | null; amount: number; isToday: boolean }> = [];
		for (let i = 0; i < firstDay; i++) cells.push({ day: null, amount: 0, isToday: false });
		for (let d = 1; d <= daysInMonth; d++) {
			cells.push({ day: d, amount: dailyExpense[d] || 0, isToday: d === todayDate });
		}
		// 6주(42칸) 채우기
		while (cells.length < 42) cells.push({ day: null, amount: 0, isToday: false });
		return cells;
	});

	function prevMonth() {
		let y = ledger.year,
			m = ledger.month - 1;
		if (m < 1) {
			m = 12;
			y--;
		}
		ledger.setMonth(y, m);
	}
	function nextMonth() {
		let y = ledger.year,
			m = ledger.month + 1;
		if (m > 12) {
			m = 1;
			y++;
		}
		ledger.setMonth(y, m);
	}

	function fmtShort(amt: number): string {
		if (amt >= 10000) return Math.round(amt / 10000) + '만';
		if (amt >= 1000) return Math.round(amt / 1000) + 'k';
		return '' + amt;
	}

	onMount(() => {
		ledger.load();
	});

	// 최근 트랜잭션 (날짜 내림차순 20개)
	const recentTxs = $derived.by(() => {
		return [...monthTx]
			.sort((a, b) => {
				if (a.date !== b.date) return a.date > b.date ? -1 : 1;
				return 0;
			})
			.slice(0, 30);
	});
</script>

{#if ledger.loading}
	<div class="text-center py-12">
		<p class="text-sm text-slate-400">가계부 불러오는 중...</p>
	</div>
{:else if ledger.error}
	<div class="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-700">
		⚠️ {ledger.error}
	</div>
{:else}
	<!-- ═══ 월별 헤더 ═══ -->
	<div class="flex items-center justify-between mb-5">
		<div>
			<h2 class="text-xl md:text-2xl font-extrabold headline">
				{ledger.year} {KO_MONTH[ledger.month - 1]}
			</h2>
			<p class="text-xs text-slate-500">{monthStats.txCount}개 항목</p>
		</div>
		<div class="flex items-center gap-1">
			<button
				onclick={prevMonth}
				class="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold"
			>
				‹
			</button>
			<span class="px-3 text-xs text-slate-500 min-w-[60px] text-center">
				{KO_MONTH_KR[ledger.month - 1]}
			</span>
			<button
				onclick={nextMonth}
				class="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold"
			>
				›
			</button>
		</div>
	</div>

	<!-- ═══ KPI 카드 4개 ═══ -->
	<section class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
		<div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-emerald-700 tracking-widest uppercase mb-1">수입</p>
			<p class="text-base md:text-lg font-extrabold text-emerald-900">{fmtKRW(monthStats.income)}</p>
		</div>
		<div class="bg-rose-50 border border-rose-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-rose-700 tracking-widest uppercase mb-1">지출</p>
			<p class="text-base md:text-lg font-extrabold text-rose-900">{fmtKRW(monthStats.expense)}</p>
		</div>
		<div class="bg-blue-50 border border-blue-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-blue-700 tracking-widest uppercase mb-1">저축</p>
			<p class="text-base md:text-lg font-extrabold text-blue-900">{fmtKRW(monthStats.saving)}</p>
		</div>
		<div class="bg-violet-50 border border-violet-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-violet-700 tracking-widest uppercase mb-1">순익</p>
			<p
				class="text-base md:text-lg font-extrabold {monthStats.net >= 0
					? 'text-violet-900'
					: 'text-red-700'}"
			>
				{fmtKRW(monthStats.net)}
			</p>
		</div>
	</section>

	<!-- ═══ 캘린더 + 카테고리 ═══ -->
	<section class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
		<!-- 일별 캘린더 -->
		<div
			class="bg-white rounded-2xl p-4 lg:col-span-2 border border-slate-100"
			style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
		>
			<h3 class="text-sm font-bold mb-3 text-slate-800">📅 {ledger.month}월 일별 지출</h3>
			<div class="grid grid-cols-7 gap-1 text-center mb-1">
				{#each ['일', '월', '화', '수', '목', '금', '토'] as d}
					<div class="text-[10px] font-bold text-slate-400 py-1">{d}</div>
				{/each}
			</div>
			<div class="grid grid-cols-7 gap-1">
				{#each calendar as cell}
					<div
						class="aspect-square rounded-md p-1 text-[10px] flex flex-col {cell.day === null
							? 'invisible'
							: cell.isToday
								? 'bg-violet-100 border border-violet-400'
								: cell.amount > 0
									? 'bg-slate-50'
									: 'bg-white border border-slate-50'}"
					>
						{#if cell.day !== null}
							<span class="font-bold {cell.isToday ? 'text-violet-700' : 'text-slate-600'}">
								{cell.day}
							</span>
							{#if cell.amount > 0}
								<span
									class="mt-auto font-bold text-[9px] {cell.isToday
										? 'text-violet-700'
										: 'text-slate-700'}"
								>
									{fmtShort(cell.amount)}
								</span>
							{/if}
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- 카테고리별 Top -->
		<div
			class="bg-white rounded-2xl p-4 border border-slate-100"
			style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
		>
			<h3 class="text-sm font-bold mb-3 text-slate-800">📊 카테고리 Top</h3>
			{#if categoryStats.length === 0}
				<p class="text-xs text-slate-400 italic">지출 내역 없음</p>
			{:else}
				<div class="flex flex-col gap-2">
					{#each categoryStats as [cat, amt]}
						{@const max = categoryStats[0][1]}
						{@const pct = max > 0 ? (amt / max) * 100 : 0}
						<div>
							<div class="flex justify-between items-baseline text-[12px] mb-0.5">
								<span class="font-semibold text-slate-700">{cat}</span>
								<span class="font-bold text-slate-900">{fmtKRW(amt)}</span>
							</div>
							<div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
								<div
									class="h-full rounded-full"
									style="width: {pct}%; background: linear-gradient(90deg, #7c3aed, #a855f7)"
								></div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- ═══ 결제수단별 ═══ -->
	{#if paymentStats.length > 0}
		<section class="mb-5">
			<div
				class="bg-white rounded-2xl p-4 border border-slate-100"
				style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
			>
				<h3 class="text-sm font-bold mb-3 text-slate-800">💳 결제수단별 지출</h3>
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
					{#each paymentStats as [pm, amt]}
						<div class="bg-slate-50 rounded-xl p-3 text-center">
							<p class="text-[11px] font-semibold text-slate-600 mb-1">{pm}</p>
							<p class="text-sm font-extrabold text-slate-900">{fmtKRW(amt)}</p>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- ═══ 트랜잭션 표 ═══ -->
	<section>
		<div
			class="bg-white rounded-2xl p-4 border border-slate-100"
			style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
		>
			<div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
				<div class="flex items-center gap-2">
					<h3 class="text-sm font-bold text-slate-800">📋 거래 내역</h3>
					<span class="text-[11px] text-slate-400">{monthStats.txCount}건 (최근 30개)</span>
				</div>
				<button
					onclick={openAddTx}
					class="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors flex items-center gap-1.5"
				>
					<span class="text-base leading-none">+</span> 거래 추가
				</button>
			</div>

			{#if recentTxs.length === 0}
				<p class="text-xs text-slate-400 italic py-4 text-center">이번 달 거래 없음</p>
			{:else}
				<!-- 모바일: 카드 리스트 (클릭=편집) -->
				<div class="md:hidden flex flex-col gap-2">
					{#each recentTxs as t}
						{@const isIncome = t.대분류 === '수입'}
						<button
							type="button"
							onclick={() => openEditTx(t)}
							class="bg-slate-50 hover:bg-violet-50 transition-colors rounded-xl p-3 text-left"
						>
							<div class="flex justify-between items-start mb-1">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-1.5 mb-0.5">
										<span class="text-[10px] text-slate-400 font-mono">
											{(t.date || '').substring(5).replace('-', '/')}
										</span>
										<span class="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-bold">
											{t.소분류 || t.대분류}
										</span>
									</div>
									<p class="text-xs font-semibold text-slate-700 truncate">
										{t.세부사항 || t.비고 || '—'}
									</p>
								</div>
								<p
									class="text-sm font-extrabold {isIncome
										? 'text-emerald-600'
										: 'text-slate-900'} ml-2 shrink-0"
								>
									{fmtKRW(t.금액 || 0)}
								</p>
							</div>
							{#if t.결제수단}
								<p class="text-[10px] text-slate-400">{t.결제수단}</p>
							{/if}
						</button>
					{/each}
				</div>

				<!-- 데스크탑: 표 (클릭=편집) -->
				<div class="hidden md:block overflow-x-auto">
					<table class="w-full text-xs">
						<thead>
							<tr class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
								<th class="text-left py-2 pr-3">날짜</th>
								<th class="text-left py-2 pr-3">대분류</th>
								<th class="text-left py-2 pr-3">소분류</th>
								<th class="text-right py-2 pr-3">금액</th>
								<th class="text-left py-2 pr-3">결제수단</th>
								<th class="text-left py-2">세부사항</th>
							</tr>
						</thead>
						<tbody>
							{#each recentTxs as t}
								{@const isIncome = t.대분류 === '수입'}
								<tr
									onclick={() => openEditTx(t)}
									class="border-t border-slate-50 hover:bg-violet-50/50 cursor-pointer"
								>
									<td class="py-1.5 pr-3 text-slate-600 font-mono">
										{(t.date || '').substring(5).replace('-', '/')}
									</td>
									<td class="py-1.5 pr-3 font-semibold">{t.대분류}</td>
									<td class="py-1.5 pr-3">
										<span class="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-bold">
											{t.소분류 || ''}
										</span>
									</td>
									<td
										class="py-1.5 pr-3 text-right font-extrabold {isIncome
											? 'text-emerald-600'
											: 'text-slate-900'}"
									>
										{fmtKRW(t.금액 || 0)}
									</td>
									<td class="py-1.5 pr-3 text-slate-500">{t.결제수단 || ''}</td>
									<td class="py-1.5 text-slate-600 truncate max-w-[200px]">
										{t.세부사항 || ''}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</section>

	<!-- 진행 안내 -->
	<section class="mt-6">
		<div
			class="bg-white rounded-2xl p-5 border border-slate-100"
			style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
		>
			<div class="flex items-center gap-2 mb-2">
				<span>🚧</span>
				<h3 class="font-bold text-sm">Week 3 진행 상황</h3>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
				<div class="flex items-center gap-2 text-slate-600">
					<span class="text-emerald-500">✅</span>
					<span>월별 KPI (수입/지출/저축/순익)</span>
				</div>
				<div class="flex items-center gap-2 text-slate-600">
					<span class="text-emerald-500">✅</span>
					<span>일별 캘린더 (지출 표시)</span>
				</div>
				<div class="flex items-center gap-2 text-slate-600">
					<span class="text-emerald-500">✅</span>
					<span>카테고리 Top (모바일 친화 막대 그래프)</span>
				</div>
				<div class="flex items-center gap-2 text-slate-600">
					<span class="text-emerald-500">✅</span>
					<span>결제수단별 지출</span>
				</div>
				<div class="flex items-center gap-2 text-slate-600">
					<span class="text-emerald-500">✅</span>
					<span>거래 내역 (모바일: 카드, 데스크탑: 표)</span>
				</div>
				<div class="flex items-center gap-2 text-slate-600">
					<span class="text-emerald-500">✅</span>
					<span>트랜잭션 추가/편집/삭제</span>
				</div>
				<div class="flex items-center gap-2 text-slate-400">
					<span>⏳</span>
					<span>연간 뷰 (12개월 한눈에)</span>
				</div>
				<div class="flex items-center gap-2 text-slate-400">
					<span>⏳</span>
					<span>자산 탭</span>
				</div>
				<div class="flex items-center gap-2 text-slate-400">
					<span>⏳</span>
					<span>부업 탭</span>
				</div>
			</div>
		</div>
	</section>
{/if}

<!-- 트랜잭션 입력/편집 모달 -->
<TransactionModal bind:open={txModalOpen} tx={editingTx} />
