<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { GLTF } from '@threlte/extras';
	import * as THREE from 'three';

	const { playerPos, onUpdate } = $props<{
		playerPos: { x: number; z: number };
		onUpdate: (pos: { x: number; z: number }) => void;
	}>();

	let whaleRef = $state<THREE.Group>();

	// Bobbing animation
	useTask((delta) => {
		if (whaleRef) {
			whaleRef.position.y = Math.sin(Date.now() * 0.003) * 0.15;
		}
	});

	const WHALE_URL = 'https://raw.githubusercontent.com/ToxSam/cc0-models-Polygonal-Mind/main/projects/ca-world/CAIO_Whale_01.glb';

	function onWhaleLoaded(scene: THREE.Group) {
		// Override materials with DeepSeek blue
		scene.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.material = new THREE.MeshStandardMaterial({
					color: 0x3b82f6,
					roughness: 0.3,
					metalness: 0.25
				});
			}
		});

		// Shorten the snout
		let minX = Infinity, maxX = -Infinity;
		scene.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				const pos = child.geometry.attributes.position;
				for (let i = 0; i < pos.count; i++) {
					const x = pos.getX(i);
					if (x < minX) minX = x;
					if (x > maxX) maxX = x;
				}
			}
		});

		const snoutStart = minX + (maxX - minX) * 0.55;
		const compression = 0.45;
		scene.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				const pos = child.geometry.attributes.position;
				for (let i = 0; i < pos.count; i++) {
					const x = pos.getX(i);
					if (x > snoutStart) {
						const t = (x - snoutStart) / (maxX - snoutStart);
						const newX = snoutStart + (x - snoutStart) * (1 - compression * t);
						pos.setX(i, newX);
					}
				}
				pos.needsUpdate = true;
				child.geometry.computeVertexNormals();
			}
		});

		// Scale to game size (fit ~15% of board)
		scene.scale.set(0.12, 0.18, 0.16);

		// Rotate so the whale faces +X (local forward = game forward)
		// Most GLB models face +Z; we need +X, so rotate -90° around Y
		scene.rotation.y = -Math.PI / 2;
	}
</script>

<T.Group bind:ref={whaleRef}>
	<GLTF
		url={WHALE_URL}
		oncreate={onWhaleLoaded}
	/>
</T.Group>
