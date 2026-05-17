<script lang="ts">
	let { title, icon, week }: { title: string; icon: string; week: number } = $props();
</script>

<main class="p-6 md:p-10 max-w-6xl mx-auto">
	<div class="flex items-center gap-3 mb-2">
		<span class="text-3xl">{icon}</span>
		<h1 class="text-3xl md:text-4xl font-extrabold headline">{title}</h1>
	</div>
	<p class="text-sm text-slate-500 mb-8">SPA 마이그레이션 — Week {week} 작업 예정</p>

	<div
		class="bg-white rounded-2xl p-8 border-2 border-dashed border-slate-200 text-center max-w-md mx-auto mt-12"
	>
		<div class="text-5xl mb-3 opacity-30">{icon}</div>
		<h2 class="font-bold mb-2">아직 이전 전 페이지야</h2>
		<p class="text-xs text-slate-500 leading-relaxed">
			현재 사이트(main 브랜치)에 모든 기능이 살아있어. 이 페이지는 마이그레이션 완료 후 활성화돼.
		</p>
		<p class="mt-4 text-[10px] text-slate-400">예정 작업: Week {week}</p>
	</div>
</main>
