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
	<!-- ── Body ── -->
	<!-- Main body - large elongated ellipsoid -->
	<T.Mesh scale={[3.5, 1.6, 1.8]}>
		<T.SphereGeometry args={[0.5, 32, 24]} />
		<T.MeshStandardMaterial color="#3a6090" roughness={0.28} metalness={0.35} />
	</T.Mesh>

	<!-- Upper body highlight -->
	<T.Mesh position={[0.05, 0.15, 0]} scale={[3.3, 1.2, 1.5]}>
		<T.SphereGeometry args={[0.5, 32, 24]} />
		<T.MeshStandardMaterial color="#4a78b0" roughness={0.22} metalness={0.4} />
	</T.Mesh>

	<!-- Lighter belly (countershading) -->
	<T.Mesh position={[-0.1, -0.45, 0]} scale={[2.6, 0.65, 1.2]}>
		<T.SphereGeometry args={[0.45, 20, 14]} />
		<T.MeshStandardMaterial color="#8ab8e0" roughness={0.5} metalness={0.05} />
	</T.Mesh>

	<!-- ── Head ── -->
	<!-- Snout -->
	<T.Mesh position={[1.4, 0.1, 0]} scale={[1.3, 1.0, 1.2]}>
		<T.SphereGeometry args={[0.35, 28, 20]} />
		<T.MeshStandardMaterial color="#3e6ea0" roughness={0.28} metalness={0.45} />
	</T.Mesh>

	<!-- Head top dome -->
	<T.Mesh position={[1.2, 0.4, 0]} scale={[1.1, 0.7, 0.9]}>
		<T.SphereGeometry args={[0.3, 20, 14]} />
		<T.MeshStandardMaterial color="#4488bb" roughness={0.25} metalness={0.45} />
	</T.Mesh>

	<!-- Mouth line -->
	<T.Mesh position={[1.75, -0.1, 0]} rotation={[0, 0, 0.12]} scale={[0.1, 0.015, 0.45]}>
		<T.BoxGeometry />
		<T.MeshBasicMaterial color="#081020" />
	</T.Mesh>

	<!-- ── Eyes ── -->
	<!-- Left eye -->
	<T.Mesh position={[1.3, 0.38, 0.42]}>
		<T.SphereGeometry args={[0.12, 12, 8]} />
		<T.MeshBasicMaterial color="white" />
	</T.Mesh>
	<T.Mesh position={[1.32, 0.38, 0.47]}>
		<T.SphereGeometry args={[0.06, 8, 6]} />
		<T.MeshBasicMaterial color="black" />
	</T.Mesh>
	<!-- Right eye -->
	<T.Mesh position={[1.3, 0.38, -0.42]}>
		<T.SphereGeometry args={[0.12, 12, 8]} />
		<T.MeshBasicMaterial color="white" />
	</T.Mesh>
	<T.Mesh position={[1.32, 0.38, -0.47]}>
		<T.SphereGeometry args={[0.06, 8, 6]} />
		<T.MeshBasicMaterial color="black" />
	</T.Mesh>

	<!-- ── Dorsal fin (triangular) ── -->
	<T.Mesh position={[-0.5, 0.6, 0]} rotation={[0, 0, -0.2]} scale={[0.3, 0.55, 0.12]}>
		<T.ConeGeometry args={[0.45, 0.9, 6, 2]} />
		<T.MeshStandardMaterial color="#2a4a70" roughness={0.2} metalness={0.6} />
	</T.Mesh>

	<!-- ── Blowhole ── -->
	<T.Mesh position={[0.75, 0.6, 0]} rotation={[0.3, 0, 0]} scale={[0.18, 0.1, 0.18]}>
		<T.CylinderGeometry args={[0.04, 0.06, 0.1, 8]} />
		<T.MeshStandardMaterial color="#0a1630" roughness={0.2} />
	</T.Mesh>

	<!-- ── Tail fluke (prominent bilobed horizontal) ── -->
	<T.Group position={[-1.8, 0, 0]}>
		<!-- Tail peduncle -->
		<T.Mesh position={[0.3, 0, 0]} scale={[0.5, 0.2, 0.22]}>
			<T.SphereGeometry args={[0.5, 12, 8]} />
			<T.MeshStandardMaterial color="#2a4870" roughness={0.2} metalness={0.55} />
		</T.Mesh>

		<!-- Left fluke lobe -->
		<T.Mesh position={[-0.2, 0, 0.5]} rotation={[0, 0, tailRotation * 0.3]} scale={[0.2, 0.05, 0.4]}>
			<T.BoxGeometry args={[1, 1, 2]} />
			<T.MeshStandardMaterial color="#204060" roughness={0.2} metalness={0.55} />
		</T.Mesh>

		<!-- Right fluke lobe -->
		<T.Mesh position={[-0.2, 0, -0.5]} rotation={[0, 0, tailRotation * 0.3]} scale={[0.2, 0.05, 0.4]}>
			<T.BoxGeometry args={[1, 1, 2]} />
			<T.MeshStandardMaterial color="#204060" roughness={0.2} metalness={0.55} />
		</T.Mesh>

		<!-- Center tail connector -->
		<T.Mesh position={[-0.05, 0, 0]} scale={[0.12, 0.05, 0.15]}>
			<T.BoxGeometry />
			<T.MeshStandardMaterial color="#204060" roughness={0.2} metalness={0.55} />
		</T.Mesh>
	</T.Group>

	<!-- ── Pectoral fins (flippers) ── -->
	<!-- Left flipper -->
	<T.Mesh position={[0.1, -0.22, 0.85]} rotation={[0.6, 0.1, 0.5]} scale={[0.12, 0.06, 0.5]}>
		<T.BoxGeometry args={[1, 1, 3]} />
		<T.MeshStandardMaterial color="#3a6090" roughness={0.26} metalness={0.4} />
	</T.Mesh>
	<!-- Right flipper -->
	<T.Mesh position={[0.1, -0.22, -0.85]} rotation={[-0.6, -0.1, 0.5]} scale={[0.12, 0.06, 0.5]}>
		<T.BoxGeometry args={[1, 1, 3]} />
		<T.MeshStandardMaterial color="#3a6090" roughness={0.26} metalness={0.4} />
	</T.Mesh>
</T.Group>
