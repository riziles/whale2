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
		if (whaleRef) {
			// Only handle bob — position is set by parent via whaleGroup
			whaleRef.position.y = bobOffset;
		}
	});

	// Tail wagging
	let tailRotation = $state(0);
	useTask((delta) => {
		tailRotation = Math.sin(Date.now() * 0.008) * 0.3;
	});
</script>

<T.Group bind:ref={whaleRef}>
	<!-- Body - elongated overlapping ellipsoids -->
	<T.Mesh position={[0, 0, 0]} scale={[1.5, 0.85, 0.9]}>
		<T.SphereGeometry args={[0.5, 32, 24]} />
		<T.MeshStandardMaterial color="#2563eb" roughness={0.3} metalness={0.35} />
	</T.Mesh>
	<T.Mesh position={[-0.2, 0, 0]} scale={[1.4, 0.78, 0.8]}>
		<T.SphereGeometry args={[0.5, 32, 24]} />
		<T.MeshStandardMaterial color="#1d4ed8" roughness={0.25} metalness={0.4} />
	</T.Mesh>

	<!-- Head snout -->
	<T.Mesh position={[0.55, 0.05, 0]} scale={[0.8, 0.65, 0.7]}>
		<T.SphereGeometry args={[0.4, 24, 16]} />
		<T.MeshStandardMaterial color="#1e40af" roughness={0.25} metalness={0.45} />
	</T.Mesh>
	<!-- Head top dome -->
	<T.Mesh position={[0.45, 0.22, 0]} scale={[0.6, 0.5, 0.55]}>
		<T.SphereGeometry args={[0.35, 20, 14]} />
		<T.MeshStandardMaterial color="#2563eb" roughness={0.25} metalness={0.45} />
	</T.Mesh>

	<!-- Mouth line -->
	<T.Mesh position={[0.82, -0.05, 0]} rotation={[0, 0, 0.15]} scale={[0.07, 0.015, 0.22]}>
		<T.BoxGeometry />
		<T.MeshBasicMaterial color="#0a1530" />
	</T.Mesh>

	<!-- Eyes -->
	<T.Mesh position={[0.65, 0.18, 0.22]}>
		<T.SphereGeometry args={[0.08, 12, 8]} />
		<T.MeshBasicMaterial color="white" />
	</T.Mesh>
	<T.Mesh position={[0.66, 0.18, 0.25]}>
		<T.SphereGeometry args={[0.04, 8, 6]} />
		<T.MeshBasicMaterial color="black" />
	</T.Mesh>
	<T.Mesh position={[0.65, 0.18, -0.22]}>
		<T.SphereGeometry args={[0.08, 12, 8]} />
		<T.MeshBasicMaterial color="white" />
	</T.Mesh>
	<T.Mesh position={[0.66, 0.18, -0.25]}>
		<T.SphereGeometry args={[0.04, 8, 6]} />
		<T.MeshBasicMaterial color="black" />
	</T.Mesh>

	<!-- Tail - upper -->
	<T.Mesh position={[-0.65, 0.15, 0]} rotation={[0, 0, tailRotation]} scale={[0.4, 0.22, 1]}>
		<T.ConeGeometry args={[0.25, 0.5, 8, 1]} />
		<T.MeshStandardMaterial color="#1e3a8a" roughness={0.2} metalness={0.55} />
	</T.Mesh>
	<!-- Tail - lower -->
	<T.Mesh position={[-0.65, -0.05, 0]} rotation={[0, 0, -tailRotation]} scale={[0.4, 0.22, 1]}>
		<T.ConeGeometry args={[0.25, 0.5, 8, 1]} />
		<T.MeshStandardMaterial color="#1e3a8a" roughness={0.2} metalness={0.55} />
	</T.Mesh>

	<!-- Flippers -->
	<T.Mesh position={[-0.1, -0.15, 0.45]} rotation={[0.4, 0, 0]} scale={[0.15, 0.06, 0.35]}>
		<T.BoxGeometry />
		<T.MeshStandardMaterial color="#1e40af" roughness={0.28} metalness={0.45} />
	</T.Mesh>
	<T.Mesh position={[-0.1, -0.15, -0.45]} rotation={[-0.4, 0, 0]} scale={[0.15, 0.06, 0.35]}>
		<T.BoxGeometry />
		<T.MeshStandardMaterial color="#1e40af" roughness={0.28} metalness={0.45} />
	</T.Mesh>

	<!-- Belly lighter patch -->
	<T.Mesh position={[-0.05, -0.25, 0]} scale={[0.8, 0.25, 0.55]}>
		<T.SphereGeometry args={[0.4, 16, 12]} />
		<T.MeshStandardMaterial color="#60a5fa" roughness={0.5} metalness={0.1} />
	</T.Mesh>

	<!-- Blowhole -->
	<T.Mesh position={[0.3, 0.28, 0]} scale={[0.12, 0.08, 0.12]}>
		<T.CylinderGeometry args={[0.05, 0.08, 0.12, 8]} />
		<T.MeshStandardMaterial color="#172554" roughness={0.2} />
	</T.Mesh>
</T.Group>
