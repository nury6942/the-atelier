<script lang="ts">
	import '../app.css';
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();

	let sidebarOpen = $state(true);

	// 모바일 기본 닫힘
	onMount(() => {
		auth.init();
		if (window.innerWidth < 768) sidebarOpen = false;
	});

	const isLoginPage = $derived(page.url.pathname.endsWith('/login'));

	$effect(() => {
		if (auth.loading) return;
		if (!auth.user && !isLoginPage) {
			goto(base + '/login');
		}
	});
</script>

<svelte:head>
	<title>The Atelier</title>
</svelte:head>

{#if isLoginPage}
	{@render children()}
{:else if auth.loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-center">
			<div
				class="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center text-2xl animate-pulse"
				style="background: linear-gradient(135deg, #7c3aed, #ec4899)"
			>
				🎨
			</div>
			<p class="text-xs text-slate-400">불러오는 중...</p>
		</div>
	</div>
{:else if auth.user}
	<div class="min-h-screen flex">
		<Sidebar bind:open={sidebarOpen} onClose={() => (sidebarOpen = false)} />

		<!-- 메인 영역 -->
		<div
			class="flex-1 transition-all duration-300"
			class:md:ml-64={sidebarOpen}
			class:md:ml-0={!sidebarOpen}
		>
			<!-- 모바일 헤더 (햄버거) -->
			<header
				class="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between"
			>
				<button
					onclick={() => (sidebarOpen = !sidebarOpen)}
					class="p-2 -ml-2 rounded-lg hover:bg-slate-100"
					aria-label="메뉴 열기"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
				<h1 class="text-sm font-bold headline">The Atelier</h1>
				<div class="w-9"></div>
			</header>

			{@render children()}
		</div>
	</div>
{/if}
