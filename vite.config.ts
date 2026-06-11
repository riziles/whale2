import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const dev = process.argv.includes('dev');

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html',
				precompress: false,
				strict: true
			}),
			paths: {
				base: dev ? '' : '/whale2'
			}
		})
	],
	ssr: {
		noExternal: ['three']
	},
	server: {
		proxy: {
			'/avatar': {
				target: 'https://cdn.bsky.app',
				changeOrigin: true,
				rewrite: (path: string) => path.replace(/^\/avatar/, '/img/avatar')
			}
		}
	}
});
