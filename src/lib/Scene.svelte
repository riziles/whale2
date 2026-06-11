<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import { game, inputKeys, orbVelocities } from './game.svelte';
	import Player from './Player.svelte';
	import Orb from './Orb.svelte';

	interactivity();

	const { camera } = useThrelte();

	// World bounds
	const WORLD_SIZE = 14;
	const PLAYER_SPEED = 6;

	// Player movement
	let playerPos = $state({ x: 0, z: 0 });

	// Joystick
	let joystickX = $state(0);
	let joystickY = $state(0);

	// ── Animated water via ShaderMaterial ──
	const waterUniforms = {
		uTime: new THREE.Uniform(0),
		uColorDeep: new THREE.Uniform(new THREE.Color('#030d1a')),
		uColorShallow: new THREE.Uniform(new THREE.Color('#0a2a4a')),
		uColorHighlight: new THREE.Uniform(new THREE.Color('#1a4a7a'))
	};

	const waterVertexShader = /* glsl */ `
		varying vec2 vUv;
		varying vec3 vWorldPos;
		void main() {
			vec4 worldPos = modelMatrix * vec4(position, 1.0);
			vWorldPos = worldPos.xyz;
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`;

	const waterFragmentShader = /* glsl */ `
		varying vec2 vUv;
		varying vec3 vWorldPos;
		uniform float uTime;
		uniform vec3 uColorDeep;
		uniform vec3 uColorShallow;
		uniform vec3 uColorHighlight;

		void main() {
			// Use world XZ (the rotated plane) and uv for patterns
			float wx = vWorldPos.x * 0.6;
			float wy = vWorldPos.z * 0.6;

			// Large rolling waves
			float wave1 = sin(wx + uTime * 0.6) * cos(wy + uTime * 0.4) * 0.35;
			float wave2 = sin(wx * 1.5 - uTime * 0.5) * cos(wy * 1.3 + uTime * 0.7) * 0.25;

			// Fine ripples
			float ripple1 = sin(wx * 3.0 + uTime * 1.2) * cos(wy * 2.5 - uTime * 0.9) * 0.1;
			float ripple2 = sin((wx + wy) * 4.0 + uTime * 1.8) * 0.08;
			float ripple3 = sin(wx * 6.0 - uTime * 2.0) * cos(wy * 5.0 + uTime * 1.5) * 0.06;

			float pattern = wave1 + wave2 + ripple1 + ripple2 + ripple3;

			// Edge fade
			float borderDist = max(abs(vWorldPos.x), abs(vWorldPos.z)) / 8.0;
			float edgeFade = smoothstep(0.7, 1.0, borderDist);

			vec3 color = mix(uColorDeep, uColorShallow, pattern * 0.7 + 0.3);
			// Highlight wave crests
			float crest = smoothstep(0.15, 0.28, pattern);
			color = mix(color, uColorHighlight, crest * 0.4);
			// Darken at edges
			color = mix(color, uColorDeep, edgeFade * 0.5);

			gl_FragColor = vec4(color, 1.0);
		}
	`;

	const waterMat = new THREE.ShaderMaterial({
		uniforms: waterUniforms,
		vertexShader: waterVertexShader,
		fragmentShader: waterFragmentShader
	});

	// Joystick input callback
	function setJoystick(x: number, y: number) {
		joystickX = x;
		joystickY = y;
	}

	// Main game loop
	useTask((delta) => {
		if (game.state !== 'playing') return;

		// Animate water shader
		waterUniforms.uTime.value += delta;

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
			whaleGroup.rotation.y = Math.atan2(-dz, dx);
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
			if (dist < 1.5) game.collectOrb(orb.id);
		}

		game.playerPosition = { ...playerPos };

		// Orb AI movement
		const ORB_SPEED = 2;
		for (let i = 0; i < game.orbs.length; i++) {
			const orb = game.orbs[i];
			if (orb.collected) continue;

			// Init velocity if new
			if (!orbVelocities[i]) {
				const angle = Math.random() * Math.PI * 2;
				orbVelocities[i] = { vx: Math.cos(angle), vz: Math.sin(angle), timer: 0 };
			}

			const vel = orbVelocities[i];
			vel.timer -= delta;

			// Change direction every 1-3 seconds
			if (vel.timer <= 0) {
				const angle = Math.random() * Math.PI * 2;
				vel.vx = Math.cos(angle);
				vel.vz = Math.sin(angle);
				vel.timer = 1 + Math.random() * 2;
			}

			// Flee from whale if close
			const dx = orb.position.x - playerPos.x;
			const dz = orb.position.z - playerPos.z;
			const dist = Math.sqrt(dx * dx + dz * dz);
			if (dist < 3) {
				vel.vx = dx / dist;
				vel.vz = dz / dist;
				vel.timer = 0.5;
			}

			// Move orb
			const nx = orb.position.x + vel.vx * ORB_SPEED * delta;
			const nz = orb.position.z + vel.vz * ORB_SPEED * delta;
			const hw = WORLD_SIZE / 2 - 1.5;
			const cx = Math.max(-hw, Math.min(hw, nx));
			const cz = Math.max(-hw, Math.min(hw, nz));
			// Replace orb to trigger Svelte reactivity
			game.orbs[i] = { ...orb, position: { x: cx, z: cz } };
		}

		// Camera follow
		const cam3d = camera.current;
		if (cam3d) {
			cam3d.position.x += (playerPos.x - cam3d.position.x) * Math.min(8 * delta, 1);
			cam3d.position.z += (playerPos.z + 4 - cam3d.position.z) * Math.min(6 * delta, 1);
			cam3d.position.y = 5;
			cam3d.lookAt(playerPos.x, 0, playerPos.z);

			// Screen projection for avatar overlays
			for (const orb of game.orbs) {
				if (orb.collected) continue;
				const wp = new THREE.Vector3(orb.position.x, 1.5, orb.position.z);
				const sp = wp.clone().project(cam3d);
				orb.screenX = (sp.x * 0.5 + 0.5) * window.innerWidth;
				orb.screenY = (-sp.y * 0.5 + 0.5) * window.innerHeight;
				orb.behindCamera = sp.z > 1;
			}
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

<!-- Animated water ground -->
<T.Mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
	<T.PlaneGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
	<T is={waterMat} />
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
