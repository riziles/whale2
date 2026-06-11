<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Scene from '$lib/Scene.svelte';
	import HUD from '$lib/HUD.svelte';
</script>

<div class="app">
	<Canvas
		options={{
			antialias: true,
			alpha: false,
			powerPreference: 'high-performance'
		}}
	>
		<Scene />
	</Canvas>
	<HUD />
</div>

<style>
	.app {
		width: 100%;
		height: 100%;
		position: relative;
	}
	:global(canvas) {
		display: block;
	}
</style>
