<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import type { OrbData } from './game.svelte';

	const { orb }: { orb: OrbData } = $props();

	let texture = $state<THREE.Texture | null>(null);

	let floatY = $state(0);
	let rotation = $state(0);

	useTask((delta) => {
		floatY = Math.sin(Date.now() * 0.002 + orb.id * 0.7) * 0.3;
		rotation += delta * 0.5;
	});

	// Load avatar as texture (no crossOrigin = same relaxed rules as <img>)
	onMount(() => {
		if (orb.profile.avatar) {
			const loader = new THREE.TextureLoader();
			loader.load(orb.profile.avatar, (tex) => {
				tex.colorSpace = THREE.SRGBColorSpace;
				texture = tex;
			});
		}
	});

	const hue = $derived((orb.id * 37) % 360);
	const orbColor = $derived(`hsl(${hue}, 70%, 55%)`);
	const glowColor = $derived(`hsl(${hue}, 80%, 65%)`);
</script>

{#if !orb.collected}
	<!-- 3D sphere + glow -->
	<T.Group
		position={[orb.position.x, 1.2 + floatY, orb.position.z]}
		rotation.y={rotation}
	>
		<T.Mesh rotation.x={Math.PI / 2}>
			<T.TorusGeometry args={[0.38, 0.03, 16, 32]} />
			<T.MeshBasicMaterial color={glowColor} transparent opacity={0.5} />
		</T.Mesh>

		<T.Mesh>
			<T.SphereGeometry args={[0.35, 32, 32]} />
			{#if texture}
				<T.MeshStandardMaterial map={texture} roughness={0.3} metalness={0.1} />
			{:else}
				<T.MeshStandardMaterial color={orbColor} roughness={0.2} metalness={0.6} />
			{/if}
		</T.Mesh>

		<T.Mesh position={[0, -1.2 - floatY + 0.05, 0]} rotation.x={-Math.PI / 2}>
			<T.RingGeometry args={[0.2, 0.4, 32]} />
			<T.MeshBasicMaterial color={glowColor} transparent opacity={0.3} side={THREE.DoubleSide} />
		</T.Mesh>
	</T.Group>
{/if}

<style>
</style>
