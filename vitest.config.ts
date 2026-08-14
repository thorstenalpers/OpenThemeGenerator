import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	// The SvelteKit plugin rather than the bare svelte one: components under `routes/`
	// import `$app/*`, which nothing else can resolve.
	plugins: [sveltekit()],
	resolve: {
		conditions: ['browser']
	},
	test: {
		environment: 'happy-dom',
		globals: true,
		// Threads rather than the default forks: a fresh node process per test file takes long
		// enough on Windows that the pool times out waiting for its own workers.
		pool: 'threads',
		setupFiles: ['./vitest-setup.ts'],
		include: ['src/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			include: ['src/**/*.{ts,svelte}'],
			exclude: ['src/**/*.test.ts', 'src/lib/components/ui/**']
		}
	}
});
