<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { ALLOWED_EMAIL } from '$lib/firebase';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	let busy = $state(false);
	let error = $state('');

	onMount(() => {
		auth.init();
	});

	$effect(() => {
		// 이미 로그인 돼있으면 메인으로
		if (auth.user && !auth.loading) {
			goto(base + '/');
		}
	});

	async function handleLogin() {
		busy = true;
		error = '';
		try {
			await auth.login();
		} catch (e: any) {
			error = e?.message || '로그인 실패';
		} finally {
			busy = false;
		}
	}
</script>

<main class="min-h-screen flex items-center justify-center p-6 bg-slate-50">
	<div
		class="w-full max-w-sm bg-white rounded-2xl p-8 text-center"
		style="box-shadow: 0 20px 60px -10px rgba(124, 58, 237, 0.12)"
	>
		<div
			class="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
			style="background: linear-gradient(135deg, #7c3aed, #ec4899)"
		>
			🎨
		</div>
		<h1 class="text-2xl font-bold mb-1 headline">The Atelier</h1>
		<p class="text-sm text-slate-500 mb-8">Nuri의 라이프 OS</p>

		{#if auth.denied}
			<div
				class="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-xs text-red-700 text-left"
			>
				<div class="font-bold mb-1">접근 거부됨</div>
				허용된 계정이 아닙니다. <code class="font-mono">{ALLOWED_EMAIL}</code>로 로그인하세요.
			</div>
		{/if}

		<button
			onclick={handleLogin}
			disabled={busy || auth.loading}
			class="w-full bg-white border-2 border-slate-200 hover:border-violet-400 hover:bg-violet-50 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
		>
			<svg class="w-5 h-5" viewBox="0 0 24 24">
				<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
				<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
				<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
				<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
			</svg>
			{busy ? '로그인 중...' : 'Google 계정으로 로그인'}
		</button>

		{#if error}
			<p class="mt-4 text-xs text-red-500">{error}</p>
		{/if}

		<p class="mt-8 text-[10px] text-slate-400">
			🔧 SPA 마이그레이션 빌드 — Day 1
		</p>
	</div>
</main>
