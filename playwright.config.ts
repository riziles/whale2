import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	use: {
		baseURL: 'http://localhost:5399',
		viewport: { width: 1280, height: 720 },
		headless: false
	},
	timeout: 30000,
	expect: { timeout: 10000 }
});
