import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	webServer: {
		command: 'pnpm dev --port 5299',
		port: 5299,
		timeout: 30000,
		reuseExistingServer: true
	},
	use: {
		baseURL: 'http://localhost:5299',
		viewport: { width: 1280, height: 720 }
	}
});
