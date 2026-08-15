import { buildTheme, type ThemeDraft } from './generate';
import { REGISTRY_THEMES, type RegistryTheme } from './registry-themes';
import { SIDEBAR_SPECS } from './sidebar';
import { TEMPLATE_DRAFTS } from './templates';
import type { Theme } from './theme';

/**
 * The themes the app ships with. Each one is a recipe rather than a table of 36 values: the
 * built-ins go through the same generator as anything the user makes, so a fix to the ramp
 * reaches them too instead of leaving them frozen at the moment they were written.
 *
 * The `layout` block is the half a palette cannot express — how dense the page is, how hard the
 * corners are, how far the sidebar stands off. Two themes with the same colours and different
 * layouts are two different products.
 */
export const PRESET_DRAFTS: readonly ThemeDraft[] = [
	{
		id: 'graphite',
		name: 'Graphite',
		description: 'Pure neutral. Black type on white, one near-black brand colour, no hue at all.',
		tags: ['minimal', 'monochrome'],
		recipe: {
			seed: '#18181b',
			neutralChroma: 0,
			accentTint: 0,
			harmony: 'mono',
			sidebarTone: 'tinted'
		},
		layout: { sidebarStyle: 'vercel', radius: 0.625, density: 'normal', elevation: 'subtle' }
	},
	{
		id: 'paper',
		name: 'Paper',
		description:
			'Warm off-white and ink. Editorial rather than technical: flat, roomy, and narrow enough to read.',
		tags: ['minimal', 'monochrome', 'warm'],
		recipe: {
			seed: '#1c1917',
			neutralChroma: 0.006,
			neutralHue: 75,
			accentTint: 0,
			harmony: 'mono',
			sidebarTone: 'flush',
			lightBackground: 0.985,
			darkBackground: 0.17
		},
		layout: {
			sidebarStyle: 'vercel',
			radius: 0.25,
			density: 'comfortable',
			elevation: 'none',
			sidebarWidth: 15,
			contentWidth: 64
		}
	},
	{
		id: 'terminal',
		name: 'Terminal',
		description:
			'Phosphor green on near-black. Sharp corners, tight rows, and a sidebar that stands apart.',
		tags: ['tech', 'dark', 'monochrome'],
		recipe: {
			seed: '#2bd97c',
			neutralChroma: 0.012,
			neutralHue: 160,
			accentTint: 0.5,
			harmony: 'mono',
			sidebarTone: 'contrast',
			lightBackground: 0.99,
			darkBackground: 0.12
		},
		layout: {
			sidebarStyle: 'piano',
			radius: 0.125,
			density: 'compact',
			elevation: 'none',
			sidebarWidth: 14,
			sidebarRail: 3,
			contentWidth: 96
		}
	},
	{
		id: 'blueprint',
		name: 'Blueprint',
		description: 'Cyan on cool slate. The drafting-table palette, dense and squared off.',
		tags: ['tech', 'cool'],
		recipe: {
			seed: '#22a5c9',
			neutralChroma: 0.012,
			neutralHue: 240,
			accentTint: 0.4,
			harmony: 'analogous',
			sidebarTone: 'contrast',
			darkBackground: 0.17
		},
		layout: {
			sidebarStyle: 'vercel',
			radius: 0.25,
			density: 'compact',
			elevation: 'subtle',
			contentWidth: 88
		}
	},
	{
		id: 'azure',
		name: 'Azure',
		description:
			'The default product blue on a near-neutral base. Safe, and it stays out of the way.',
		tags: ['minimal', 'cool'],
		recipe: {
			seed: '#3b82f6',
			neutralChroma: 0.004,
			neutralHue: 250,
			accentTint: 0.35,
			harmony: 'analogous',
			sidebarTone: 'tinted'
		},
		layout: {
			sidebarStyle: 'win11',
			iconColor: 'system',
			radius: 0.5,
			density: 'normal',
			elevation: 'subtle'
		}
	},
	{
		id: 'violet',
		name: 'Violet',
		description: 'Electric violet against true neutrals, with generous corners and soft shadows.',
		tags: ['tech', 'vivid'],
		recipe: {
			seed: '#7c3aed',
			neutralChroma: 0,
			accentTint: 0.4,
			harmony: 'analogous',
			sidebarTone: 'tinted',
			darkBackground: 0.14
		},
		layout: {
			sidebarStyle: 'x',
			radius: 0.75,
			density: 'normal',
			elevation: 'soft',
			sidebarWidth: 17,
			sidebarRail: 4
		}
	},
	{
		id: 'amber',
		name: 'Amber',
		description: 'Monochrome amber over warm greys. Reads like an instrument panel.',
		tags: ['tech', 'warm', 'monochrome'],
		recipe: {
			seed: '#f59e0b',
			neutralChroma: 0.008,
			neutralHue: 65,
			accentTint: 0.45,
			harmony: 'mono',
			sidebarTone: 'contrast',
			lightBackground: 0.99,
			darkBackground: 0.15
		},
		layout: {
			radius: 0.375,
			density: 'compact',
			elevation: 'subtle',
			sidebarWidth: 15,
			contentWidth: 84
		}
	},
	{
		id: 'mint',
		name: 'Mint',
		description: 'Cool teal on a barely tinted base. Soft contrast, rounded, and unhurried.',
		tags: ['minimal', 'cool'],
		recipe: {
			seed: '#14b8a6',
			neutralChroma: 0.006,
			neutralHue: 185,
			accentTint: 0.4,
			harmony: 'analogous',
			contrast: 'soft',
			sidebarTone: 'flush'
		},
		layout: {
			sidebarStyle: 'macos',
			iconColor: 'system',
			radius: 0.75,
			density: 'comfortable',
			elevation: 'soft',
			sidebarWidth: 17,
			sidebarRail: 4,
			contentWidth: 76
		}
	},
	{
		id: 'crimson',
		name: 'Crimson',
		description: 'One loud red on neutral greys, framed by a border you can actually see.',
		tags: ['vivid', 'warm'],
		recipe: {
			seed: '#e11d48',
			neutralChroma: 0.006,
			neutralHue: 20,
			accentTint: 0.35,
			harmony: 'complementary',
			sidebarTone: 'tinted'
		},
		layout: { radius: 0.5, density: 'normal', borderWidth: 2, elevation: 'soft' }
	},
	{
		id: 'spectrum',
		name: 'Spectrum',
		description:
			'Loud on purpose: a pink brand colour, a three-way chart split, no borders and real shadows.',
		tags: ['vivid', 'colourful'],
		recipe: {
			seed: '#ec4899',
			neutralChroma: 0.01,
			neutralHue: 310,
			accentTint: 0.6,
			harmony: 'triad',
			sidebarTone: 'tinted',
			darkBackground: 0.16
		},
		layout: {
			sidebarStyle: 'x',
			iconColor: 'system',
			radius: 1,
			density: 'comfortable',
			borderWidth: 0,
			elevation: 'lifted',
			sidebarWidth: 18,
			sidebarRail: 4,
			contentWidth: 88
		}
	},

	// The four below exist for their sidebars: each shows one of the designs in its purest form,
	// with the palette kept quiet enough that the structure is what you see.
	{
		id: 'ivory',
		name: 'Ivory',
		description:
			'The piano sidebar in black and white: full-width keys, hairline separators, and the active key pressed in.',
		tags: ['sidebar', 'monochrome', 'minimal'],
		recipe: {
			seed: '#111113',
			neutralChroma: 0,
			accentTint: 0,
			harmony: 'mono',
			sidebarTone: 'flush'
		},
		layout: {
			sidebarStyle: 'piano',
			radius: 0.125,
			density: 'normal',
			elevation: 'none',
			sidebarWidth: 15
		}
	},
	{
		id: 'stream',
		name: 'Stream',
		description:
			'The X sidebar: big icons, round pill rows, bold labels, and no chrome anywhere else.',
		tags: ['sidebar', 'minimal'],
		recipe: {
			seed: '#1d9bf0',
			neutralChroma: 0,
			accentTint: 0.2,
			harmony: 'mono',
			sidebarTone: 'flush'
		},
		layout: {
			sidebarStyle: 'x',
			radius: 1,
			density: 'comfortable',
			borderWidth: 1,
			elevation: 'none',
			sidebarWidth: 17,
			sidebarRail: 4.5
		}
	},
	{
		id: 'fluent',
		name: 'Fluent',
		description:
			'The Windows 11 sidebar: a mica pane over the page, rounded rows, an accent pill at the active edge, and coloured icons.',
		tags: ['sidebar', 'cool'],
		recipe: {
			seed: '#0067c0',
			neutralChroma: 0.005,
			neutralHue: 250,
			accentTint: 0.3,
			harmony: 'analogous',
			sidebarTone: 'tinted',
			lightBackground: 0.975,
			darkBackground: 0.17
		},
		layout: {
			sidebarStyle: 'win11',
			iconColor: 'system',
			radius: 0.375,
			density: 'normal',
			elevation: 'subtle',
			sidebarWidth: 17
		}
	},
	{
		id: 'sonoma',
		name: 'Sonoma',
		description:
			'The macOS sidebar: translucent, small rows, section labels, coloured icons, and a filled selection.',
		tags: ['sidebar', 'minimal'],
		recipe: {
			seed: '#0a84ff',
			neutralChroma: 0.004,
			neutralHue: 250,
			accentTint: 0.25,
			harmony: 'analogous',
			sidebarTone: 'tinted',
			lightBackground: 0.985,
			darkBackground: 0.19
		},
		layout: {
			sidebarStyle: 'macos',
			iconColor: 'system',
			radius: 0.5,
			density: 'normal',
			elevation: 'soft',
			sidebarWidth: 14,
			sidebarRail: 3
		}
	},

	// And four for the sidebars that are lit rather than filled. Each palette is chosen for what the
	// relief needs rather than for itself: a raised key wants a surface bright enough to catch a
	// highlight, and soft relief wants a mid-tone, because a light edge and a dark one both have to
	// be visible against it — on white or on black, one of the two disappears.
	{
		id: 'clavier',
		name: 'Clavier',
		description:
			'Raised ivory keys that press in when you pick one: a light edge along the top, a dark one beneath, and a shadow cast under the whole row.',
		tags: ['sidebar', 'monochrome', 'warm'],
		recipe: {
			seed: '#1a1712',
			neutralChroma: 0.007,
			neutralHue: 80,
			accentTint: 0,
			harmony: 'mono',
			sidebarTone: 'contrast',
			lightBackground: 0.98,
			darkBackground: 0.19
		},
		layout: {
			sidebarStyle: 'keys',
			radius: 0.25,
			density: 'normal',
			elevation: 'subtle',
			sidebarWidth: 16
		}
	},
	{
		id: 'pebble',
		name: 'Pebble',
		description:
			'Soft relief on a mid-grey page: rows extruded from the surface rather than drawn on it, pressed in when current.',
		tags: ['sidebar', 'minimal', 'cool'],
		recipe: {
			seed: '#64748b',
			neutralChroma: 0.006,
			neutralHue: 250,
			accentTint: 0.2,
			harmony: 'mono',
			contrast: 'high',
			sidebarTone: 'flush',
			// Neumorphism needs a mid-tone to sit on: the light edge vanishes on white and the dark
			// one on black, and with either gone the row stops reading as raised at all.
			lightBackground: 0.93,
			darkBackground: 0.26
		},
		layout: {
			sidebarStyle: 'neumorph',
			radius: 0.7,
			density: 'comfortable',
			borderWidth: 0,
			elevation: 'none',
			sidebarWidth: 17
		}
	},
	{
		id: 'lagoon',
		name: 'Lagoon',
		description:
			'Glossy pills with a highlight across the top edge, the way early Aqua drew a button. Loud, and forty years of muscle memory old.',
		tags: ['sidebar', 'cool', 'vivid'],
		recipe: {
			seed: '#0ea5e9',
			neutralChroma: 0.008,
			neutralHue: 230,
			accentTint: 0.35,
			harmony: 'analogous',
			sidebarTone: 'contrast',
			lightBackground: 0.985,
			darkBackground: 0.18
		},
		layout: {
			sidebarStyle: 'aqua',
			radius: 0.75,
			density: 'normal',
			elevation: 'soft',
			sidebarWidth: 16
		}
	},
	{
		id: 'letterpress',
		name: 'Letterpress',
		description:
			'Rows cut into the page rather than laid on it: a hairline shadow at the top of each and a light one under it, deepening on the current row.',
		tags: ['sidebar', 'monochrome', 'warm'],
		recipe: {
			seed: '#26211c',
			neutralChroma: 0.008,
			neutralHue: 70,
			accentTint: 0,
			harmony: 'mono',
			contrast: 'high',
			sidebarTone: 'tinted',
			lightBackground: 0.96,
			darkBackground: 0.21
		},
		layout: {
			sidebarStyle: 'embossed',
			radius: 0.35,
			density: 'normal',
			elevation: 'subtle',
			sidebarWidth: 16
		}
	}
];

