<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import { game } from './game.svelte';
	import Player from './Player.svelte';
	import Orb from './Orb.svelte';

	interactivity();

	const { camera, renderer } = useThrelte();

	// World bounds
	const WORLD_SIZE = 14;
	const PLAYER_SPEED = 6;

	// Player movement
	let playerPos = $state({ x: 0, z: 0 });
	let moveDirection = $state({ x: 0, z: 0 });

	// Input state
	let keys = $state(new Set<string>());
	let joystickActive = $state(false);
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

	// Keyboard handling
	function onKeyDown(e: KeyboardEvent) {
		keys.add(e.key.toLowerCase());
	}
	function onKeyUp(e: KeyboardEvent) {
		keys.delete(e.key.toLowerCase());
	}

	// Joystick input callback
	function setJoystick(x: number, y: number) {
		joystickX = x;
		joystickY = y;
	}

	// Update player position and collision
	useTask((delta) => {
		if (game.state !== 'playing') return;

		// Combine keyboard and joystick input
		let dx = 0;
		let dz = 0;

		// Keyboard
		if (keys.has('w') || keys.has('arrowup')) dz -= 1;
		if (keys.has('s') || keys.has('arrowdown')) dz += 1;
		if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
		if (keys.has('d') || keys.has('arrowright')) dx += 1;

		// Joystick
		dx += joystickX;
		dz += joystickY;

		// Normalize
		const len = Math.sqrt(dx * dx + dz * dz);
		if (len > 1) {
			dx /= len;
			dz /= len;
		}

		// Move player
		const dt = Math.min(delta, 0.1); // Cap delta for safety
		playerPos.x += dx * PLAYER_SPEED * dt;
		playerPos.z += dz * PLAYER_SPEED * dt;

		// Clamp to world bounds
		playerPos.x = Math.max(-WORLD_SIZE / 2 + 1, Math.min(WORLD_SIZE / 2 - 1, playerPos.x));
		playerPos.z = Math.max(-WORLD_SIZE / 2 + 1, Math.min(WORLD_SIZE / 2 - 1, playerPos.z));

		// Rotate whale to face movement direction
		if (len > 0.1) {
			const angle = Math.atan2(dx, dz);
			if (whaleGroup) {
				whaleGroup.rotation.y = angle;
			}
		}

		// Collision detection with orbs
		for (const orb of game.orbs) {
			if (orb.collected) continue;
			const dist = Math.sqrt(
				(playerPos.x - orb.position.x) ** 2 + (playerPos.z - orb.position.z) ** 2
			);
			if (dist < 1.0) {
				game.collectOrb(orb.id);
			}
		}

		// Update game state
		game.playerPosition = { ...playerPos };

		// Camera follow
		if (camera) {
			camera.position.x += (playerPos.x - camera.position.x) * 3 * dt;
			camera.position.z += (playerPos.z + 8 - camera.position.z) * 3 * dt;
			camera.position.y = 10;
			camera.lookAt(playerPos.x, 0, playerPos.z);
		}
	});

	let whaleGroup = $state<THREE.Group>();

	// Expose joystick handler globally
	$effect(() => {
		(window as any).__joystick = setJoystick;
		return () => {
			delete (window as any).__joystick;
		};
	});
</script>

<svelte:window onkeydown={onKeyDown} onkeyup={onKeyUp} />

<!-- Ambient light -->
<T.AmbientLight intensity={0.4} />

<!-- Directional light (sun) -->
<T.DirectionalLight
	position={[5, 12, 3]}
	intensity={1.2}
	castShadow={false}
/>

<!-- Hemisphere light for sky/ground color -->
<T.HemisphereLight
	args={['#4488cc', '#112244', 0.6]}
/>

<!-- Ground -->
<T.Mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.05, 0]}>
	<T.PlaneGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
	{#if gridTexture}
		<T.MeshStandardMaterial
			map={gridTexture}
			color="#0d1b2a"
			roughness={0.8}
			metalness={0.1}
		/>
	{:else}
		<T.MeshStandardMaterial color="#0d1b2a" roughness={0.8} metalness={0.1} />
	{/if}
</T.Mesh>

<!-- Ocean edge border -->
<T.Mesh position={[0, -0.02, WORLD_SIZE / 2 + 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
	<T.PlaneGeometry args={[WORLD_SIZE + 2, 0.6]} />
	<T.MeshStandardMaterial color="#081420" roughness={0.3} metalness={0.5} />
</T.Mesh>
<T.Mesh position={[0, -0.02, -WORLD_SIZE / 2 - 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
	<T.PlaneGeometry args={[WORLD_SIZE + 2, 0.6]} />
	<T.MeshStandardMaterial color="#081420" roughness={0.3} metalness={0.5} />
</T.Mesh>
<T.Mesh position={[WORLD_SIZE / 2 + 0.25, -0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
	<T.PlaneGeometry args={[WORLD_SIZE + 2, 0.6]} />
	<T.MeshStandardMaterial color="#081420" roughness={0.3} metalness={0.5} />
</T.Mesh>
<T.Mesh position={[-WORLD_SIZE / 2 - 0.25, -0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
	<T.PlaneGeometry args={[WORLD_SIZE + 2, 0.6]} />
	<T.MeshStandardMaterial color="#081420" roughness={0.3} metalness={0.5} />
</T.Mesh>

<!-- Corner pillars -->
{#each [
	[WORLD_SIZE / 2, WORLD_SIZE / 2],
	[-WORLD_SIZE / 2, WORLD_SIZE / 2],
	[WORLD_SIZE / 2, -WORLD_SIZE / 2],
	[-WORLD_SIZE / 2, -WORLD_SIZE / 2]
] as corner}
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

<!-- Player (whale) -->
<T.Group bind:ref={whaleGroup}>
	<Player {playerPos} onUpdate={() => {}} />
</T.Group>

<!-- Orbs -->
{#each game.orbs as orb (orb.id)}
	<Orb {orb} />
{/each}
