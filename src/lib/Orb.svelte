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
	const glowColor = $derived(`hsl(${hue}, 80%, 65%)`);
</script>

{#if !orb.collected}
	<T.Group
		position={[orb.position.x, 1.2 + floatY, orb.position.z]}
		rotation.y={rotation}
	>
		<!-- Glow ring on ground -->
		<T.Mesh position={[0, -1.2 - floatY + 0.05, 0]} rotation.x={-Math.PI / 2}>
			<T.RingGeometry args={[0.2, 0.45, 32]} />
			<T.MeshBasicMaterial color={glowColor} transparent opacity={0.35} side={THREE.DoubleSide} />
		</T.Mesh>

		<!-- Avatar as floating HTML sprite -->
		{#if orb.profile.avatar}
			<HTML transform sprite>
				<div class="avatar-orb">
					<img src={avatarUrl(orb.profile.avatar)} alt="" />
				</div>
			</HTML>
		{/if}
	</T.Group>
{/if}

<style>
	.avatar-orb {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		overflow: hidden;
		border: 3px solid rgba(255, 255, 255, 0.6);
		box-shadow: 0 0 20px rgba(91, 138, 247, 0.5);
		pointer-events: none;
	}
	.avatar-orb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
</style>
