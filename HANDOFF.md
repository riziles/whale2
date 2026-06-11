# Whale Chaser — Handoff Notes

## Project Overview
SvelteKit + Threlte (Three.js) 3D browser game where you play as a whale chasing avatar orbs from Bluesky follows.

**Repo:** https://github.com/riziles/whale2  
**Dev:** `pnpm dev` (port 5399, Vite proxy for avatars)  
**Deploy:** GitHub Pages via Actions — live at `https://riziles.github.io/whale2/`

## Architecture
```
+page.svelte → Canvas → Scene.svelte (game loop)
                        ├── Player.svelte (whale model)
                        └── Orb.svelte (colored sphere + glow ring)
              → HUD.svelte (UI, avatar overlays, joystick, input form)

game.svelte.ts — shared state (GameStore with $state runes)
api.ts — Bluesky API helpers (resolveHandle, getFollows, getProfile)
```

## Key Technical Lessons

### 1. Threlte v8 camera access
`useThrelte().camera` returns a `CurrentWritable` store wrapper, NOT a Camera object.
Use `camera.current` to get the actual Camera. Never use `$derived(camera)` — doesn't work.
The explicit `<T.PerspectiveCamera bind:ref={camRef}>` is most reliable.

### 2. Svelte 5 reactivity with Threlte
- `$state(new Set())` does NOT work for keyboard input in useTask — use plain `Record<string, boolean>`
- `$state` wrapping `THREE.Texture` breaks Three.js rendering — keep textures as plain variables
- Props are read-only in Svelte 5! Mutating `orb.position.x` doesn't trigger reactivity.
  Fix: replace the whole object in the array: `game.orbs[i] = { ...orb, position: { x: newX, z: newZ } }`

### 3. Whale positioning (local vs world space)
Two nested `<T.Group>`: outer `whaleGroup` (position + rotation) and inner `whaleRef` (bob animation).
**Must set position on outer group in world space** — inner group is in rotated local space.
Setting local z when parent is rotated makes the whale move diagonally.

### 4. Rotation formula
Whale model faces +X. `rotation.y = Math.atan2(-dz, dx)` makes it face movement direction.

### 5. Avatar images from cdn.bsky.app
- `<img>` tags in DOM work without CORS when served from same origin or file://
- From `localhost`, CDN may throttle/block after many requests
- **Vite proxy** (`/avatar` → `cdn.bsky.app/img/avatar`) is the reliable dev fix
- Three.js `TextureLoader` always fails (CORS for WebGL) — don't bother

### 6. `<HTML>` component from @threlte/extras
Does NOT inherit parent `<T.Group>` world position for screen projection.
All sprites stack at the same screen position. Don't use for positioned UI.

### 7. CSS overlay approach (what works)
1. In Scene's `useTask`, project 3D world coords to screen using `camera.project()`
2. Store `screenX`, `screenY`, `behindCamera` on each orb object
3. Render CSS-positioned `<div>` overlays in HUD (outside Canvas) at those coords

### 8. Water rendering attempts (all failed)
- **CanvasTexture** with UV offset animation → texture never applied to material
- **ShaderMaterial** via `<T.ShaderMaterial>` → rendered white (GLSL version issue with r184 WebGL2)
- **Fallback**: dark navy `MeshStandardMaterial` with `color="#051020" metalness=0.5` — looks like dark water
- Gemini confirmed the dark ground reads as "very dark navy blue, almost black"

### 9. Playwright + Gemini for visual verification
```javascript
// Take screenshot
playwright-cli screenshot --filename=check.png

// Send to Gemini
const img = fs.readFileSync('check.png');
const base64 = img.toString('base64');
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [
      { text: 'Describe what you see in this screenshot' },
      { inline_data: { mime_type: 'image/png', data: base64 } }
    ]}]
  })
}).then(r => r.json()).then(d => console.log(d.candidates[0].content.parts[0].text));
```

### 10. Playwright CLI
```
playwright-cli open http://localhost:5399 --headed  # open browser
playwright-cli snapshot                              # capture page snapshot
playwright-cli click e13                             # click element by ref
playwright-cli keydown w / keyup w                   # hold/release key
playwright-cli screenshot --filename=out.png          # screenshot
playwright-cli eval "JS expression"                   # evaluate in page
playwright-cli close-all                              # close all browsers
```

## Current State
- ✅ WASD movement, whale faces direction, camera follows
- ✅ 10 colored orbs with avatar overlays at unique positions
- ✅ Orb AI: random wandering, flee from whale within 3 units
- ✅ Dark navy water-like ground
- ✅ Glowing corner pillars
- ✅ Score tracking, victory screen with collected avatars
- ✅ GitHub Pages deployment via Actions
- ✅ Playwright tests passing
- ⚠️ Water animation not yet implemented (all texture/shader attempts failed)
