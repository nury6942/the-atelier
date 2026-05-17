<script lang="ts">
	import { onMount } from 'svelte';
	import { fbReadCollection } from '$lib/firestore';
	import { fmtKRW } from '$lib/utils/format';
	import { todayKey } from '$lib/utils/greeting';

	type Trip = {
		id: string;
		name: string;
		start_date?: string;
		end_date?: string;
	};

	type Journey = {
		id: string;
		trip_id?: string;
		type?: string; // 항공편, 숙소, 이동수단, 렌트카, 티켓, etc.
		target_name?: string;
		description?: string;
		amount?: number | string;
		status?: string;
		time?: string;
	};

	let trips = $state<Trip[]>([]);
	let journey = $state<Journey[]>([]);
	let loading = $state(true);
	let error = $state('');
	let selectedTripId = $state<string>('');

	onMount(load);

	async function load() {
		loading = true;
		error = '';
		try {
			const [t, j] = await Promise.all([
				fbReadCollection<Trip>('trips'),
				fbReadCollection<Journey>('journey')
			]);
			trips = t;
			journey = j;
			// 기본 선택: 진행중 → 가까운 미래 → 가장 최근 과거
			const today = todayKey();
			const sorted = [...trips].sort((a, b) => {
				const aActive = !!(
					a.start_date &&
					a.end_date &&
					a.start_date <= today &&
					a.end_date >= today
				);
				const bActive = !!(
					b.start_date &&
					b.end_date &&
					b.start_date <= today &&
					b.end_date >= today
				);
				if (aActive && !bActive) return -1;
				if (!aActive && bActive) return 1;
				const aFuture = !!(a.start_date && a.start_date > today);
				const bFuture = !!(b.start_date && b.start_date > today);
				if (aFuture && bFuture)
					return (a.start_date || '').localeCompare(b.start_date || '');
				if (aFuture && !bFuture) return -1;
				if (!aFuture && bFuture) return 1;
				return (b.end_date || b.start_date || '').localeCompare(
					a.end_date || a.start_date || ''
				);
			});
			if (sorted[0]) selectedTripId = sorted[0].id;
		} catch (e: any) {
			error = e?.message || '로드 실패';
		} finally {
			loading = false;
		}
	}

	const sortedTrips = $derived.by(() => {
		const today = todayKey();
		return [...trips].sort((a, b) => {
			const aActive = !!(
				a.start_date &&
				a.end_date &&
				a.start_date <= today &&
				a.end_date >= today
			);
			const bActive = !!(
				b.start_date &&
				b.end_date &&
				b.start_date <= today &&
				b.end_date >= today
			);
			if (aActive && !bActive) return -1;
			if (!aActive && bActive) return 1;
			const aFuture = !!(a.start_date && a.start_date > today);
			const bFuture = !!(b.start_date && b.start_date > today);
			if (aFuture && bFuture) return (a.start_date || '').localeCompare(b.start_date || '');
			if (aFuture && !bFuture) return -1;
			if (!aFuture && bFuture) return 1;
			return (b.end_date || b.start_date || '').localeCompare(
				a.end_date || a.start_date || ''
			);
		});
	});

	const selectedTrip = $derived(trips.find((t) => t.id === selectedTripId));

	const tripJourney = $derived(journey.filter((j) => j.trip_id === selectedTripId));

	const tripExpense = $derived.by(() => {
		const byType: Record<string, number> = {};
		let total = 0;
		tripJourney.forEach((j) => {
			const amt = Number(j.amount) || 0;
			if (!amt) return;
			const t = j.type || '기타';
			byType[t] = (byType[t] || 0) + amt;
			total += amt;
		});
		return { byType: Object.entries(byType).sort((a, b) => b[1] - a[1]), total };
	});

	function tripStatus(t: Trip): 'past' | 'active' | 'upcoming' | 'unknown' {
		const today = todayKey();
		if (!t.start_date) return 'unknown';
		if (t.end_date && t.start_date <= today && t.end_date >= today) return 'active';
		if (t.start_date > today) return 'upcoming';
		return 'past';
	}

	function tripDays(t: Trip): number {
		if (!t.start_date || !t.end_date) return 0;
		const ms = new Date(t.end_date).getTime() - new Date(t.start_date).getTime();
		return Math.round(ms / 86400000);
	}

	function tripDday(t: Trip): string {
		if (!t.start_date) return '';
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const start = new Date(t.start_date);
		const diff = Math.ceil((start.getTime() - today.getTime()) / 86400000);
		if (diff < 0) {
			if (t.end_date) {
				const end = new Date(t.end_date);
				if (today <= end) return '진행 중';
				return '종료';
			}
			return '종료';
		}
		if (diff === 0) return 'D-DAY';
		return `D-${diff}`;
	}

	function typeIcon(type: string): string {
		const t = type;
		if (t.includes('항공')) return '✈️';
		if (t.includes('숙소')) return '🏨';
		if (t.includes('환전')) return '💱';
		if (t.includes('렌트')) return '🚗';
		if (t.includes('이동') || t.includes('교통')) return '🚆';
		if (t.includes('티켓') || t.includes('입장')) return '🎫';
		if (t.includes('통신')) return '📱';
		if (t.includes('보험')) return '🛡️';
		if (t.includes('식사') || t.includes('음식')) return '🍽️';
		return '📌';
	}

	const maxExpense = $derived(Math.max(...tripExpense.byType.map((e) => e[1]), 1));