/**
 * A published theme as a draft this app can carry.
 *
 * The palettes become overrides, so every value is exactly as published. The recipe behind them is
 * seeded from the theme's own primary, which only matters for the handful of tokens the registry
 * does not define — `success` and `warning` — and for what happens if someone presses regenerate.
 * The structure is this app's own: a registry item has no opinion about sidebars.
 */
function fromRegistry(entry: RegistryTheme): ThemeDraft {
	return {
		id: entry.id,
		name: entry.name,
		description: entry.description,
		tags: [...entry.tags, 'shadcn'],
		recipe: { seed: entry.light.primary ?? '#18181b' },
		layout: { radius: entry.radius },
		overrides: { light: entry.light, dark: entry.dark }
	};
}

/**
 * The tag nobody writes by hand.
 *
 * Whether a theme is one of the lit ones follows from its sidebar style, so deriving it is the only
 * way it cannot drift — and without it the four relief designs were reachable only by knowing that
 * `Neumorph` and `Ivory Keys` are what they are called, which is no way to find anything.
 */
function tagged(theme: Theme): Theme {
	if (SIDEBAR_SPECS[theme.layout.sidebarStyle].relief === 'flat') return theme;
	return { ...theme, tags: [...theme.tags, '3d'] };
}

/** Made here, from a recipe. Editing one and pressing regenerate gives the design back. */
export const GENERATED_PRESETS: readonly Theme[] = PRESET_DRAFTS.map(buildTheme).map(tagged);

