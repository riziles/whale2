import { test, expect } from '@playwright/test';

test('whale moves smoothly frame by frame', async ({ page }) => {
	await page.goto('/');
	await page.waitForFunction(() => (window as any).__startGame, { timeout: 5000 });
	await page.evaluate(() => (window as any).__startGame());
	await page.waitForSelector('.score-panel', { state: 'visible', timeout: 20000 });

	// Inject a frame-by-frame position tracker
	await page.evaluate(() => {
		const positions: Array<{ t: number; x: number; z: number }> = [];
		let lastTime = performance.now();
		function track() {
			const now = performance.now();
			const gp = (window as any).__gameState;
			if (gp && gp.state === 'playing') {
				positions.push({ t: now, x: gp.playerPosition.x, z: gp.playerPosition.z });
				// Keep only last 120 frames
				if (positions.length > 120) positions.shift();
			}
			lastTime = now;
			requestAnimationFrame(track);
		}
		requestAnimationFrame(track);
		(window as any).__positions = positions;
	});

	// Wait a moment for tracker to start
	await page.waitForTimeout(500);

	// Press W and hold for exactly 1 second
	await page.keyboard.down('w');
	await page.waitForTimeout(1000);
	await page.keyboard.up('w');

	// Wait for a couple more frames to settle
	await page.waitForTimeout(200);

	// Get the tracked positions
	const positions = await page.evaluate(() => (window as any).__positions as Array<{t:number;x:number;z:number}>);

	console.log(`Tracked ${positions.length} frames`);
	console.log('First 5 positions:', JSON.stringify(positions.slice(0, 5)));
	console.log('Last 5 positions:', JSON.stringify(positions.slice(-5)));

	// Check for teleporting: maximum frame-to-frame delta should be reasonable
	let maxJump = 0;
	for (let i = 1; i < positions.length; i++) {
		const dt = (positions[i].t - positions[i-1].t) / 1000; // seconds
		const dx = Math.abs(positions[i].x - positions[i-1].x);
		const dz = Math.abs(positions[i].z - positions[i-1].z);
		const jump = Math.sqrt(dx*dx + dz*dz);
		if (dt > 0 && jump / dt > maxJump) {
			maxJump = jump / dt;
		}
	}

	console.log('Max speed (units/sec):', maxJump.toFixed(2));
	console.log('Expected speed: ~6.0 (PLAYER_SPEED)');

	// Whale should have moved
	expect(positions.length).toBeGreaterThan(10);

	// Maximum speed should be close to PLAYER_SPEED (6), not wildly higher
	// Allow some margin for frame timing variance
	expect(maxJump).toBeLessThan(20);
});

test('screenshot after tiny movement', async ({ page }) => {
	await page.goto('/');
	await page.waitForFunction(() => (window as any).__startGame, { timeout: 5000 });
	await page.evaluate(() => (window as any).__startGame());
	await page.waitForSelector('.score-panel', { state: 'visible', timeout: 20000 });

	// Screenshot initial position
	await page.waitForTimeout(500);
	await page.screenshot({ path: 'tests/screenshots/a-before-move.png' });
	const pos1 = await page.evaluate(() => (window as any).__gameState?.playerPosition);
	console.log('Before:', JSON.stringify(pos1));

	// Tiny tap of W (50ms)
	await page.keyboard.down('w');
	await page.waitForTimeout(50);
	await page.keyboard.up('w');
	await page.waitForTimeout(100);

	await page.screenshot({ path: 'tests/screenshots/b-after-tiny-w.png' });
	const pos2 = await page.evaluate(() => (window as any).__gameState?.playerPosition);
	console.log('After 50ms W:', JSON.stringify(pos2));

	// Another tiny tap
	await page.keyboard.down('w');
	await page.waitForTimeout(50);
	await page.keyboard.up('w');
	await page.waitForTimeout(100);

	await page.screenshot({ path: 'tests/screenshots/c-after-another-w.png' });
	const pos3 = await page.evaluate(() => (window as any).__gameState?.playerPosition);
	console.log('After another 50ms W:', JSON.stringify(pos3));

	// Calculate deltas
	const d1 = pos2.z - pos1.z;
	const d2 = pos3.z - pos2.z;
	console.log('Delta 1:', d1.toFixed(3), 'Delta 2:', d2.toFixed(3));

	// Both deltas should be similar (smooth movement)
	const ratio = Math.abs(d1) > 0.001 ? d2 / d1 : 1;
	console.log('Delta ratio:', ratio.toFixed(2), '(should be ~1.0)');
	expect(Math.abs(ratio)).toBeGreaterThan(0.3);
	expect(Math.abs(ratio)).toBeLessThan(3.0);
});
