<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>The Atelier</title>
</svelte:head>

{@render children()}
