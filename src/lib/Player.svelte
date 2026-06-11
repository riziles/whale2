<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { game } from './game.svelte';

	const { playerPos, onUpdate } = $props<{
		playerPos: { x: number; z: number };
		onUpdate: (pos: { x: number; z: number }) => void;
	}>();

	let whaleRef = $state<THREE.Group>();

	// Bobbing animation
	let bobOffset = $state(0);
	useTask((delta) => {
		bobOffset = Math.sin(Date.now() * 0.003) * 0.15;
		// Rotate slightly based on movement direction for a "swimming" feel
		if (whaleRef) {
			whaleRef.position.x = playerPos.x;
			whaleRef.position.z = playerPos.z;
			whaleRef.position.y = 0.6 + bobOffset;
		}
	});

	// Tail wagging
	let tailRotation = $state(0);
	useTask((delta) => {
		tailRotation = Math.sin(Date.now() * 0.008) * 0.3;
	});
</script>

<T.Group bind:ref={whaleRef}>
	<!-- Body - elongated sphere -->
	<T.Mesh position={[0, 0, 0]}>
		<T.SphereGeometry args={[0.5, 32, 24]} />
		<T.MeshStandardMaterial color="#1a3a5c" roughness={0.4} metalness={0.3} />
	</T.Mesh>
	<T.Mesh position={[-0.15, 0, 0]} scale={[1.4, 0.85, 0.85]}>
		<T.SphereGeometry args={[0.5, 32, 24]} />
		<T.MeshStandardMaterial color="#1e4a78" roughness={0.3} metalness={0.4} />
	</T.Mesh>

	<!-- Head bump -->
	<T.Mesh position={[0.55, 0.05, 0]} scale={[0.8, 0.7, 0.7]}>
		<T.SphereGeometry args={[0.4, 24, 16]} />
		<T.MeshStandardMaterial color="#15305a" roughness={0.3} metalness={0.5} />
	</T.Mesh>

	<!-- Tail - upper -->
	<T.Mesh position={[-0.65, 0.15, 0]} rotation={[0, 0, tailRotation]} scale={[0.4, 0.25, 1]}>
		<T.ConeGeometry args={[0.25, 0.5, 8, 1]} />
		<T.MeshStandardMaterial color="#0d2240" roughness={0.2} metalness={0.6} />
	</T.Mesh>
	<!-- Tail - lower -->
	<T.Mesh position={[-0.65, -0.05, 0]} rotation={[0, 0, -tailRotation]} scale={[0.4, 0.25, 1]}>
		<T.ConeGeometry args={[0.25, 0.5, 8, 1]} />
		<T.MeshStandardMaterial color="#0d2240" roughness={0.2} metalness={0.6} />
	</T.Mesh>

	<!-- Flippers -->
	<T.Mesh position={[-0.1, -0.15, 0.45]} rotation={[0.4, 0, 0]} scale={[0.15, 0.06, 0.35]}>
		<T.BoxGeometry />
		<T.MeshStandardMaterial color="#15305a" roughness={0.3} metalness={0.4} />
	</T.Mesh>
	<T.Mesh position={[-0.1, -0.15, -0.45]} rotation={[-0.4, 0, 0]} scale={[0.15, 0.06, 0.35]}>
		<T.BoxGeometry />
		<T.MeshStandardMaterial color="#15305a" roughness={0.3} metalness={0.4} />
	</T.Mesh>

	<!-- Eyes -->
	<T.Mesh position={[0.65, 0.15, 0.2]}>
		<T.SphereGeometry args={[0.08, 12, 8]} />
		<T.MeshBasicMaterial color="white" />
	</T.Mesh>
	<T.Mesh position={[0.65, 0.15, 0.22]}>
		<T.SphereGeometry args={[0.04, 8, 6]} />
		<T.MeshBasicMaterial color="black" />
	</T.Mesh>
	<T.Mesh position={[0.65, 0.15, -0.2]}>
		<T.SphereGeometry args={[0.08, 12, 8]} />
		<T.MeshBasicMaterial color="white" />
	</T.Mesh>
	<T.Mesh position={[0.65, 0.15, -0.22]}>
		<T.SphereGeometry args={[0.04, 8, 6]} />
		<T.MeshBasicMaterial color="black" />
	</T.Mesh>

	<!-- Mouth / smile line -->
	<T.Mesh position={[0.85, 0.0, 0]} rotation={[0, 0, 0.2]} scale={[0.08, 0.015, 0.2]}>
		<T.BoxGeometry />
		<T.MeshBasicMaterial color="#0a1a30" />
	</T.Mesh>

	<!-- Belly lighter patch -->
	<T.Mesh position={[-0.05, -0.25, 0]} scale={[0.8, 0.3, 0.55]}>
		<T.SphereGeometry args={[0.4, 16, 12]} />
		<T.MeshStandardMaterial color="#3a6a9a" roughness={0.5} metalness={0.1} />
	</T.Mesh>

	<!-- Blowhole -->
	<T.Mesh position={[0.3, 0.28, 0]} scale={[0.15, 0.1, 0.15]}>
		<T.CylinderGeometry args={[0.05, 0.08, 0.12, 8]} />
		<T.MeshStandardMaterial color="#0d2240" roughness={0.2} />
	</T.Mesh>
</T.Group>
