<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { fbReadDoc } from '$lib/firestore';
	import { getGreeting, formatToday, todayKey } from '$lib/utils/greeting';
	import { fmtKRW } from '$lib/utils/format';
	import { base } from '$app/paths';

	// ═══ 상태 ═══
	let greeting = $state(getGreeting());
	let todayStr = $state(formatToday());

	// 재정 (Daily Ledger에서 이번 달 통계)
	type LedgerData = {
		transactions?: Array<{ date: string; 대분류: string; 금액: number }>;
	};
	let income = $state(0);
	let expense = $state(0);
	let net = $derived(income - expense);
	let financeLoading = $state(true);

	// 다음 여행
	type Trip = { id: string; name: string; start_date: string; end_date: string };
	let nextTrip = $state<Trip | null>(null);
	let tripLoading = $state(true);

	// 매분 인사말 새로고침 (시간 바뀌면)
	onMount(() => {
		const interval = setInterval(() => {
			greeting = getGreeting();
			todayStr = formatToday();
		}, 60_000);

		loadFinance();
		loadNextTrip();

		return () => clearInterval(interval);
	});

	async function loadFinance() {
		try {
			const data = await fbReadDoc<LedgerData>('appSettings/ledgerData');
			const txs = data?.transactions || [];
			const month = todayKey().substring(0, 7); // YYYY-MM
			let inc = 0,
				exp = 0;
			for (const t of txs) {
				if (!t.date || t.date.substring(0, 7) !== month) continue;
				if (t.대분류 === '수입') inc += t.금액 || 0;
				else if (t.대분류 !== '저축') exp += t.금액 || 0;
			}
			income = inc;
			expense = exp;
		} catch (e) {
			console.error('[finance load]', e);
		} finally {
			financeLoading = false;
		}
	}

	async function loadNextTrip() {
		try {
			// trips는 컬렉션. 가까운 미래 여행 1개 찾기
			const { getFirebase } = await import('$lib/firebase');
			const { collection: col, getDocs, query, where, orderBy, limit } = await import(
				'firebase/firestore'
			);
			const { db } = getFirebase();
			const today = todayKey();
			const q = query(
				col(db, 'trips'),
				where('end_date', '>=', today),
				orderBy('end_date', 'asc'),
				limit(1)
			);
			const snap = await getDocs(q);
			if (!snap.empty) {
				const d = snap.docs[0];
				nextTrip = { id: d.id, ...(d.data() as any) };
			}
		} catch (e) {
			console.error('[trip load]', e);
		} finally {
			tripLoading = false;
		}
	}

	function tripDday(trip: Trip): string {
		const start = new Date(trip.start_date);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
		if (diff < 0) {
			const end = new Date(trip.end_date);
			if (today <= end) return '여행 중';
			return '종료';
		}
		if (diff === 0) return 'D-DAY';
		return `D-${diff}`;
	}
</script>

