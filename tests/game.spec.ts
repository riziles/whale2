import { test, expect } from '@playwright/test';

test('page loads with input form and default handle', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (err) => errors.push(err.message));

	await page.goto('/');

	await expect(page.locator('h1')).toContainText('Whale Chaser');
	await expect(page.locator('input')).toHaveValue('norvid-studies.bsky.social');

	expect(errors.filter(e => !e.includes('cdn.bsky.app'))).toEqual([]);
});

test('enters playing state via programmatic startGame', async ({ page }) => {
	await page.goto('/');

	// Wait for the component to mount and expose __startGame
	await page.waitForFunction(() => (window as any).__startGame, { timeout: 5000 });

	// Call startGame directly (bypasses Svelte event handling)
	await page.evaluate(() => (window as any).__startGame());

	// Wait for either playing HUD or error
	await page.waitForSelector('.score-panel, .error', {
		state: 'visible',
		timeout: 20000
	});

	if (await page.locator('.error').isVisible()) {
		throw new Error(`Game error: ${await page.locator('.error').textContent()}`);
	}

	await expect(page.locator('.score-panel')).toBeVisible();
	await expect(page.locator('.score-text')).toContainText('/');
});

test('canvas and orbs render without critical errors', async ({ page }) => {
	const criticalErrors: string[] = [];
	page.on('console', (msg) => {
		const text = msg.text();
		if (
			msg.type() === 'error' &&
			!text.includes('GL_CLOSE_PATH_NV') &&
			!text.includes('GPU stall') &&
			!text.includes('cdn.bsky.app')
		) {
			criticalErrors.push(text);
		}
	});

	await page.goto('/');
	await page.waitForFunction(() => (window as any).__startGame, { timeout: 5000 });
	await page.evaluate(() => (window as any).__startGame());

	// Wait for playing state
	await page.waitForSelector('.score-panel', { state: 'visible', timeout: 20000 });

	// Wait for WebGL to render
	await page.waitForTimeout(3000);

	const canvas = page.locator('canvas');
	await expect(canvas).toBeAttached();

	if (criticalErrors.length > 0) {
		console.log('Critical errors:', criticalErrors);
	}
	expect(criticalErrors).toEqual([]);
});
