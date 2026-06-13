<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { GLTF } from '@threlte/extras';
	import * as THREE from 'three';
	import { game } from './game.svelte';
	import GeometricWhale from './GeometricWhale.svelte';

	let { playerPos, onUpdate }: { playerPos: { x: number; z: number }; onUpdate: (pos: { x: number; z: number }) => void } = $props();

	let whaleRef = $state<THREE.Group>();

	useTask((delta) => {
		if (whaleRef) whaleRef.position.y = Math.sin(Date.now() * 0.003) * 0.15;
	});

	const WHALE_URL = 'https://raw.githubusercontent.com/ToxSam/cc0-models-Polygonal-Mind/main/projects/ca-world/CAIO_Whale_01.glb';

	function onWhaleLoaded(scene: THREE.Group) {
		scene.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.material = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3, metalness: 0.25 });
			}
		});

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
						pos.setX(i, snoutStart + (x - snoutStart) * (1 - compression * t));
					}
				}
				pos.needsUpdate = true;
				child.geometry.computeVertexNormals();
			}
		});

		scene.scale.set(0.12, 0.18, 0.16);
		scene.rotation.y = Math.PI / 2;
	}
</script>

<T.Group bind:ref={whaleRef}>
	{#if game.whaleStyle === 'model'}
		<GLTF url={WHALE_URL} oncreate={onWhaleLoaded} />
	{:else}
		<GeometricWhale />
	{/if}
</T.Group>
