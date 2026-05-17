<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { auth } from '$lib/stores/auth.svelte';

	type NavItem = { href: string; label: string; icon: string };

	const items: NavItem[] = [
		{ href: '/', label: 'DASHBOARD', icon: '⊟' },
		{ href: '/calendar', label: 'CALENDAR', icon: '📅' },
		{ href: '/money', label: 'MONEY', icon: '📊' },
		{ href: '/annie', label: 'ANNIE', icon: '文' },
		{ href: '/travel', label: 'TRAVEL', icon: '🧭' },
		{ href: '/memo', label: 'MEMO', icon: '📖' }
	];

	let { open = $bindable(true), onClose }: { open?: boolean; onClose?: () => void } = $props();

	function isActive(href: string) {
		const cur = page.url.pathname.replace(base, '') || '/';
		if (href === '/') return cur === '/' || cur === '';
		return cur.startsWith(href);
	}
</script>

<!-- 모바일 백드롭 -->
{#if open}
	<button
		class="md:hidden fixed inset-0 bg-black/30 z-40"
		onclick={onClose}
		aria-label="사이드바 닫기"
	></button>
{/if}

<aside
	class="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-100 flex flex-col py-6 z-50 transition-transform duration-300"
	class:translate-x-0={open}
	class:-translate-x-full={!open}
	class:md:translate-x-0={true}
>
	<!-- 로고 -->
	<div class="px-6 mb-8">
		<div class="flex items-center gap-3">
			<div
				class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow"
				style="background: linear-gradient(135deg, #7c3aed, #ec4899)"
			>
				🎨
			</div>
			<div>
				<h2 class="text-lg font-bold leading-none headline">The Atelier</h2>
				<p class="text-[10px] text-slate-400 mt-1">v2.0 SPA</p>
			</div>
		</div>
	</div>

	<!-- 메뉴 -->
	<nav class="flex-1 px-2">
		{#each items as item}
			{@const active = isActive(item.href)}
			<a
				href={base + item.href}
				onclick={() => { if (window.innerWidth < 768) onClose?.(); }}
				class="nav-item flex items-center gap-3 px-4 py-2.5 mx-1 rounded-xl transition-all duration-150 mb-1
					{active
						? 'bg-violet-100 text-violet-700 font-bold'
						: 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-semibold'}"
			>
				<span class="text-base w-5 text-center">{item.icon}</span>
				<span class="text-xs tracking-wider">{item.label}</span>
			</a>
		{/each}
	</nav>

	<!-- 사용자 정보 -->
	{#if auth.user}
		<div class="px-4 pt-4 border-t border-slate-100">
			<div class="flex items-center gap-3 px-2 py-2 mb-2">
				<div
					class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
					style="background: linear-gradient(135deg, #7c3aed, #ec4899)"
				>
					N
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-xs font-bold truncate">Nuri</p>
					<p class="text-[10px] text-slate-400 truncate">{auth.user.email}</p>
				</div>
			</div>
			<button
				onclick={() => auth.logout()}
				class="w-full text-[10px] text-slate-400 hover:text-red-500 py-2 transition-colors"
			>
				로그아웃
			</button>
		</div>
	{/if}
</aside>
