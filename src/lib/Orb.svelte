<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import * as THREE from 'three';
	import type { OrbData } from './game.svelte';

	const { orb }: { orb: OrbData } = $props();

	const { camera } = useThrelte();

	let floatY = $state(0);
	let rotation = $state(0);
	let screenX = $state(0);
	let screenY = $state(0);
	let behindCamera = $state(true);

	useTask((delta) => {
		floatY = Math.sin(Date.now() * 0.002 + orb.id * 0.7) * 0.3;
		rotation += delta * 0.5;

		// Project 3D position to screen for avatar overlay
		const cam = camera.current;
		if (cam) {
			const worldPos = new THREE.Vector3(orb.position.x, 1.5 + floatY, orb.position.z);
			const screenPos = worldPos.clone().project(cam);
			screenX = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
			screenY = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
			behindCamera = screenPos.z > 1;
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
			<T.MeshStandardMaterial color={orbColor} roughness={0.2} metalness={0.6} />
		</T.Mesh>

		<T.Mesh position={[0, -1.2 - floatY + 0.05, 0]} rotation.x={-Math.PI / 2}>
			<T.RingGeometry args={[0.2, 0.4, 32]} />
			<T.MeshBasicMaterial color={glowColor} transparent opacity={0.3} side={THREE.DoubleSide} />
		</T.Mesh>
	</T.Group>
{/if}

<!-- Avatar overlay — CSS positioned using projected screen coords -->
{#if !orb.collected && orb.profile.avatar && !behindCamera}
	<div
		class="avatar-overlay"
		style="left:{screenX}px;top:{screenY}px"
	>
		<img src={orb.profile.avatar} alt="" />
	</div>
{/if}

<style>
	.avatar-overlay {
		position: fixed;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid rgba(255, 255, 255, 0.4);
		box-shadow: 0 0 12px rgba(91, 138, 247, 0.5);
		pointer-events: none;
		transform: translate(-50%, -50%);
		z-index: 40;
	}
	.avatar-overlay img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
</style>
