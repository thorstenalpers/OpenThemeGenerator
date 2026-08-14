import { describe, expect, it } from 'vitest';
import { buildExport, DEFAULT_OPTIONS, FORMATS } from './export';
import { PRESETS, presetById } from './presets';
import type { Theme } from './theme';

const azure = presetById('azure') as Theme;

function fileOf(id: Parameters<typeof buildExport>[0], path: string, options = DEFAULT_OPTIONS) {
	const file = buildExport(id, azure, options).find((candidate) => candidate.path === path);
	expect(file, `${id} should emit ${path}`).toBeDefined();
	return file!.contents;
}

describe('every format', () => {
	it.each(FORMATS.map((format) => [format.id, format] as const))(
		'%s emits non-empty files for every preset',
		(_id, format) => {
			for (const preset of PRESETS) {
				const files = format.build(preset, DEFAULT_OPTIONS);
				expect(files.length).toBeGreaterThan(0);
				for (const file of files) {
					expect(file.path).not.toBe('');
					expect(file.contents.trim().length).toBeGreaterThan(0);
				}
			}
		}
	);

	it.each(FORMATS.map((format) => [format.id, format] as const))(
		'%s drops the non-shadcn tokens when asked to',
		(_id, format) => {
			const lean = format
				.build(azure, { ...DEFAULT_OPTIONS, includeExtras: false })
				.map((file) => file.contents)
				.join('\n');

			// The token, not the substring: `--icon-success` is a sidebar icon colour rather than a
			// surface token, and it stays whatever the host does with `success`.
			for (const token of ['success', 'warning']) {
				expect(lean).not.toContain(`--${token}:`);
				expect(lean).not.toContain(`'${token}'`);
				expect(lean).not.toContain(`"${token}"`);
			}
			expect(lean).toContain('icon-success');
		}
	);
});

describe('tailwind v4', () => {
	it('declares the tokens and maps them into utilities', () => {
		const css = fileOf('tailwind-v4', 'app.css');

		expect(css).toContain('@import');
		expect(css).toContain('@custom-variant dark (&:is(.dark *));');
		expect(css).toContain('--background: oklch(');
		expect(css).toContain('.dark {');
		// Without the mapping block the tokens exist and no utility reads them.
		expect(css).toContain('--color-background: var(--background);');
		expect(css).toContain('--radius-lg: var(--radius);');
	});

	it('writes hex when the host cannot read OKLCH', () => {
		const css = fileOf('tailwind-v4', 'app.css', { ...DEFAULT_OPTIONS, colorSpace: 'hex' });

		expect(css).toContain('--background: #');
		expect(css).not.toContain('oklch(');
	});
});

describe('preset class', () => {
	it('anchors both halves to :root so an import cannot lose to source order', () => {
		const css = fileOf('preset-class', 'themes/azure.css');

		expect(css).toContain(':root.theme-azure {');
		expect(css).toContain(':root.dark.theme-azure {');
	});
});

describe('tailwind v3', () => {
	it('splits colours into channels and never leaves an alpha in one', () => {
		const css = fileOf('tailwind-v3', 'globals.css');
		const declared = css.split('\n').filter((line) => line.trim().startsWith('--'));

		expect(css).not.toContain('oklch(');
		expect(declared.length).toBeGreaterThan(30);
		// `hsl(var(--border))` cannot take an alpha the variable carries, so none may survive.
		expect(declared.filter((line) => line.includes('/'))).toEqual([]);
		expect(css).toMatch(/--background: [\d.]+ [\d.]+% [\d.]+%;/);
	});

	it('ships the config that turns those channels into colours', () => {
		const config = fileOf('tailwind-v3', 'tailwind.config.js');

		expect(config).toContain("'background': 'hsl(var(--background))'");
		expect(config).toContain("darkMode: ['class']");
	});
});

describe('plain CSS', () => {
	it('follows the system unless the page pins a mode', () => {
		const css = fileOf('css-vars', 'theme.css');

		expect(css).toContain('@media (prefers-color-scheme: dark)');
		expect(css).toContain(":root:not([data-theme='light'])");
		expect(css).toContain(":root[data-theme='dark']");
	});
});

describe('registry item', () => {
	it('is the JSON shadcn installs', () => {
		const parsed: unknown = JSON.parse(fileOf('registry-json', 'azure.json'));
		const item = parsed as {
			type: string;
			cssVars: {
				light: Record<string, string>;
				dark: Record<string, string>;
				theme: Record<string, string>;
			};
		};

		expect(item.type).toBe('registry:theme');
		expect(item.cssVars.light.background).toContain('oklch(');
		expect(item.cssVars.dark.background).toContain('oklch(');
		// The mode-independent geometry sits in the theme bucket; the shadows ride with the modes.
		expect(item.cssVars.theme.radius).toBe('0.5rem');
		expect(item.cssVars.theme['sidebar-width']).toBe('16rem');
		expect(item.cssVars.theme['elevation-low']).toBeUndefined();
		expect(item.cssVars.light['elevation-low']).toContain('oklch(0 0 0 /');
	});
});

describe('the optional README', () => {
	it('is off by default and added to whatever format is chosen', () => {
		const without = buildExport('tailwind-v4', azure, DEFAULT_OPTIONS);
		const with_ = buildExport('tailwind-v4', azure, { ...DEFAULT_OPTIONS, includeReadme: true });

		expect(without.some((file) => file.path === 'README.md')).toBe(false);
		expect(with_).toHaveLength(without.length + 1);
		expect(with_.at(-1)?.path).toBe('README.md');
	});

	it('names every file it ships beside and the decisions the theme made', () => {
		const [globals, config, docs] = buildExport('tailwind-v3', azure, {
			...DEFAULT_OPTIONS,
			includeReadme: true
		});

		expect(globals?.path).toBe('globals.css');
		expect(config?.path).toBe('tailwind.config.js');
		expect(docs?.contents).toContain('`globals.css`');
		expect(docs?.contents).toContain('`tailwind.config.js`');
		expect(docs?.contents).toContain('16rem');
		expect(docs?.contents).toContain(azure.layout.sidebarStyle);
	});
});

describe('TypeScript module', () => {
	it('exports the palette under a name that is a valid identifier', () => {
		const module = buildExport('ts-module', { ...azure, id: 'northern-lights' }, DEFAULT_OPTIONS);

		expect(module[0]?.path).toBe('northern-lights.ts');
		expect(module[0]?.contents).toContain('export const northernLights = {');
		expect(module[0]?.contents).toContain('export function applyTheme(');
	});
});
