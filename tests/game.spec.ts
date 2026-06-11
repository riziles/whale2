import { test } from '@playwright/test';

test('visual playthrough with screenshots', async ({ page }) => {
	const screenshot = (name: string) =>
		page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: false });

	await page.goto('/');

	// 1. Input screen
	await page.waitForSelector('h1');
	await screenshot('01-input-screen');

	// 2. Click Go
	await page.waitForFunction(() => (window as any).__startGame, { timeout: 5000 });
	await page.evaluate(() => (window as any).__startGame());

	// 3. Wait for playing state
	await page.waitForSelector('.score-panel', { state: 'visible', timeout: 20000 });
	await page.waitForTimeout(500);
	await screenshot('02-game-started');

	// 4. Check how many orbs are visible
	const orbCount = await page.evaluate(() => {
		return (window as any).__gameState?.orbs?.length || 0;
	});
	console.log('Total orbs:', orbCount);

	// Get orb positions and details
	const orbInfo = await page.evaluate(() => {
		const orbs = (window as any).__gameState?.orbs || [];
		return orbs.map((o: any) => ({
			id: o.id,
			collected: o.collected,
			avatar: o.profile?.avatar?.slice(0, 60),
			position: o.position,
			handle: o.profile?.handle
		}));
	});
	console.log('Orb details:', JSON.stringify(orbInfo, null, 2));

	// 5. Move around the world using WASD
	// Move right
	await page.keyboard.down('d');
	await page.waitForTimeout(1500);
	await page.keyboard.up('d');
	await screenshot('03-after-d');

	// Move forward (toward orbs)
	await page.keyboard.down('w');
	await page.waitForTimeout(1000);
	await page.keyboard.up('w');
	await screenshot('04-after-w');

	// Move left
	await page.keyboard.down('a');
	await page.waitForTimeout(1000);
	await page.keyboard.up('a');
	await screenshot('05-after-a');

	// 6. Try to collect an orb - move toward the first orb
	const firstOrbPos = orbInfo[0]?.position;
	if (firstOrbPos) {
		console.log('Moving toward orb at:', firstOrbPos);
		// Move in the direction of the first orb
		const pos = await page.evaluate(() => (window as any).__gameState?.playerPosition);
		console.log('Current player pos:', pos);

		// Move around to try to collect orbs
		await page.keyboard.down('w');
		await page.waitForTimeout(2000);
		await page.keyboard.up('w');

		await page.keyboard.down('d');
		await page.waitForTimeout(2000);
		await page.keyboard.up('d');
		await screenshot('06-near-orbs');
	}

	// 7. Check collected count
	const score = await page.evaluate(() => (window as any).__gameState?.score);
	console.log('Score:', score, '/', orbCount);

	// 8. Final screenshot
	await screenshot('07-final-state');

	console.log('Screenshots saved to tests/screenshots/');
});
