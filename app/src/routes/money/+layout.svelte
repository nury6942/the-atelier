<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';

	let { children } = $props();

	const tabs = [
		{ href: '/money', label: '가계부', icon: '📓', match: ['/money', '/money/year'] },
		{ href: '/money/assets', label: '자산', icon: '🏦', match: ['/money/assets'] },
		{ href: '/money/side-gig', label: '부업', icon: '💼', match: ['/money/side-gig'] }
	];

	function isActive(t: { href: string; match: string[] }) {
		const cur = page.url.pathname.replace(base, '') || '/';
		return t.match.includes(cur);
	}
</script>

<div class="p-4 md:p-8 max-w-[1280px] mx-auto">
	<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
		<h1 class="text-2xl md:text-3xl font-extrabold headline">Money</h1>
		<!-- 탭 -->
		<nav class="bg-slate-100 rounded-2xl p-1 flex gap-1">
			{#each tabs as t}
				{@const active = isActive(t)}
				<a
					href={base + t.href}
					class="flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all
						{active ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
				>
					<span>{t.icon}</span>
					<span>{t.label}</span>
				</a>
			{/each}
		</nav>
	</div>

	{@render children()}
</div>