</script>

<div class="p-4 md:p-8 max-w-[1280px] mx-auto">
	<h1 class="text-2xl md:text-3xl font-extrabold headline mb-5">Travel</h1>

	{#if loading}
		<div class="text-center py-12">
			<p class="text-sm text-slate-400">여행 데이터 불러오는 중...</p>
		</div>
	{:else if error}
		<div class="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-700">
			⚠️ {error}
		</div>
	{:else if trips.length === 0}
		<div class="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
			<p class="text-sm text-amber-700">등록된 여행이 없어요</p>
			<p class="text-xs text-amber-600 mt-1">main 사이트에서 여행을 추가하면 여기 표시됩니다</p>
		</div>
	{:else}
		<!-- 여행 선택 (가로 스크롤 칩) -->
		<div class="mb-5 overflow-x-auto -mx-4 px-4 pb-2">
			<div class="flex gap-2 min-w-min">
				{#each sortedTrips as t}
					{@const isSelected = t.id === selectedTripId}
					{@const status = tripStatus(t)}
					{@const dday = tripDday(t)}
					<button
						onclick={() => (selectedTripId = t.id)}
						class="shrink-0 px-4 py-2.5 rounded-2xl border-2 transition-all
							{isSelected
							? 'bg-violet-600 text-white border-violet-600 shadow-md'
							: 'bg-white border-slate-200 text-slate-700 hover:border-violet-300'}"
					>
						<div class="flex flex-col items-start">
							<span class="text-[10px] font-bold opacity-75 mb-0.5">
								{status === 'active'
									? '진행 중'
									: status === 'upcoming'
										? '예정'
										: status === 'past'
											? '과거'
											: ''}
							</span>
							<span class="text-sm font-bold">{t.name}</span>
							{#if t.start_date && t.end_date}
								<span class="text-[10px] opacity-75 mt-0.5">
									{t.start_date.substring(5).replace('-', '/')} ~ {t.end_date
										.substring(5)
										.replace('-', '/')}
									{#if dday}
										· {dday}
									{/if}
								</span>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>

		{#if selectedTrip}
			{@const status = tripStatus(selectedTrip)}
			{@const days = tripDays(selectedTrip)}
			{@const dday = tripDday(selectedTrip)}

			<!-- 여행 헤더 -->
			<section
				class="bg-white rounded-2xl p-6 mb-5 border border-violet-200"
				style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); box-shadow: 0 4px 20px rgba(124, 58, 237, 0.08)"
			>
				<div class="flex items-start justify-between gap-3 flex-wrap mb-3">
					<div>
						<p class="text-[10px] font-bold text-violet-700 tracking-widest uppercase mb-1">
							{status === 'active'
								? '진행 중인 여행'
								: status === 'upcoming'
									? '예정된 여행'
									: '과거 여행'}
						</p>
						<h2 class="text-2xl md:text-3xl font-extrabold text-violet-950 headline">
							{selectedTrip.name}
						</h2>
					</div>
					{#if dday}
						<span
							class="text-xs font-bold px-3 py-1 rounded-full bg-violet-200 text-violet-800"
						>
							{dday}
						</span>
					{/if}
				</div>
				{#if selectedTrip.start_date && selectedTrip.end_date}
					<p class="text-sm text-violet-700 font-semibold">
						{selectedTrip.start_date} ~ {selectedTrip.end_date}
						{#if days > 0}
							<span class="text-violet-600 ml-2">· {days}박 {days + 1}일</span>
						{/if}
					</p>
				{/if}
			</section>

			<!-- 지출 KPI -->
			<section class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
				<div class="bg-white rounded-2xl p-5 border border-rose-200">
					<p class="text-[10px] font-bold text-rose-700 tracking-widest uppercase mb-1">
						총 지출
					</p>
					<p class="text-xl md:text-2xl font-extrabold text-rose-900">
						{fmtKRW(tripExpense.total)}
					</p>
				</div>
				<div class="bg-white rounded-2xl p-5 border border-slate-200">
					<p class="text-[10px] font-bold text-slate-600 tracking-widest uppercase mb-1">
						항목 수
					</p>
					<p class="text-xl md:text-2xl font-extrabold text-slate-900">
						{tripJourney.length}
					</p>
				</div>
				{#if days > 0 && tripExpense.total > 0}
					<div class="bg-white rounded-2xl p-5 border border-blue-200 col-span-2 md:col-span-1">
						<p class="text-[10px] font-bold text-blue-700 tracking-widest uppercase mb-1">
							일평균
						</p>
						<p class="text-xl md:text-2xl font-extrabold text-blue-900">
							{fmtKRW(Math.round(tripExpense.total / (days + 1)))}
						</p>
					</div>
				{/if}
			</section>

			<!-- 카테고리별 지출 -->
			{#if tripExpense.byType.length > 0}
				<section
					class="bg-white rounded-2xl p-5 border border-slate-100 mb-5"
					style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
				>
					<h3 class="text-sm font-bold mb-4 text-slate-800">📊 카테고리별 지출</h3>
					<div class="flex flex-col gap-2.5">
						{#each tripExpense.byType as [type, amt]}
							{@const pct = (amt / maxExpense) * 100}
							<div>
								<div class="flex items-center justify-between text-[12px] mb-1">
									<span class="font-bold text-slate-700">
										{typeIcon(type)} {type}
									</span>
									<span class="font-bold text-slate-900">{fmtKRW(amt)}</span>
								</div>
								<div class="h-2 bg-slate-100 rounded-full overflow-hidden">
									<div
										class="h-full rounded-full"
										style="width: {pct}%; background: linear-gradient(90deg, #7c3aed, #a855f7)"
									></div>
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- 일정 항목 목록 -->
			<section
				class="bg-white rounded-2xl p-4 border border-slate-100"
				style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
			>
				<h3 class="text-sm font-bold mb-3 text-slate-800">📋 여행 항목</h3>
				{#if tripJourney.length === 0}
					<p class="text-xs text-slate-400 italic py-4 text-center">등록된 항목 없음</p>
				{:else}
					<div class="flex flex-col gap-2">
						{#each tripJourney.sort((a, b) => (a.time || '').localeCompare(b.time || '')) as j}
							<div class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
								<div class="text-xl shrink-0">{typeIcon(j.type || '')}</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-0.5 flex-wrap">
										<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">
											{j.type || '미분류'}
										</span>
										{#if j.time}
											<span class="text-[10px] text-slate-500 font-mono">{j.time}</span>
										{/if}
										{#if j.status}
											<span class="text-[10px] text-slate-500">· {j.status}</span>
										{/if}
									</div>
									<p class="text-sm font-bold text-slate-800 truncate">
										{j.target_name || '—'}
									</p>
									{#if j.description}
										<p class="text-xs text-slate-500 truncate">{j.description}</p>
									{/if}
								</div>
								{#if j.amount}
									<p class="text-sm font-extrabold text-slate-900 shrink-0">
										{fmtKRW(Number(j.amount))}
									</p>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- 안내 -->
			<section class="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
				💡 여행 항목 추가/편집은 다음 단계. main 사이트에서 입력하면 여기서 확인 가능.
			</section>
		{/if}
	{/if}
</div>
