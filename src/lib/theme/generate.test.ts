import { describe, expect, it } from 'vitest';
import { contrast } from './color';
import { buildPalettes, buildTheme, DEFAULT_RECIPE } from './generate';
import { GENERATED_PRESETS, PRESETS, REGISTRY_PRESETS, TEMPLATE_PRESETS } from './presets';
import { inspect } from './theme';
import { TOKEN_NAMES } from './tokens';

/** Body text has to clear WCAG AA; the pairs below are the ones that carry it. */
const TEXT_PAIRS = [
	['background', 'foreground'],
	['card', 'card-foreground'],
	['popover', 'popover-foreground'],
	['primary', 'primary-foreground'],
	['secondary', 'secondary-foreground'],
	['accent', 'accent-foreground'],
	['destructive', 'destructive-foreground'],
	['success', 'success-foreground'],
	['warning', 'warning-foreground'],
	['sidebar', 'sidebar-foreground'],
	['sidebar-primary', 'sidebar-primary-foreground'],
	['sidebar-accent', 'sidebar-accent-foreground']
] as const;

/** Everything this app derives from a recipe: the curated presets and the templates alike. */
const MADE_HERE = [...GENERATED_PRESETS, ...TEMPLATE_PRESETS];

describe('the generator', () => {
	it('fills every token in both modes', () => {
		const { light, dark } = buildPalettes(DEFAULT_RECIPE);

		for (const token of TOKEN_NAMES) {
			expect(light[token], `light ${token}`).toBeTruthy();
			expect(dark[token], `dark ${token}`).toBeTruthy();
		}
	});

	it('keeps a grey seed grey and pulls a colourful one into a usable band', () => {
		const grey = buildPalettes({ ...DEFAULT_RECIPE, seed: '#18181b' });
		const loud = buildPalettes({ ...DEFAULT_RECIPE, seed: '#ff0055' });

		// A near-black brand colour is a decision, so light mode keeps it and dark mode flips it.
		expect(grey.light.primary).toContain('oklch(0.2');
		expect(grey.dark.primary).toContain('oklch(0.92');
		// A colour that light on a white page would be unreadable under white label text.
		expect(Number(/oklch\(([\d.]+)/.exec(loud.light.primary ?? '')?.[1])).toBeLessThanOrEqual(0.68);
	});

	it('separates the chart series even when the seed has no hue', () => {
		const { light } = buildPalettes({ ...DEFAULT_RECIPE, seed: '#000000' });
		const series = [1, 2, 3, 4, 5].map((index) => light[`chart-${index}`]);

		expect(new Set(series).size).toBe(5);
		// Five greys are not a readable series, so a neutral theme borrows a data hue.
		expect(series.every((value) => value?.includes(' 0 '))).toBe(false);
	});

	it('applies overrides on top of the derived palette', () => {
		const theme = buildTheme({
			id: 'custom',
			name: 'Custom',
			recipe: { seed: '#3b82f6' },
			overrides: { dark: { background: 'oklch(0 0 0)' } }
		});

		expect(theme.dark.background).toBe('oklch(0 0 0)');
		expect(theme.light.background).not.toBe('oklch(0 0 0)');
	});
});

describe('the built-in presets', () => {
	it('are uniquely named', () => {
		expect(PRESETS.length).toBeGreaterThanOrEqual(10);
		expect(new Set(PRESETS.map((preset) => preset.id)).size).toBe(PRESETS.length);
	});

	it('carry a complete palette with nothing an exporter would drop', () => {
		for (const preset of PRESETS) {
			expect(inspect(preset), preset.id).toEqual([]);
		}
	});

	/**
	 * Only the themes this app derives are held to the bar — the curated ones and the templates
	 * alike. The registry ones are other people's designs carried as published: retinting them to
	 * pass a test here would make them a different theme wearing the same name, which is the one
	 * thing importing them must not do. What they actually score is surfaced in the gallery instead.
	 */
	it.each(MADE_HERE.map((preset) => [preset.id, preset] as const))(
		'%s keeps its body text above 4.5:1 in both modes',
		(_id, preset) => {
			for (const mode of ['light', 'dark'] as const) {
				for (const [surface, label] of TEXT_PAIRS) {
					const ratio = contrast(preset[mode][surface] ?? '', preset[mode][label] ?? '');
					expect(ratio, `${preset.id} ${mode} ${surface}/${label}`).toBeGreaterThanOrEqual(4.5);
				}
			}
		}
	);

	it.each(MADE_HERE.map((preset) => [preset.id, preset] as const))(
		'%s keeps secondary text above 3:1',
		(_id, preset) => {
			for (const mode of ['light', 'dark'] as const) {
				const ratio = contrast(preset[mode].muted ?? '', preset[mode]['muted-foreground'] ?? '');
				expect(ratio, `${preset.id} ${mode} muted`).toBeGreaterThanOrEqual(3);
			}
		}
	);
});

describe('the imported registry themes', () => {
	it('are carried as published rather than regenerated', () => {
		const modernMinimal = REGISTRY_PRESETS.find((theme) => theme.id === 'tweakcn-modern-minimal');

		// The published value, character for character. If the generator ever touched an imported
		// palette this is the assertion that would catch it.
		expect(modernMinimal?.light.primary).toBe('oklch(0.6231 0.1880 259.8145)');
		expect(modernMinimal?.layout.radius).toBe(0.375);
	});

	it('are filled out where the registry defines fewer tokens than this app emits', () => {
		for (const theme of REGISTRY_PRESETS) {
			// The registry has no success or warning; they are derived so every exporter stays whole.
			expect(theme.light.success, theme.id).toBeTruthy();
			expect(theme.dark.warning, theme.id).toBeTruthy();
			expect(inspect(theme), theme.id).toEqual([]);
		}
	});

	it('are namespaced so an import can never collide with a theme made here', () => {
		const made = new Set(GENERATED_PRESETS.map((theme) => theme.id));

		for (const theme of REGISTRY_PRESETS) {
			expect(theme.id.startsWith('tweakcn-'), theme.id).toBe(true);
			expect(made.has(theme.id)).toBe(false);
		}
	});
});
