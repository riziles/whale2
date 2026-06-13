<script lang="ts">
	import { game } from './game.svelte';
	import { resolveHandle, getMutualFollows, getProfile, avatarUrl } from './api';
	import { onMount } from 'svelte';

	let handleInput = $state('norvid-studies.bsky.social');
	let loading = $state(false);

	async function startGame() {
		if (!handleInput.trim()) return;
		loading = true;
		game.error = '';
		try {
			let handle = handleInput.trim().replace(/^@/, '');
			game.handle = handle;
			game.state = 'loading';

			const did = await resolveHandle(handle);
			const follows = await getMutualFollows(did, 10);

			if (follows.length === 0) {
				game.error = 'No mutual follows found. Try a different handle.';
				game.state = 'input';
				loading = false;
				return;
			}

			try {
				const profile = await getProfile(did);
				game.playerName = profile.displayName || profile.handle;
				game.playerAvatar = profile.avatar;
			} catch {
				game.playerName = handle;
			}

			const count = Math.min(follows.length, 10);
			game.orbs = follows.slice(0, count).map((profile, i) => {
				const angle = (i / count) * Math.PI * 2;
				const radius = 2 + (i % 3) * 2;
				return {
					id: i,
					profile,
					position: {
						x: Math.cos(angle) * radius,
						z: Math.sin(angle) * radius
					},
					collected: false,
					textureUrl: profile.avatar || null,
					screenX: 0,
					screenY: 0,
					behindCamera: false
				};
			});

			game.targetOrbs = game.orbs.length;
			game.score = 0;
			game.playerPosition = { x: 0, z: 0 };
			game.state = 'playing';
		} catch (e: any) {
			game.error = e.message || 'Something went wrong';
			game.state = 'input';
		}
		loading = false;
	}

	function playAgain() {
		game.reset();
	}

	// Joystick state
	let joystickContainer = $state<HTMLDivElement>();
	let joystickKnob = $state<HTMLDivElement>();
	let joystickTouchId = $state<number | null>(null);
	let joystickBase = $state({ x: 0, y: 0 });
	const MAX_DIST = 45;

	function onJoystickStart(e: TouchEvent) {
		if (!joystickContainer || joystickTouchId !== null) return;
		e.preventDefault();
		const touch = e.changedTouches[0];
		joystickTouchId = touch.identifier;
		const rect = joystickContainer.getBoundingClientRect();
		joystickBase = {
			x: rect.left + rect.width / 2,
			y: rect.top + rect.height / 2
		};
		updateJoystick(touch.clientX, touch.clientY);
	}

	function onJoystickMove(e: TouchEvent) {
		if (joystickTouchId === null) return;
		e.preventDefault();
		for (let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];
			if (touch.identifier === joystickTouchId) {
				updateJoystick(touch.clientX, touch.clientY);
				return;
			}
		}
	}

	function onJoystickEnd(e: TouchEvent) {
		for (let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];
			if (touch.identifier === joystickTouchId) {
				joystickTouchId = null;
				updateJoystick(joystickBase.x, joystickBase.y);
				return;
			}
		}
	}

	function updateJoystick(clientX: number, clientY: number) {
		let dx = clientX - joystickBase.x;
		let dy = clientY - joystickBase.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist > MAX_DIST) {
			dx = (dx / dist) * MAX_DIST;
			dy = (dy / dist) * MAX_DIST;
		}
		if (joystickKnob) {
			joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
		}
		const nx = dx / MAX_DIST;
		const ny = dy / MAX_DIST;
		if ((window as any).__joystick) {
			(window as any).__joystick(nx, ny);
		}
	}

	onMount(() => {
		// Expose startGame for testing
		(window as any).__startGame = startGame;

		if ((window as any).__joystick) {
			(window as any).__joystick(0, 0);
		}
	});
</script>

