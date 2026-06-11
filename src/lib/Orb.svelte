<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import type { OrbData } from './game.svelte';
	import { proxyImageUrl } from './api';

	const { orb }: { orb: OrbData } = $props();

	let orbRef = $state<THREE.Mesh>();
	let texture = $state<THREE.Texture | null>(null);
	let textureLoaded = $state(false);

	// Floating animation
	let floatY = $state(0);
	let rotation = $state(0);
	useTask((delta) => {
		floatY = Math.sin(Date.now() * 0.002 + orb.id * 0.7) * 0.3;
		rotation += delta * 0.5;
	});

	// Load avatar texture
	onMount(() => {
		if (orb.textureUrl) {
			const loader = new THREE.TextureLoader();
			loader.crossOrigin = 'anonymous';
			loader.load(
				proxyImageUrl(orb.textureUrl),
				(tex) => {
					tex.colorSpace = THREE.SRGBColorSpace;
					texture = tex;
					textureLoaded = true;
				},
				undefined,
				() => {
					// Fallback: use a colored material
					textureLoaded = true;
				}
			);
		} else {
			textureLoaded = true;
		}
	});
</script>

{#if !orb.collected}
	<T.Group
		position={[orb.position.x, 1.2 + floatY, orb.position.z]}
		rotation.y={rotation}
	>
		<!-- Glow ring -->
		<T.Mesh rotation.x={Math.PI / 2}>
			<T.TorusGeometry args={[0.38, 0.03, 16, 32]} />
			<T.MeshBasicMaterial
				color={textureLoaded ? '#5b8af7' : '#666'}
				transparent
				opacity={0.6}
			/>
		</T.Mesh>

		<!-- Avatar sphere -->
		<T.Mesh bind:ref={orbRef}>
			<T.SphereGeometry args={[0.35, 32, 32]} />
			{#if texture}
				<T.MeshStandardMaterial map={texture} roughness={0.3} metalness={0.1} />
			{:else}
				<T.MeshStandardMaterial color="#334" roughness={0.3} metalness={0.3} />
			{/if}
		</T.Mesh>

		<!-- Shadow/indicator on ground -->
		<T.Mesh
			position={[0, -1.2 - floatY + 0.05, 0]}
			rotation.x={-Math.PI / 2}
		>
			<T.RingGeometry args={[0.2, 0.4, 32]} />
			<T.MeshBasicMaterial
				color="#5b8af7"
				transparent
				opacity={0.3}
				side={THREE.DoubleSide}
			/>
		</T.Mesh>
	</T.Group>
{/if}
