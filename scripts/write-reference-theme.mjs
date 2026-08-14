// Writes reference/theme.css from a built-in preset.
//
// Through the app's own exporter rather than a copy of its output: the reference project is the
// proof that the plain-CSS export works, and a hand-maintained copy would stop proving it the
// first time the token list changed.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRESET = process.argv[2] ?? 'graphite';

const server = await createServer({
	root: ROOT,
	configFile: false,
	logLevel: 'warn',
	server: { middlewareMode: true },
	appType: 'custom'
});

try {
	const { buildExport, DEFAULT_OPTIONS } = await server.ssrLoadModule('src/lib/theme/export.ts');
	const { presetById } = await server.ssrLoadModule('src/lib/theme/presets.ts');

	const theme = presetById(PRESET);
	if (!theme) throw new Error(`no preset named ${PRESET}`);

	const [file] = buildExport('css-vars', theme, DEFAULT_OPTIONS);
	writeFileSync(join(ROOT, 'reference', 'theme.css'), file.contents);
	console.log(`reference/theme.css — ${theme.name}`);
} finally {
	await server.close();
}
