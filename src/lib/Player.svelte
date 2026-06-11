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
		<T.MeshStandardMaterial color="#7088a0" roughness={0.3} metalness={0.3} />
	</T.Mesh>

	<!-- Upper body highlight - darker ridge -->
	<T.Mesh position={[0.05, 0.2, 0]} scale={[3.3, 1.1, 1.4]}>
		<T.SphereGeometry args={[0.5, 32, 24]} />
		<T.MeshStandardMaterial color="#506888" roughness={0.25} metalness={0.35} />
	</T.Mesh>

	<!-- Lighter belly (strong countershading) -->
	<T.Mesh position={[-0.1, -0.45, 0]} scale={[2.6, 0.65, 1.2]}>
		<T.SphereGeometry args={[0.45, 20, 14]} />
		<T.MeshStandardMaterial color="#c8d8e8" roughness={0.5} metalness={0.05} />
	</T.Mesh>

	<!-- ── Head ── -->
	<T.Mesh position={[1.4, 0.1, 0]} scale={[1.3, 1.0, 1.2]}>
		<T.SphereGeometry args={[0.35, 28, 20]} />
		<T.MeshStandardMaterial color="#6880a0" roughness={0.3} metalness={0.35} />
	</T.Mesh>

	<T.Mesh position={[1.2, 0.4, 0]} scale={[1.1, 0.7, 0.9]}>
		<T.SphereGeometry args={[0.3, 20, 14]} />
		<T.MeshStandardMaterial color="#607898" roughness={0.28} metalness={0.35} />
	</T.Mesh>

	<!-- Mouth line -->
	<T.Mesh position={[1.75, -0.1, 0]} rotation={[0, 0, 0.12]} scale={[0.1, 0.015, 0.45]}>
		<T.BoxGeometry />
		<T.MeshBasicMaterial color="#081020" />
	</T.Mesh>

	<!-- ── Eyes ── -->
	<T.Mesh position={[1.3, 0.38, 0.42]}>
		<T.SphereGeometry args={[0.12, 12, 8]} />
		<T.MeshBasicMaterial color="white" />
	</T.Mesh>
	<T.Mesh position={[1.32, 0.38, 0.47]}>
		<T.SphereGeometry args={[0.06, 8, 6]} />
		<T.MeshBasicMaterial color="black" />
	</T.Mesh>
	<T.Mesh position={[1.3, 0.38, -0.42]}>
		<T.SphereGeometry args={[0.12, 12, 8]} />
		<T.MeshBasicMaterial color="white" />
	</T.Mesh>
	<T.Mesh position={[1.32, 0.38, -0.47]}>
		<T.SphereGeometry args={[0.06, 8, 6]} />
		<T.MeshBasicMaterial color="black" />
	</T.Mesh>

	<!-- ── Dorsal fin ── -->
	<T.Mesh position={[-0.5, 0.6, 0]} rotation={[0, 0, -0.2]} scale={[0.3, 0.55, 0.12]}>
		<T.ConeGeometry args={[0.45, 0.9, 6, 2]} />
		<T.MeshStandardMaterial color="#405870" roughness={0.22} metalness={0.5} />
	</T.Mesh>

	<!-- ── Blowhole ── -->
	<T.Mesh position={[0.75, 0.6, 0]} rotation={[0.3, 0, 0]} scale={[0.18, 0.1, 0.18]}>
		<T.CylinderGeometry args={[0.04, 0.06, 0.1, 8]} />
		<T.MeshStandardMaterial color="#203040" roughness={0.2} />
	</T.Mesh>

	<!-- ── Tail fluke (broad crescent shape) ── -->
	<T.Group position={[-1.8, 0.05, 0]}>
		<!-- Tail peduncle -->
		<T.Mesh position={[0.3, 0, 0]} scale={[0.5, 0.18, 0.2]}>
			<T.SphereGeometry args={[0.5, 12, 8]} />
			<T.MeshStandardMaterial color="#485868" roughness={0.22} metalness={0.45} />
		</T.Mesh>

		<!-- Left fluke lobe - broad and swept back -->
		<T.Mesh position={[-0.15, 0, 0.55]} rotation={[0, tailRotation * 0.3, 0.4]} scale={[0.15, 0.04, 0.5]}>
			<T.BoxGeometry args={[1, 1, 2.5]} />
			<T.MeshStandardMaterial color="#385068" roughness={0.22} metalness={0.45} />
		</T.Mesh>

		<!-- Right fluke lobe - broad and swept back -->
		<T.Mesh position={[-0.15, 0, -0.55]} rotation={[0, -tailRotation * 0.3, -0.4]} scale={[0.15, 0.04, 0.5]}>
			<T.BoxGeometry args={[1, 1, 2.5]} />
			<T.MeshStandardMaterial color="#385068" roughness={0.22} metalness={0.45} />
		</T.Mesh>

		<!-- Center notch (cuts into the fluke to make it bilobed) -->
		<T.Mesh position={[-0.25, 0, 0]} scale={[0.08, 0.04, 0.08]}>
			<T.BoxGeometry />
			<T.MeshStandardMaterial color="#385068" roughness={0.22} metalness={0.45} />
		</T.Mesh>
	</T.Group>

	<!-- ── Pectoral fins ── -->
	<T.Mesh position={[0.1, -0.22, 0.85]} rotation={[0.6, 0.1, 0.5]} scale={[0.12, 0.06, 0.5]}>
		<T.BoxGeometry args={[1, 1, 3]} />
		<T.MeshStandardMaterial color="#4a6090" roughness={0.28} metalness={0.35} />
	</T.Mesh>
	<T.Mesh position={[0.1, -0.22, -0.85]} rotation={[-0.6, -0.1, 0.5]} scale={[0.12, 0.06, 0.5]}>
		<T.BoxGeometry args={[1, 1, 3]} />
		<T.MeshStandardMaterial color="#4a6090" roughness={0.28} metalness={0.35} />
	</T.Mesh>
</T.Group>
