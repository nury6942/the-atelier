<script lang="ts">
	import { onMount } from 'svelte';
	import { ledger } from '$lib/stores/ledger.svelte';
	import { fmtKRW } from '$lib/utils/format';

	type AssetItem = {
		이름?: string;
		월별?: (number | null)[];
		auto?: string;
	};
	type AssetData = {
		비유동자산?: AssetItem[];
		투자자산?: AssetItem[];
		현금자산?: AssetItem[];
		부채?: AssetItem[];
	};

	const assets = $derived((ledger.data.assets || {}) as AssetData);

	// 최신 월 찾기 (데이터 있는 가장 최근 월 인덱스 0~11)
	const latestMonth = $derived.by(() => {
		let latest = 0;
		(['비유동자산', '투자자산', '현금자산', '부채'] as const).forEach((g) => {
			(assets[g] || []).forEach((item) => {
				const arr = item.월별 || [];
				for (let m = 11; m >= 0; m--) {
					if (arr[m] !== null && arr[m] !== undefined) {
						if (m > latest) latest = m;
						break;
					}
				}
			});
		});
		return latest;
	});

	function sumGroup(g: keyof AssetData, m: number): number {
		let sum = 0;
		(assets[g] || []).forEach((item) => {
			const v = item.월별?.[m];
			if (typeof v === 'number') sum += v;
		});
		return sum;
	}

	const stats = $derived.by(() => {
		const m = latestMonth;
		const fixed = sumGroup('비유동자산', m);
		const invest = sumGroup('투자자산', m);
		const cash = sumGroup('현금자산', m);
		const debt = sumGroup('부채', m);
		const total = fixed + invest + cash;
		const net = total - debt;

		// 전월 대비
		const pm = m > 0 ? m - 1 : null;
		let prevNet: number | null = null;
		if (pm !== null) {
			const pFixed = sumGroup('비유동자산', pm);
			const pInvest = sumGroup('투자자산', pm);
			const pCash = sumGroup('현금자산', pm);
			const pDebt = sumGroup('부채', pm);
			prevNet = pFixed + pInvest + pCash - pDebt;
		}
		const diff = prevNet !== null ? net - prevNet : null;

		return { fixed, invest, cash, debt, total, net, diff };
	});

	const KO_MONTH_KR = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

	onMount(() => {
		ledger.load();
	});
</script>

{#if ledger.loading}
	<div class="text-center py-12">
		<p class="text-sm text-slate-400">불러오는 중...</p>
	</div>
{:else if !ledger.data.assets}
	<div class="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
		<p class="text-sm text-amber-700">아직 자산 데이터가 없어요</p>
		<p class="text-xs text-amber-600 mt-1">기존 main 사이트에서 자산을 입력하면 여기 표시됩니다</p>
	</div>
{:else}
	<!-- 순자산 헤더 -->
	<section
		class="bg-white rounded-2xl p-6 mb-5 border border-violet-200"
		style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); box-shadow: 0 4px 20px rgba(124, 58, 237, 0.08)"
	>
		<p class="text-[10px] font-bold text-violet-700 tracking-widest uppercase mb-1">
			{KO_MONTH_KR[latestMonth]} 기준 순자산
		</p>
		<p class="text-3xl md:text-4xl font-extrabold text-violet-950 mb-1">{fmtKRW(stats.net)}</p>
		{#if stats.diff !== null}
			{@const isUp = stats.diff >= 0}
			<p class="text-xs font-bold {isUp ? 'text-emerald-600' : 'text-red-500'}">
				{isUp ? '▲' : '▼'}
				{isUp ? '+' : ''}{fmtKRW(Math.abs(stats.diff))} (전월 대비)
			</p>
		{/if}
	</section>

	<!-- 4가지 카테고리 KPI -->
	<section class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
		<div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-emerald-700 tracking-widest uppercase mb-1">현금자산</p>
			<p class="text-base md:text-lg font-extrabold text-emerald-900">{fmtKRW(stats.cash)}</p>
		</div>
		<div class="bg-blue-50 border border-blue-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-blue-700 tracking-widest uppercase mb-1">투자자산</p>
			<p class="text-base md:text-lg font-extrabold text-blue-900">{fmtKRW(stats.invest)}</p>
		</div>
		<div class="bg-amber-50 border border-amber-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-amber-700 tracking-widest uppercase mb-1">비유동자산</p>
			<p class="text-base md:text-lg font-extrabold text-amber-900">{fmtKRW(stats.fixed)}</p>
		</div>
		<div class="bg-rose-50 border border-rose-200 rounded-2xl p-4">
			<p class="text-[10px] font-bold text-rose-700 tracking-widest uppercase mb-1">부채</p>
			<p class="text-base md:text-lg font-extrabold text-rose-900">{fmtKRW(stats.debt)}</p>
		</div>
	</section>

	<!-- 카테고리별 상세 -->
	{#each (['현금자산', '투자자산', '비유동자산', '부채'] as const) as group}
		{@const items = assets[group] || []}
		{@const groupSum = sumGroup(group, latestMonth)}
		{#if items.length > 0}
			<section
				class="bg-white rounded-2xl p-4 border border-slate-100 mb-4"
				style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
			>
				<div class="flex justify-between items-center mb-3">
					<h3 class="text-sm font-bold text-slate-800">{group}</h3>
					<span class="text-xs font-bold text-slate-700">{fmtKRW(groupSum)}</span>
				</div>
				<div class="flex flex-col gap-1.5">
					{#each items as item}
						{@const val = item.월별?.[latestMonth]}
						<div
							class="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0"
						>
							<span class="text-xs text-slate-700">{item.이름 || '—'}</span>
							<span class="text-xs font-bold text-slate-900">
								{typeof val === 'number' ? fmtKRW(val) : '—'}
							</span>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	{/each}

	<!-- 안내 -->
	<section class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
		💡 자산 편집은 아직 마이그레이션 안 됐어. main 사이트에서 자산 입력하면 여기서 확인 가능.
	</section>
{/if}
