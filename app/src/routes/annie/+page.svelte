<script lang="ts">
	import { onMount } from 'svelte';
	import { fbReadCollection } from '$lib/firestore';
	import { todayKey } from '$lib/utils/greeting';

	type MatrixRow = {
		id: string;
		date: string;
		day?: string;
		work?: string;
		leave?: string;
		personal?: string;
		writing?: string;
		serial1?: string;
		english?: string;
		ai_study?: string;
		workingout?: string;
	};

	let data = $state<MatrixRow[]>([]);
	let loading = $state(true);
	let error = $state('');

	let year = $state(new Date().getFullYear());

	onMount(async () => {
		try {
			data = await fbReadCollection<MatrixRow>('matrix');
		} catch (e: any) {
			error = e?.message || '로드 실패';
		} finally {
			loading = false;
		}
	});

	const yearData = $derived(data.filter((d) => (d.date || '').startsWith(String(year))));

	const fields = [
		{ key: 'work', label: '업무', icon: '💼', color: '#fce7f3', text: '#9d174d' },
		{ key: 'leave', label: '연차', icon: '🌴', color: '#ffedd5', text: '#c2410c' },
		{ key: 'personal', label: '개인', icon: '🏠', color: '#fef3c7', text: '#92400e' },
		{ key: 'writing', label: '글쓰기', icon: '✍️', color: '#e0f2fe', text: '#0369a1' },
		{ key: 'serial1', label: '연재', icon: '📖', color: '#dbeafe', text: '#1d4ed8' },
		{ key: 'english', label: '영어', icon: '🇬🇧', color: '#d9f99d', text: '#3f6212' },
		{ key: 'ai_study', label: '스터디', icon: '🧠', color: '#ede9fe', text: '#6d28d9' },
		{ key: 'workingout', label: '운동', icon: '🏃', color: '#bbf7d0', text: '#15803d' }
	] as const;

	const stats = $derived.by(() => {
		const counts: Record<string, number> = {};
		fields.forEach((f) => (counts[f.key] = 0));
		yearData.forEach((d) => {
			fields.forEach((f) => {
				const v = (d as any)[f.key];
				if (v && String(v).trim()) counts[f.key]++;
			});
		});
		return counts;
	});

	// 월별 통계
	const monthlyCounts = $derived.by(() => {
		const result: Record<string, Record<string, number>> = {};
		for (let m = 1; m <= 12; m++) {
			const monthKey = `${year}-${String(m).padStart(2, '0')}`;
			result[monthKey] = {};
			fields.forEach((f) => (result[monthKey][f.key] = 0));
			yearData
				.filter((d) => d.date.startsWith(monthKey))
				.forEach((d) => {
					fields.forEach((f) => {
						const v = (d as any)[f.key];
						if (v && String(v).trim()) result[monthKey][f.key]++;
					});
				});
		}
		return result;
	});

	const totalDays = $derived(yearData.filter((d) => fields.some((f) => (d as any)[f.key])).length);

	function changeYear(delta: number) {
		year += delta;
	}

	const MONTHS_KR = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
</script>

<div class="p-4 md:p-8 max-w-[1280px] mx-auto">
	<h1 class="text-2xl md:text-3xl font-extrabold headline mb-5">Annie</h1>

	{#if loading}
		<div class="text-center py-12">
			<p class="text-sm text-slate-400">매트릭스 불러오는 중...</p>
		</div>
	{:else if error}
		<div class="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-700">
			⚠️ {error}
		</div>
	{:else}
		<!-- 연도 헤더 -->
		<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
			<div>
				<h2 class="text-xl md:text-2xl font-extrabold headline">{year}년 활동 매트릭스</h2>
				<p class="text-xs text-slate-500">{totalDays}일 기록 / {yearData.length}개 항목</p>
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

		<!-- 카테고리별 연간 KPI -->
		<section class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
			{#each fields as f}
				<div
					class="rounded-2xl p-4 border"
					style="background: {f.color}; border-color: {f.text}33"
				>
					<div class="flex items-center justify-between mb-1">
						<span class="text-sm">{f.icon}</span>
						<span class="text-[10px] font-bold tracking-widest uppercase" style="color: {f.text}">
							{f.label}
						</span>
					</div>
					<p class="text-2xl font-extrabold" style="color: {f.text}">
						{stats[f.key]}
						<span class="text-xs font-bold opacity-70">일</span>
					</p>
				</div>
			{/each}
		</section>

		<!-- 월별 히트맵 -->
		<section
			class="bg-white rounded-2xl p-5 border border-slate-100 mb-5"
			style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
		>
			<h3 class="text-sm font-bold mb-4 text-slate-800">📊 월별 활동 (카테고리별)</h3>
			<div class="overflow-x-auto">
				<table class="w-full text-xs min-w-[600px]">
					<thead>
						<tr class="text-[10px] font-bold text-slate-400 uppercase">
							<th class="text-left py-2 pr-2 sticky left-0 bg-white">월</th>
							{#each fields as f}
								<th class="text-center px-1 py-2" style="color: {f.text}">
									{f.icon}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each Array(12) as _, i}
							{@const m = i + 1}
							{@const monthKey = `${year}-${String(m).padStart(2, '0')}`}
							{@const counts = monthlyCounts[monthKey]}
							<tr class="border-t border-slate-50">
								<td class="py-2 pr-2 font-bold text-slate-700 sticky left-0 bg-white">
									{MONTHS_KR[i]}
								</td>
								{#each fields as f}
									{@const count = counts[f.key]}
									<td class="text-center px-1 py-1">
										{#if count > 0}
											<div
												class="inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-[11px]"
												style="background: {f.color}; color: {f.text}"
											>
												{count}
											</div>
										{:else}
											<span class="text-slate-200">·</span>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		<!-- 최근 항목 -->
		<section
			class="bg-white rounded-2xl p-4 border border-slate-100"
			style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
		>
			<h3 class="text-sm font-bold mb-3 text-slate-800">📋 최근 활동 (최근 10일)</h3>
			{#if yearData.length === 0}
				<p class="text-xs text-slate-400 italic py-4 text-center">{year}년 기록 없음</p>
			{:else}
				{@const recentDays = yearData
					.filter((d) => fields.some((f) => (d as any)[f.key]))
					.sort((a, b) => b.date.localeCompare(a.date))
					.slice(0, 10)}
				<div class="flex flex-col gap-2">
					{#each recentDays as row}
						<div class="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
							<div class="text-[11px] font-bold text-slate-600 w-20 shrink-0 font-mono">
								{row.date}
							</div>
							<div class="flex-1 flex flex-wrap gap-1.5">
								{#each fields as f}
									{@const val = (row as any)[f.key]}
									{#if val && String(val).trim()}
										<span
											class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
											style="background: {f.color}; color: {f.text}"
											title={String(val)}
										>
											{f.icon} {f.label}
										</span>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</div>