<main class="p-4 md:p-8 max-w-[1280px] mx-auto">
	<!-- ═══ Hero: 인사말 + Brief ═══ -->
	<section class="mb-6">
		<div
			class="bg-white rounded-2xl p-6 md:p-8 border border-violet-100"
			style="box-shadow: 0 4px 20px rgba(124, 58, 237, 0.05)"
		>
			<p class="text-xs font-bold text-violet-600 tracking-widest mb-2 uppercase">Overview</p>
			<h1 class="text-2xl md:text-3xl font-extrabold mb-2 headline">{greeting}.</h1>
			<p class="text-sm text-slate-500">{todayStr}</p>

			<!-- Brief placeholder -->
			<div
				class="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400"
			>
				<span>📡</span>
				<span>AI 브리프는 Week 2에 옮겨질 예정 — 곧 만나요</span>
			</div>
		</div>
	</section>

	<!-- ═══ 영어 + 환율 — Week 2 후속 작업 ═══ -->
	<section class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
		<div
			class="rounded-2xl p-6 text-white relative overflow-hidden"
			style="background: linear-gradient(135deg, #7c3aed, #a855f7, #ec4899); box-shadow: 0 8px 24px rgba(124, 58, 237, 0.22)"
		>
			<div
				class="absolute top-3 right-5 text-7xl font-extrabold opacity-15 leading-none pointer-events-none"
			>
				"
			</div>
			<div class="flex items-center gap-2 mb-3 relative z-10">
				<span>🌐</span>
				<h3 class="text-xs font-bold tracking-widest uppercase">오늘의 영어</h3>
			</div>
			<p class="text-base font-bold italic relative z-10 leading-snug opacity-90">
				Coming back in Week 2...
			</p>
		</div>

		<div
			class="rounded-2xl p-6 border border-indigo-200"
			style="background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%); box-shadow: 0 4px 20px rgba(99, 102, 241, 0.05)"
		>
			<div class="flex items-center gap-2 mb-3">
				<div class="p-2 rounded-lg bg-indigo-500/15 text-indigo-600 text-base">💱</div>
				<h3 class="text-sm font-bold text-indigo-950">환율</h3>
			</div>
			<p class="text-xs text-indigo-500 italic">곧 옮길 예정</p>
		</div>
	</section>

	<!-- ═══ Bento Grid 4 cards (실데이터 일부) ═══ -->
	<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
		<!-- 재정 순익 (실데이터 ✓) -->
		<a
			href={base + '/money'}
			class="block min-h-[180px] rounded-2xl p-5 border border-emerald-200 transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col"
			style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)"
		>
			<div class="flex justify-between items-start mb-4">
				<div class="p-2 rounded-lg bg-emerald-200/60 text-emerald-700 text-base">📈</div>
				<span class="text-[10px] font-bold text-emerald-700 tracking-widest uppercase">
					이번 달
				</span>
			</div>
			<h3 class="text-xs font-semibold text-emerald-700 mb-1.5">재정 순익</h3>
			<p class="text-xl md:text-2xl font-bold text-emerald-900 leading-tight">
				{financeLoading ? '...' : fmtKRW(net)}
			</p>
			<div
				class="mt-auto pt-3 border-t border-emerald-300/50 text-[11px] flex flex-col gap-1"
			>
				<div class="flex justify-between">
					<span class="text-emerald-700">수입</span>
					<span class="font-bold text-emerald-800">{financeLoading ? '...' : fmtKRW(income)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-emerald-700">지출</span>
					<span class="font-bold text-red-600">{financeLoading ? '...' : fmtKRW(expense)}</span>
				</div>
			</div>
		</a>

		<!-- 다음 여행 (실데이터 ✓) -->
		<a
			href={base + '/travel'}
			class="block min-h-[180px] rounded-2xl p-5 border border-violet-200 transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col relative overflow-hidden"
			style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)"
		>
			<div
				class="absolute -right-4 -bottom-6 text-7xl opacity-10 pointer-events-none"
			>
				✈️
			</div>
			<div class="flex justify-between items-start mb-4 relative z-10">
				<div class="p-2 rounded-lg bg-violet-500/15 text-violet-600 text-base">🛫</div>
				{#if nextTrip}
					<span
						class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-200 text-violet-800"
					>
						{tripDday(nextTrip)}
					</span>
				{/if}
			</div>
			<h3 class="text-xs font-semibold text-violet-700 mb-1.5">다음 여행</h3>
			<p class="text-base md:text-lg font-bold text-violet-950 leading-tight">
				{tripLoading ? '...' : nextTrip?.name || '계획된 여행 없음'}
			</p>
			{#if nextTrip}
				<div
					class="mt-auto pt-3 text-[11px] text-violet-700"
				>
					{nextTrip.start_date} ~ {nextTrip.end_date}
				</div>
			{/if}
		</a>

		<!-- 작품 진행 (Week 3) -->
		<div
			class="min-h-[180px] rounded-2xl p-5 border border-amber-200 flex flex-col"
			style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
		>
			<div class="flex justify-between items-start mb-4">
				<div class="p-2 rounded-lg bg-amber-200 text-amber-700 text-base">✍️</div>
				<span class="text-[10px] font-bold text-amber-700 tracking-widest uppercase">
					Week 3
				</span>
			</div>
			<h3 class="text-xs font-semibold text-amber-700 mb-1.5">작품 진행</h3>
			<p class="text-base font-bold text-amber-900 leading-tight opacity-50">곧 연결 예정</p>
		</div>

		<!-- 오늘 일정 (Week 2 후속) -->
		<div
			class="min-h-[180px] rounded-2xl p-5 flex flex-col relative overflow-hidden text-white"
			style="background: linear-gradient(135deg, #7c3aed, #a855f7); box-shadow: 0 8px 24px rgba(124, 58, 237, 0.18)"
		>
			<div
				class="absolute -right-4 -bottom-6 text-7xl opacity-10 pointer-events-none"
			>
				📅
			</div>
			<div class="flex justify-between items-start mb-4 relative z-10">
				<div class="p-2 rounded-lg bg-white/20 text-white text-base backdrop-blur">📅</div>
				<span class="text-[10px] font-bold tracking-widest uppercase opacity-80">Today</span>
			</div>
			<h3 class="text-xs font-semibold opacity-80 mb-1.5">오늘 일정</h3>
			<p class="text-base font-bold leading-tight opacity-60">곧 연결 예정</p>
		</div>
	</section>

	<!-- 진행 안내 -->
	<section
		class="bg-white rounded-2xl p-6 border border-slate-100"
		style="box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04)"
	>
		<div class="flex items-center gap-3 mb-3">
			<span class="text-xl">🚧</span>
			<h2 class="font-bold text-base headline">Week 2 진행 계획</h2>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
			<div class="flex items-center gap-2 text-slate-600">
				<span class="text-emerald-500">✅</span>
				<span>인사말 + 시간 인식</span>
			</div>
			<div class="flex items-center gap-2 text-slate-600">
				<span class="text-emerald-500">✅</span>
				<span>이번 달 재정 (Firestore 연결)</span>
			</div>
			<div class="flex items-center gap-2 text-slate-600">
				<span class="text-emerald-500">✅</span>
				<span>다음 여행 (Firestore 연결)</span>
			</div>
			<div class="flex items-center gap-2 text-slate-400">
				<span>⏳</span>
				<span>AI 브리프 (Claude API)</span>
			</div>
			<div class="flex items-center gap-2 text-slate-400">
				<span>⏳</span>
				<span>오늘의 영어 + 환율</span>
			</div>
			<div class="flex items-center gap-2 text-slate-400">
				<span>⏳</span>
				<span>오늘 일정 + 작품 진행</span>
			</div>
			<div class="flex items-center gap-2 text-slate-400">
				<span>⏳</span>
				<span>Week in Review (7일 카드)</span>
			</div>
			<div class="flex items-center gap-2 text-slate-400">
				<span>⏳</span>
				<span>뉴스 헤드라인 (국내+해외)</span>
			</div>
		</div>
	</section>
</main>
