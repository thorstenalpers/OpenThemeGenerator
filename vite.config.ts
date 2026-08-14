import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: {
		// Only the studio route imports it, so Vite discovers it on first navigation, re-bundles,
		// and answers the in-flight request with a 504 — which lands as a blank page rather than a
		// reload. Naming it here means it is bundled before the server starts serving.
		include: ['@tanstack/table-core']
	},
	server: {
		// Pinned because tauri.conf.json waits for exactly this URL: on a taken port Vite would
		// silently pick the next one and `npm run start` would hang forever.
		port: 5178,
		strictPort: true,
		// Cargo rewrites the exe while the dev server runs, and the watcher dies on it with EBUSY.
		// `build/` is the adapter's own output: watching it means `npm run build` while the dev
		// server is up puts it into a reload loop that never settles, and the page stays blank.
		watch: { ignored: ['**/src-tauri/**', '**/target/**', '**/build/**'] }
	}
});
