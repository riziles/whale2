<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Scene from '$lib/Scene.svelte';
	import HUD from '$lib/HUD.svelte';
	import { inputKeys } from '$lib/game.svelte';

	function handleKeyDown(e: KeyboardEvent) {
		inputKeys[e.key.toLowerCase()] = true;
	}
	function handleKeyUp(e: KeyboardEvent) {
		inputKeys[e.key.toLowerCase()] = false;
	}
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

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