<!-- INPUT SCREEN -->
{#if game.state === 'input'}
	<div class="overlay">
		<div class="panel">
			<h1>🦋 Whale Chaser</h1>
			<p class="subtitle">Enter a Bluesky handle to chase their mutual follows!</p>
			<div class="input-row">
				<span class="at-sign">@</span>
				<input
					type="text"
					bind:value={handleInput}
					placeholder="handle.bsky.social"
					onkeydown={(e) => e.key === 'Enter' && startGame()}
					disabled={loading}
					autocomplete="off"
					spellcheck="false"
				/>
				<button onclick={startGame} disabled={loading || !handleInput.trim()}>
					{loading ? '...' : 'Go'}
				</button>
			</div>
			{#if game.error}
				<p class="error">{game.error}</p>
			{/if}

			<div class="whale-toggle">
				<label>
					<input type="checkbox" checked={game.whaleStyle === 'geometric'} onchange={() => game.toggleWhaleStyle()} />
					🐋 Bulbous whale
				</label>
			</div>
		</div>
	</div>
{/if}

<!-- LOADING SCREEN -->
{#if game.state === 'loading'}
	<div class="overlay">
		<div class="panel">
			<div class="spinner"></div>
			<p class="loading-text">Finding mutual follows for @{game.handle}...</p>
		</div>
	</div>
{/if}

<!-- PLAYING HUD -->
{#if game.state === 'playing' || game.state === 'complete'}
	<div class="hud">
		<div class="hud-top">
			<div class="score-panel">
				<span class="score-icon">🦴</span>
				<span class="score-text">{game.score} / {game.targetOrbs}</span>
			</div>
			<div class="player-info">
				<span class="player-name">{game.playerName}</span>
			</div>
		</div>
		<div class="whale-toggle">
			<label>
				<input type="checkbox" checked={game.whaleStyle === 'geometric'} onchange={() => game.toggleWhaleStyle()} />
				🐋 Bulbous
			</label>
		</div>
		<div class="hud-bottom">
			<span class="hint">WASD or joystick to move</span>
		</div>
	</div>

	<!-- Avatar overlays (outside Canvas, CSS-positioned) -->
	{#each game.orbs as orb (orb.id)}
		{#if !orb.collected && !orb.behindCamera && orb.profile.avatar}
			<div
				class="avatar-overlay"
				style="left:{orb.screenX}px;top:{orb.screenY}px"
			>
				<img src={avatarUrl(orb.profile.avatar)} alt={orb.profile.handle} />
			</div>
		{/if}
	{/each}

	<!-- Mobile joystick -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="joystick-container"
		bind:this={joystickContainer}
		ontouchstart={onJoystickStart}
		ontouchmove={onJoystickMove}
		ontouchend={onJoystickEnd}
		ontouchcancel={onJoystickEnd}
	>
		<div class="joystick-base">
			<div class="joystick-knob" bind:this={joystickKnob}></div>
		</div>
	</div>
{/if}

<!-- VICTORY SCREEN -->
{#if game.state === 'complete'}
	<div class="overlay victory-overlay">
		<div class="panel">
			<h1>🎉 You ate them all!</h1>
			<p class="subtitle">
				All {game.targetOrbs} mutual follows from @{game.handle} collected!
			</p>
			<div class="liked-list">
				{#each game.orbs as orb}
					<div class="liked-item">
						{#if orb.profile.avatar}
							<img
								src={orb.profile.avatar}
								alt={orb.profile.handle}
								crossorigin="anonymous"
							/>
						{/if}
						<div>
							<div class="liked-name">{orb.profile.displayName || orb.profile.handle}</div>
							<div class="liked-handle">@{orb.profile.handle}</div>
						</div>
					</div>
				{/each}
			</div>
			<button class="play-again" onclick={playAgain}>Play Again</button>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		background: rgba(5, 5, 20, 0.85);
		backdrop-filter: blur(8px);
	}
	.panel {
		background: linear-gradient(135deg, #1a1a3e, #0d1b2a);
		border: 1px solid #2a2a5a;
		border-radius: 20px;
		padding: 32px;
		max-width: 420px;
		width: 90%;
		text-align: center;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}
	h1 {
		font-size: 1.8rem;
		color: #e0e8ff;
		margin-bottom: 8px;
	}
	.subtitle {
		color: #8899bb;
		font-size: 0.9rem;
		margin-bottom: 20px;
	}
	.input-row {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #0a0a20;
		border: 1px solid #334;
		border-radius: 12px;
		padding: 8px 12px;
	}
	.at-sign {
		color: #668;
		font-size: 1.1rem;
	}
	.input-row input {
		flex: 1;
		background: transparent;
		border: none;
		color: #e0e8ff;
		font-size: 1rem;
		outline: none;
		padding: 6px 0;
	}
	.input-row input::placeholder {
		color: #556;
	}
	.input-row button,
	.play-again {
		background: #5b8af7;
		color: #fff;
		border: none;
		padding: 8px 20px;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}
	.input-row button:hover,
	.play-again:hover {
		background: #7ba5ff;
	}
	.input-row button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.error {
		color: #f75b5b;
		margin-top: 12px;
		font-size: 0.85rem;
	}
	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #334;
		border-top-color: #5b8af7;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin: 0 auto 16px;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	.loading-text {
		color: #8899bb;
		font-size: 0.95rem;
	}

	/* HUD */
	.hud {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 50;
		padding: 16px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}
	.hud-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}
	.score-panel {
		background: rgba(10, 10, 30, 0.7);
		border: 1px solid #2a2a5a;
		border-radius: 12px;
		padding: 8px 16px;
		display: flex;
		align-items: center;
		gap: 8px;
		backdrop-filter: blur(4px);
	}
	.score-icon {
		font-size: 1.2rem;
	}
	.score-text {
		color: #e0e8ff;
		font-weight: 700;
		font-size: 1.1rem;
		font-variant-numeric: tabular-nums;
	}
	.player-info {
		background: rgba(10, 10, 30, 0.7);
		border: 1px solid #2a2a5a;
		border-radius: 12px;
		padding: 8px 16px;
		backdrop-filter: blur(4px);
	}
	.player-name {
		color: #8899bb;
		font-size: 0.85rem;
	}
	.hud-bottom {
		text-align: center;
	}
	.hint {
		background: rgba(10, 10, 30, 0.5);
		border-radius: 8px;
		padding: 6px 14px;
		color: #556;
		font-size: 0.75rem;
	}

	/* Joystick */
	.joystick-container {
		position: fixed;
		bottom: 40px;
		left: 40px;
		width: 120px;
		height: 120px;
		z-index: 60;
		pointer-events: auto;
	}
	.joystick-base {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: rgba(10, 10, 30, 0.5);
		border: 2px solid rgba(91, 138, 247, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.joystick-knob {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: rgba(91, 138, 247, 0.5);
		border: 2px solid rgba(91, 138, 247, 0.8);
		transition: transform 0.05s;
	}

	/* Victory */
	.victory-overlay .panel {
		max-width: 440px;
		max-height: 80vh;
		overflow-y: auto;
	}
	.liked-list {
		text-align: left;
		margin: 16px 0;
		max-height: 200px;
		overflow-y: auto;
	}
	.liked-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px;
		border-bottom: 1px solid #1a1a3e;
	}
	.liked-item img {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
	}
	.liked-name {
		color: #e0e8ff;
		font-size: 0.85rem;
		font-weight: 600;
	}
	.liked-handle {
		color: #556;
		font-size: 0.75rem;
	}
	.play-again {
		margin-top: 12px;
		width: 100%;
	}

	/* Avatar overlays */
	.avatar-overlay {
		position: fixed;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid rgba(255, 255, 255, 0.4);
		box-shadow: 0 0 12px rgba(91, 138, 247, 0.5);
		pointer-events: none;
		transform: translate(-50%, -50%);
		z-index: 40;
	}
	.avatar-overlay img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	@media (min-width: 769px) {
		.joystick-container {
			display: none;
		}
	}
	@media (max-width: 768px) {
		.hint {
			display: none;
		}
	}
</style>
