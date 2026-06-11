import { test, expect } from '@playwright/test';

test('game enters playing state and keyboard moves whale', async ({ page }) => {
	const errors: string[] = [];
	page.on('console', (msg) => {
		if (msg.type() === 'error' &&
			!msg.text().includes('cdn.bsky.app') &&
			!msg.text().includes('GL_CLOSE_PATH_NV') &&
			!msg.text().includes('GPU stall') &&
			!msg.text().includes('404'))
			errors.push(msg.text());
	});

	await page.goto('/');
	await page.waitForFunction(() => (window as any).__startGame, { timeout: 5000 });
	await page.evaluate(() => (window as any).__startGame());

	// Verify entering playing state
	await page.waitForSelector('.score-panel', { state: 'visible', timeout: 20000 });
	await expect(page.locator('.score-text')).toContainText('/');

	// Hold W for 1 second — whale should move forward (negative Z)
	await page.keyboard.down('w');
	await page.waitForTimeout(1000);
	await page.keyboard.up('w');

	const pos = await page.evaluate(() => (window as any).__gameState?.playerPosition);
	expect(pos.z).toBeLessThan(-3); // moved at least 3 units in 1s

	expect(errors).toEqual([]);
});
