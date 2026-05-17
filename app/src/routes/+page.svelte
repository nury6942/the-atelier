<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
</script>

<main class="p-6 md:p-10 max-w-6xl mx-auto">
	<h1 class="text-3xl md:text-4xl font-extrabold mb-2 headline">Dashboard</h1>
	<p class="text-sm text-slate-500 mb-8">
		안녕 Nuri 👋 <span class="text-violet-500">{auth.user?.displayName || ''}</span>
	</p>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		<!-- 마이그레이션 상태 카드 -->
		<div
			class="col-span-full bg-white rounded-2xl p-6 border border-violet-100"
			style="box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08)"
		>
			<div class="flex items-center gap-3 mb-3">
				<div
					class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
					style="background: linear-gradient(135deg, #7c3aed, #ec4899); color: white"
				>
					🚀
				</div>
				<h2 class="font-bold text-base headline">마이그레이션 진행 중</h2>
			</div>
			<p class="text-xs text-slate-500 leading-relaxed mb-3">
				새 SPA 버전이야. 페이지별 분리 로드 + 모바일 최적화. 곧 모든 기능이 옮겨질 예정.
			</p>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
				<div class="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg">✅ Firebase Auth</div>
				<div class="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg">✅ 사이드바</div>
				<div class="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg">✅ 라우팅</div>
				<div class="bg-amber-50 text-amber-700 px-3 py-2 rounded-lg">⏳ 데이터 연결</div>
			</div>
		</div>

		{#each ['오늘의 일정', '재정', '주간 리뷰', '여행', '메모', '뉴스'] as title}
			<div
				class="bg-white rounded-2xl p-5 border border-slate-100 hover:border-violet-200 transition-colors"
				style="box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04)"
			>
				<h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</h3>
				<p class="text-sm text-slate-300">곧 옮겨질 예정...</p>
			</div>
		{/each}
	</div>
</main>
