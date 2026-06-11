<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { HTML } from '@threlte/extras';
	import * as THREE from 'three';
	import type { OrbData } from './game.svelte';
	import { avatarUrl } from './api';

	const { orb }: { orb: OrbData } = $props();

	let floatY = $state(0);
	let rotation = $state(0);
	useTask((delta) => {
		floatY = Math.sin(Date.now() * 0.002 + orb.id * 0.7) * 0.3;
		rotation += delta * 0.5;
	});

	const hue = $derived((orb.id * 37) % 360);
	const orbColor = $derived(`hsl(${hue}, 70%, 55%)`);
	const glowColor = $derived(`hsl(${hue}, 80%, 65%)`);
</script>

{#if !orb.collected}
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

		<!-- Avatar image as HTML sprite (no separate position — inherits from group) -->
		{#if orb.profile.avatar}
			<HTML transform sprite>
				<div class="avatar-wrapper">
					<img src={avatarUrl(orb.profile.avatar)} alt="" loading="eager" />
				</div>
			</HTML>
		{/if}
	</T.Group>
{/if}

<style>
	.avatar-wrapper {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid rgba(255, 255, 255, 0.5);
		box-shadow: 0 0 16px rgba(91, 138, 247, 0.6);
		pointer-events: none;
	}
	.avatar-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
</style>
