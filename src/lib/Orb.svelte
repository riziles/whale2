<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import type { OrbData } from './game.svelte';

	const { orb }: { orb: OrbData } = $props();

	let rotation = $state(0);

	useTask((delta) => {
		rotation += delta * 0.5;
	});

	const hue = $derived((orb.id * 37) % 360);
	const orbColor = $derived(`hsl(${hue}, 70%, 55%)`);
	const glowColor = $derived(`hsl(${hue}, 80%, 65%)`);
</script>

{#if !orb.collected}
	<T.Group
		position={[orb.position.x, 1.5, orb.position.z]}
		rotation.y={rotation}
	>
		<T.Mesh>
			<T.SphereGeometry args={[0.15, 16, 16]} />
			<T.MeshStandardMaterial color={orbColor} roughness={0.2} metalness={0.6} />
		</T.Mesh>

		<T.Mesh position={[0, -1.45, 0]} rotation.x={-Math.PI / 2}>
			<T.RingGeometry args={[0.1, 0.25, 32]} />
			<T.MeshBasicMaterial color={glowColor} transparent opacity={0.25} side={THREE.DoubleSide} />
		</T.Mesh>
	</T.Group>
{/if}

<style>
</style>
