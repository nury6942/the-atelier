<script lang="ts">
	import { onMount } from 'svelte';
	import { fbReadCollection } from '$lib/firestore';
	import { todayKey } from '$lib/utils/greeting';

	type Event = {
		id: string;
		date: string;
		title?: string;
		category?: string;
		color?: string;
		date_end?: string;
		notes?: string;
	};

	let events = $state<Event[]>([]);
	let loading = $state(true);
	let error = $state('');

	const today = new Date();
	let year = $state(today.getFullYear());
	let month = $state(today.getMonth() + 1); // 1-12

	let selectedDate = $state<string | null>(null);

	onMount(async () => {
		try {
			events = await fbReadCollection<Event>('planner');
		} catch (e: any) {
			error = e?.message || '로드 실패';
		} finally {
			loading = false;
		}
	});

	const KO_MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const KO_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

	const todayStr = todayKey();

	function prevMonth() {
		month--;
		if (month < 1) {
			month = 12;
			year--;
		}
		selectedDate = null;
	}
	function nextMonth() {
		month++;
		if (month > 12) {
			month = 1;
			year++;
		}
		selectedDate = null;
	}
	function gotoToday() {
		year = today.getFullYear();
		month = today.getMonth() + 1;
		selectedDate = todayStr;
	}

	// 캘린더 셀
	const calendar = $derived.by(() => {
		const daysInMonth = new Date(year, month, 0).getDate();
		const firstDay = new Date(year, month - 1, 1).getDay(); // 0=일
		const cells: Array<{
			date: string | null;
			day: number | null;
			isToday: boolean;
			isWeekend: boolean;
			events: Event[];
		}> = [];

		for (let i = 0; i < firstDay; i++)
			cells.push({ date: null, day: null, isToday: false, isWeekend: false, events: [] });

		for (let d = 1; d <= daysInMonth; d++) {
			const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			const dayIdx = new Date(year, month - 1, d).getDay();
			const dayEvents = events.filter((ev) => {
				const start = ev.date || '';
				const end = ev.date_end || start;
				return dateStr >= start && dateStr <= end;
			});
			cells.push({
				date: dateStr,
				day: d,
				isToday: dateStr === todayStr,
				isWeekend: dayIdx === 0 || dayIdx === 6,
				events: dayEvents
			});
		}
		while (cells.length < 42)
			cells.push({ date: null, day: null, isToday: false, isWeekend: false, events: [] });
		return cells;
	});

	const selectedEvents = $derived(
		selectedDate
			? events.filter((ev) => {
					const start = ev.date || '';
					const end = ev.date_end || start;
					return selectedDate! >= start && selectedDate! <= end;
				})
			: []
	);

	const categoryColors: Record<string, string> = {
		업무: '#f8bbd0',
		연차: '#ffedd5',
		개인: '#fef3c7',
		글쓰기: '#e0f2fe',
		영어: '#d9f99d',
		스터디: '#ede9fe'
	};

	function eventColor(ev: Event): string {
		return ev.color || categoryColors[ev.category || ''] || '#c4b5fd';
	}
</script>