/** The colour × sidebar combinations, ready to take. Same machinery, more ground covered. */
export const TEMPLATE_PRESETS: readonly Theme[] = TEMPLATE_DRAFTS.map(buildTheme).map(tagged);

/** Published by other people, carried as-is. */
export const REGISTRY_PRESETS: readonly Theme[] = REGISTRY_THEMES.map((entry) =>
	tagged(buildTheme(fromRegistry(entry)))
);

export const PRESETS: readonly Theme[] = [
	...GENERATED_PRESETS,
	...TEMPLATE_PRESETS,
	...REGISTRY_PRESETS
];

/** The day the app's own themes were written. Imports carry the day they were fetched instead. */
const SHIPPED = '2026-08-13';

/**
 * When each theme entered the repository.
 *
 * Real metadata rather than a stand-in for popularity: nothing here counts downloads, because a
 * theme generated on this machine has none and a made-up figure would be worse than no column.
 * Today it separates the imports from the built-ins; it earns its keep the first time a batch is
 * added on a later date.
 */
export const ADDED_AT: ReadonlyMap<string, string> = new Map([
	...[...GENERATED_PRESETS, ...TEMPLATE_PRESETS].map(
		(theme) => [theme.id, SHIPPED] as [string, string]
	),
	...REGISTRY_THEMES.map(
		(entry) => [`tweakcn-${entry.id.replace(/^tweakcn-/, '')}`, entry.added] as [string, string]
	)
]);

export const DEFAULT_THEME: Theme = PRESETS[0] as Theme;

export function presetById(id: string): Theme | undefined {
	return PRESETS.find((preset) => preset.id === id);
}
