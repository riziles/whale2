# Whale Chaser — Handoff Notes (Post mwr-3dwhales merge)

## Current State (main)
- **Deployed**: https://riziles.github.io/whale2/
- **Dev**: `pnpm dev` → http://localhost:5399
- **Branch**: main (freshly merged from mwr-3dwhales)

## Architecture
```
+page.svelte → Canvas → Scene.svelte (game loop, water shader, camera, AI)
              ├── Player.svelte (whale — GLB model or GeometricWhale)
              │   └── GeometricWhale.svelte (bulbous sphere-based whale)
              ├── Orb.svelte (colored sphere + glow ring per orb)
              └── HUD.svelte (input form, score, exit button, overlay, joystick)

game.svelte.ts — GameStore with $state runes, orb data, input keys, AI state
api.ts — Bluesky helpers (resolveHandle, getMutualFollows, getProfile)
```

## Whale Models — Two Styles

### 1. 3D GLB Model (default)
- Source: CC0 whale from Polygonal Mind (`CAIO_Whale_01.glb`, 414KB)
- Loaded via `@threlte/extras` `<GLTF>` component with `oncreate` callback
- Materials overridden to DeepSeek blue (`#3b82f6`) via `scene.traverse()`
- Snout compressed (vertex-level) to make it shorter/fatter
- Scale: `0.12, 0.18, 0.16` → ~17% of board width
- Rotation: `rotation.y = Math.PI / 2` maps model's +Z forward to game +X

### 2. Geometric/Bulbous Whale
- `GeometricWhale.svelte` — overlapping spheres, cones, boxes
- Retained from original code with DeepSeek blue palette
- Toggle between styles via `game.whaleStyle` ('model' | 'geometric')

## Key Lessons Learned

### Threlte v8 + Svelte 5 Gotchas
1. **Camera**: `useThrelte().camera` is a `CurrentWritable` wrapper — use `.current` for the actual Camera object
2. **Reactivity**: Mutating `orb.position.x` doesn't trigger Svelte 5 updates. Must replace the whole object in the array: `game.orbs[i] = { ...orb, position: { x: newX, z: newZ } }`
3. **$state breaks Three.js**: Wrapping `THREE.Texture` or `THREE.ShaderMaterial` in `$state()` causes rendering failures. Use plain variables.
4. **$state Set() broken**: Don't use for keyboard input. Use plain `Record<string, boolean>`
5. **onMount vs $effect**: `$effect` re-runs and can delete globals. Use `onMount` for one-time window property exposure (e.g., `window.__gameState`)

### GLB Model Integration
1. **Model orientation**: Always check bounding box to find the long axis. This model was 3.45 on Z, 1.27 on X
2. **Material override**: The original model rendered near-black/wireframe. Override materials with `scene.traverse()` + `child.material = new THREE.MeshStandardMaterial(...)`
3. **Snout shortening**: Vertex-level compression works well. Find X extent, compress vertices past 55% of the range
4. **Facing direction fix**: Model +Z → game +X needed `rotation.y = PI/2`. The parent `whaleGroup` rotates so its +X points to movement direction (via `atan2(-dz, dx)`)

### Water Shader
- `ShaderMaterial` with world-space wave functions works (not CanvasTexture, not MeshStandardMaterial offset animation)
- CRITICAL: On a horizontally rotated plane, use `vWorldPos.x` and `vWorldPos.z` (NOT `.y` which is always 0)
- Created via `new THREE.ShaderMaterial({uniforms, vertexShader, fragmentShader})` BEFORE the template, passed via `<T is={material} />`
- Animated in `useTask` by updating `uniforms.uTime.value`
- Gemini confirmed: "organic, water-like or liquid texture... cloud-like luminous patches"

### Playwright + Gemini Workflow
```js
// 1. Start dev server: pnpm dev (port 5399)
// 2. Open browser:
playwright-cli open http://localhost:5399
// 3. Interact:
playwright-cli click e13           // click Go
playwright-cli keydown w           // move forward
playwright-cli screenshot --filename=test.png
// 4. Verify with Gemini:
const img = fs.readFileSync('test.png');
const b64 = img.toString('base64');
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts: [
    { text: 'Describe what you see' },
    { inline_data: { mime_type: 'image/png', data: b64 } }
  ]}] })
}).then(r => r.json()).then(d => console.log(d.candidates[0].content.parts[0].text));
```
- Headed mode: `playwright-cli open http://localhost:5399 --headed` — shows the browser window so a human can see alongside
- Gemini IS useful for visual verification — catches invisible whales, wrong axis shaders, correct direction, etc.

### A11y in Svelte 5
- Svelte 5 changed warning codes to snake_case and requires **separate** `svelte-ignore` comments per rule (comma-separated no longer works in runes mode)
- Better approach: use proper ARIA attributes (`role="radio"`, `aria-checked`, `role="radiogroup"`) instead of ignoring warnings
- `<button type="button" role="radio">` passes all checks without any `svelte-ignore`

### Bluesky API
- Mutual follows: `getMutualFollows()` fetches user's follows, then for each checks if they follow back by scanning their follow list
- Runs in batches of 20 concurrent, stops at limit
- All public API — no auth needed
- User must wait for the batch checks (can be slow for accounts with many follows)

### CSS/HUD
- `.hud` has `pointer-events: none` — every interactive child needs explicit `pointer-events: auto`
- Avatar overlays at `z-index: 40`, HUD at `z-index: 50`
- Joystick at `z-index: 60`

## Post-compaction Ideas
- [ ] Blowhole particle/spray effect when whale moves
- [ ] Sound effects (orb collection, victory)
- [ ] Orb color coding by category
- [ ] Mobile performance optimization
- [ ] Better victory screen animations
- [ ] Allow custom avatar/name for the player
- [ ] Add multiple difficulty levels (faster orbs, smaller collision radius)
- [ ] Rate limiting / caching for Bluesky API calls
- [ ] Service worker for offline support (partial)