<div class="p-4 md:p-8 max-w-[1280px] mx-auto">
	<h1 class="text-2xl md:text-3xl font-extrabold headline mb-5">Calendar</h1>

	{#if loading}
		<div class="text-center py-12">
			<p class="text-sm text-slate-400">일정 불러오는 중...</p>
		</div>
	{:else if error}
		<div class="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-700">
			⚠️ {error}
		</div>
	{:else}
		<!-- 월 네비게이션 -->
		<div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
			<div>
				<h2 class="text-xl md:text-2xl font-extrabold headline">
					{year} {KO_MONTH[month - 1]}
				</h2>
				<p class="text-xs text-slate-500">{events.filter((e) => (e.date || '').substring(0, 7) === `${year}-${String(month).padStart(2, '0')}`).length}개 일정</p>
			</div>
			<div class="flex items-center gap-1">
				<button
					onclick={prevMonth}
					class="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold"
				>
					‹
				</button>
				<button
					onclick={gotoToday}
					class="px-3 py-2 rounded-lg bg-violet-100 hover:bg-violet-200 text-xs font-bold text-violet-700"
				>
					오늘
				</button>
				<button
					onclick={nextMonth}
					class="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold"
				>
					›
				</button>
			</div>
		</div>

		<!-- 캘린더 -->
		<section
			class="bg-white rounded-2xl p-4 border border-slate-100 mb-5"
			style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
		>
			<div class="grid grid-cols-7 gap-1 text-center mb-1">
				{#each KO_DAYS as d, i}
					<div
						class="text-[10px] font-bold py-1.5 {i === 0
							? 'text-rose-500'
							: i === 6
								? 'text-blue-500'
								: 'text-slate-400'}"
					>
						{d}
					</div>
				{/each}
			</div>
			<div class="grid grid-cols-7 gap-1">
				{#each calendar as cell}
					{@const isSelected = cell.date === selectedDate}
					{#if cell.day === null}
						<div class="aspect-square md:aspect-auto md:min-h-[80px]"></div>
					{:else}
						<button
							type="button"
							onclick={() => (selectedDate = cell.date)}
							class="aspect-square md:aspect-auto md:min-h-[80px] rounded-lg p-1 md:p-1.5 text-left transition-all overflow-hidden
								{cell.isToday
								? 'bg-violet-100 border-2 border-violet-500'
								: isSelected
									? 'bg-violet-50 border-2 border-violet-300'
									: cell.isWeekend
										? 'bg-slate-50/70 hover:bg-slate-100'
										: 'bg-slate-50 hover:bg-slate-100'}"
						>
							<div class="text-[10px] md:text-xs font-bold mb-1 {cell.isToday ? 'text-violet-700' : 'text-slate-700'}">
								{cell.day}
							</div>
							<!-- 모바일: 도트 -->
							<div class="md:hidden flex flex-wrap gap-0.5 justify-center">
								{#each cell.events.slice(0, 4) as ev}
									<span
										class="w-1 h-1 rounded-full"
										style="background: {eventColor(ev)}"
									></span>
								{/each}
							</div>
							<!-- 데스크탑: 일정 배지 -->
							<div class="hidden md:flex flex-col gap-0.5">
								{#each cell.events.slice(0, 3) as ev}
									<span
										class="text-[9px] font-semibold px-1 py-0.5 rounded truncate"
										style="background: {eventColor(ev)}; color: #1e293b"
									>
										{ev.title}
									</span>
								{/each}
								{#if cell.events.length > 3}
									<span class="text-[8px] text-slate-400">
										+{cell.events.length - 3}
									</span>
								{/if}
							</div>
						</button>
					{/if}
				{/each}
			</div>
		</section>

		<!-- 선택한 날짜 일정 -->
		{#if selectedDate}
			<section
				class="bg-white rounded-2xl p-5 border border-slate-100"
				style="box-shadow: 0 1px 4px rgba(0,0,0,0.04)"
			>
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-sm font-bold text-slate-800">📅 {selectedDate}</h3>
					<span class="text-xs text-slate-400">{selectedEvents.length}개 일정</span>
				</div>
				{#if selectedEvents.length === 0}
					<p class="text-xs text-slate-400 italic py-4 text-center">이 날에 일정 없음</p>
				{:else}
					<div class="flex flex-col gap-2">
						{#each selectedEvents as ev}
							<div class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
								<div
									class="w-1 h-12 rounded-full shrink-0"
									style="background: {eventColor(ev)}"
								></div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-0.5 flex-wrap">
										{#if ev.category}
											<span
												class="text-[10px] font-bold px-1.5 py-0.5 rounded"
												style="background: {eventColor(ev)}; color: #1e293b"
											>
												{ev.category}
											</span>
										{/if}
										{#if ev.date_end && ev.date_end !== ev.date}
											<span class="text-[10px] text-slate-500">
												{ev.date} ~ {ev.date_end}
											</span>
										{/if}
									</div>
									<p class="text-sm font-bold text-slate-800">{ev.title}</p>
									{#if ev.notes}
										<p class="text-xs text-slate-500 mt-1">{ev.notes}</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	{/if}
</div>
