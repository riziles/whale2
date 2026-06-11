<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import { game, inputKeys } from './game.svelte';
	import Player from './Player.svelte';
	import Orb from './Orb.svelte';

	interactivity();

	const { camera, renderer } = useThrelte();

	// World bounds
	const WORLD_SIZE = 14;
	const PLAYER_SPEED = 6;

	// Player movement
	let playerPos = $state({ x: 0, z: 0 });

	// Joystick
	let joystickX = $state(0);
	let joystickY = $state(0);

	// Ground grid texture
	let gridTexture = $state<THREE.Texture>();
	onMount(() => {
		const canvas = document.createElement('canvas');
		canvas.width = 256;
		canvas.height = 256;
		const ctx = canvas.getContext('2d')!;
		ctx.fillStyle = '#0d1b2a';
		ctx.fillRect(0, 0, 256, 256);
		ctx.strokeStyle = '#1a3a5c';
		ctx.lineWidth = 1;
		const step = 16;
		for (let i = 0; i <= 256; i += step) {
			ctx.beginPath();
			ctx.moveTo(i, 0);
			ctx.lineTo(i, 256);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(0, i);
			ctx.lineTo(256, i);
			ctx.stroke();
		}
		gridTexture = new THREE.CanvasTexture(canvas);
		gridTexture.wrapS = THREE.RepeatWrapping;
		gridTexture.wrapT = THREE.RepeatWrapping;
		gridTexture.repeat.set(8, 8);
	});

	// Joystick input callback
	function setJoystick(x: number, y: number) {
		joystickX = x;
		joystickY = y;
	}

	// Main game loop
	useTask((delta) => {
		if (game.state !== 'playing') return;

		// Combine keyboard and joystick input
		let dx = 0;
		let dz = 0;

		if (inputKeys['w'] || inputKeys['arrowup']) dz -= 1;
		if (inputKeys['s'] || inputKeys['arrowdown']) dz += 1;
		if (inputKeys['a'] || inputKeys['arrowleft']) dx -= 1;
		if (inputKeys['d'] || inputKeys['arrowright']) dx += 1;

		dx += joystickX;
		dz += joystickY;

		// Normalize
		const len = Math.sqrt(dx * dx + dz * dz);
		if (len > 1) { dx /= len; dz /= len; }

		// Move player
		const dt = Math.min(delta, 0.1);
		playerPos.x += dx * PLAYER_SPEED * dt;
		playerPos.z += dz * PLAYER_SPEED * dt;

		// Clamp to world bounds
		playerPos.x = Math.max(-WORLD_SIZE / 2 + 1, Math.min(WORLD_SIZE / 2 - 1, playerPos.x));
		playerPos.z = Math.max(-WORLD_SIZE / 2 + 1, Math.min(WORLD_SIZE / 2 - 1, playerPos.z));

		// Rotate whale to face movement direction
		if (len > 0.1 && whaleGroup) {
			whaleGroup.rotation.y = Math.atan2(dz, dx) + Math.PI / 2;
		}
		// Move whaleGroup (world space) — NOT the inner mesh (local space)
		if (whaleGroup) {
			whaleGroup.position.x = playerPos.x;
			whaleGroup.position.z = playerPos.z;
		}

		// Collision detection
		for (const orb of game.orbs) {
			if (orb.collected) continue;
			const dist = Math.sqrt(
				(playerPos.x - orb.position.x) ** 2 + (playerPos.z - orb.position.z) ** 2
			);
			if (dist < 1.0) game.collectOrb(orb.id);
		}

		game.playerPosition = { ...playerPos };

		// Camera follow — camera.current gives the Camera object directly
		const cam3d = camera.current;
		if (cam3d) {
			cam3d.position.x += (playerPos.x - cam3d.position.x) * Math.min(8 * delta, 1);
			cam3d.position.z += (playerPos.z + 8 - cam3d.position.z) * Math.min(8 * delta, 1);
			cam3d.position.y = 10;
			cam3d.lookAt(playerPos.x, 0, playerPos.z);
		}
	});

	let whaleGroup = $state<THREE.Group>();

	// Expose state for debugging/testing (onMount runs once, no re-renders)
	onMount(() => {
		(window as any).__joystick = setJoystick;
		(window as any).__gameState = game;
		return () => {
			delete (window as any).__joystick;
			delete (window as any).__gameState;
		};
	});
</script>

<!-- Ambient light -->
<T.AmbientLight intensity={0.4} />
<T.DirectionalLight position={[5, 12, 3]} intensity={1.2} castShadow={false} />
<T.HemisphereLight args={['#4488cc', '#112244', 0.6]} />

<!-- Ground -->
<T.Mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.05, 0]}>
	<T.PlaneGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
	{#if gridTexture}
		<T.MeshStandardMaterial map={gridTexture} color="#0d1b2a" roughness={0.8} metalness={0.1} />
	{:else}
		<T.MeshStandardMaterial color="#0d1b2a" roughness={0.8} metalness={0.1} />
	{/if}
</T.Mesh>

<!-- Ocean edge border -->
{#each [[0, WORLD_SIZE/2+0.25], [0, -WORLD_SIZE/2-0.25]] as [x, z]}
	<T.Mesh position={[x, -0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
		<T.PlaneGeometry args={[WORLD_SIZE + 2, 0.6]} />
		<T.MeshStandardMaterial color="#081420" roughness={0.3} metalness={0.5} />
	</T.Mesh>
{/each}
{#each [[WORLD_SIZE/2+0.25, 0], [-WORLD_SIZE/2-0.25, 0]] as [x, z]}
	<T.Mesh position={[x, -0.02, z]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
		<T.PlaneGeometry args={[WORLD_SIZE + 2, 0.6]} />
		<T.MeshStandardMaterial color="#081420" roughness={0.3} metalness={0.5} />
	</T.Mesh>
{/each}

<!-- Corner pillars -->
{#each [[WORLD_SIZE/2,WORLD_SIZE/2],[-WORLD_SIZE/2,WORLD_SIZE/2],[WORLD_SIZE/2,-WORLD_SIZE/2],[-WORLD_SIZE/2,-WORLD_SIZE/2]] as corner}
	{@const cx = corner[0]}
	{@const cz = corner[1]}
	<T.Mesh position={[cx, 0.5, cz]}>
		<T.CylinderGeometry args={[0.2, 0.3, 1.2, 8]} />
		<T.MeshStandardMaterial color="#1a3a5c" roughness={0.3} metalness={0.6} />
	</T.Mesh>
	<T.Mesh position={[cx, 1.1, cz]}>
		<T.SphereGeometry args={[0.2, 8, 8]} />
		<T.MeshBasicMaterial color="#5b8af7" />
	</T.Mesh>
{/each}

<!-- Player -->
<T.Group bind:ref={whaleGroup}>
	<Player {playerPos} onUpdate={() => {}} />
</T.Group>

<!-- Orbs -->
{#each game.orbs as orb (orb.id)}
	<Orb {orb} />
{/each}
