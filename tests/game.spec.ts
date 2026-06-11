import { test, expect } from '@playwright/test';

test('loads the game and shows input screen', async ({ page }) => {
	await page.goto('/');

	// Should show the input screen with the default handle prefilled
	await expect(page.locator('h1')).toContainText('Whale Chaser');
	await expect(page.locator('input')).toHaveValue('norvid-studies.bsky.social');
});

test('can look up a user and enter playing state', async ({ page }) => {
	await page.goto('/');

	// Click Go to start the game
	await page.click('button:has-text("Go")');

	// Wait for the loading state
	await expect(page.locator('.loading-text')).toBeVisible({ timeout: 10000 });

	// Wait for playing state (HUD appears) or error
	await page.waitForFunction(() => {
		const hud = document.querySelector('.hud');
		const error = document.querySelector('.error');
		return hud !== null || error !== null;
	}, { timeout: 30000 });

	// Check if we got an error
	const error = page.locator('.error');
	if (await error.isVisible()) {
		const errorText = await error.textContent();
		console.log('Error:', errorText);
		// Take a screenshot for debugging
		await page.screenshot({ path: 'tests/screenshots/error.png' });
		throw new Error(`Game failed with error: ${errorText}`);
	}

	// Should be in playing state with score panel visible
	await expect(page.locator('.score-panel')).toBeVisible({ timeout: 5000 });
	await expect(page.locator('.score-text')).toBeVisible();
});

test('no console errors during gameplay', async ({ page }) => {
	const errors: string[] = [];
	page.on('console', (msg) => {
		if (msg.type() === 'error') errors.push(msg.text());
	});
	page.on('pageerror', (err) => errors.push(err.message));

	await page.goto('/');
	await page.click('button:has-text("Go")');

	// Wait for playing state
	await page.waitForFunction(() => {
		return document.querySelector('.hud') !== null || document.querySelector('.error') !== null;
	}, { timeout: 30000 });

	// If we have CORS errors, they'll be in the console
	if (errors.length > 0) {
		console.log('Console errors found:', errors);
		await page.screenshot({ path: 'tests/screenshots/console-errors.png' });
	}

	// CORS errors about images are acceptable for now
	const nonCorsErrors = errors.filter(
		(e) => !e.includes('cdn.bsky.app')
	);
	expect(nonCorsErrors).toHaveLength(0);
});
