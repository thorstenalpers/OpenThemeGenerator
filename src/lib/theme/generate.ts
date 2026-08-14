import {
	clamp,
	fitToSrgb,
	formatOklch,
	hexToOklch,
	parseOklch,
	readableOn,
	rotateHue,
	type Oklch
} from './color';
import { DEFAULT_LAYOUT, type Layout } from './layout';
import type { Palette } from './tokens';
import type { Theme } from './theme';

export const HARMONIES = ['mono', 'analogous', 'complementary', 'triad'] as const;
export type Harmony = (typeof HARMONIES)[number];

export const CONTRASTS = ['soft', 'normal', 'high'] as const;
export type Contrast = (typeof CONTRASTS)[number];

export const SIDEBAR_TONES = ['flush', 'tinted', 'contrast'] as const;
export type SidebarTone = (typeof SIDEBAR_TONES)[number];

/** How far the sidebar surface steps away from the page background, per mode. */
const TONE_STEP: Record<SidebarTone, { light: number; dark: number }> = {
	flush: { light: 0, dark: 0 },
	tinted: { light: -0.015, dark: 0.03 },
	contrast: { light: -0.045, dark: 0.075 }
};

export interface Recipe {
	/** The brand colour, as hex or `oklch(...)`. Everything else is derived from it. */
	seed: string;
	/** Chroma of the greys. 0 is a true neutral; above ~0.02 the surfaces read as tinted. */
	neutralChroma: number;
	/** Hue of the greys. Left out, they follow the seed. */
	neutralHue?: number;
	/** How far the seed hue bleeds into `accent` and the raised surfaces, 0–1. */
	accentTint: number;
	harmony: Harmony;
	contrast: Contrast;
	/** How far the sidebar separates itself from the page. */
	sidebarTone: SidebarTone;
	/** Lightness of the light-mode page background. */
	lightBackground: number;
	/** Lightness of the dark-mode page background. */
	darkBackground: number;
}

export const DEFAULT_RECIPE: Recipe = {
	seed: '#6366f1',
	neutralChroma: 0,
	accentTint: 0.35,
	harmony: 'analogous',
	contrast: 'normal',
	sidebarTone: 'tinted',
	lightBackground: 1,
	darkBackground: 0.145
};

/** How far the text pulls away from its surface. `soft` is calmer, `high` is the accessible end. */
const CONTRAST_SHIFT: Record<Contrast, { text: number; muted: number }> = {
	soft: { text: 0.08, muted: 0.06 },
	normal: { text: 0, muted: 0 },
	high: { text: -0.03, muted: -0.06 }
};

const CHART_OFFSETS: Record<Harmony, number[]> = {
	mono: [0, 0, 0, 0, 0],
	analogous: [0, 28, 56, -28, -56],
	complementary: [0, 180, 30, 210, 60],
	triad: [0, 120, 240, 60, 300]
};

/** Chart series need to stay apart, so their lightness ladders even when their hue does not. */
const CHART_LIGHTNESS = [0, -0.08, 0.08, -0.16, 0.16];

/** Below this the seed is a grey, and a hue derived from it would be arbitrary. */
const GREY_THRESHOLD = 0.02;

/** The hue charts fall back to in a neutral theme: five greys are not a readable series. */
const DATA_HUE = 250;

function toOklch(value: string): Oklch {
	return fitToSrgb(parseOklch(value) ?? hexToOklch(value) ?? { l: 0.5, c: 0, h: 0, alpha: 1 });
}

function color(l: number, c: number, h: number): string {
	return formatOklch(fitToSrgb({ l: clamp(l, 0, 1), c: Math.max(0, c), h, alpha: 1 }));
}

function pairedFor(surface: string): string {
	return formatOklch(readableOn(toOklch(surface)));
}

/**
 * Both palettes of a theme, derived from one seed colour.
 *
 * The two modes are built by the same rules with the ramp inverted rather than by two hand-written
 * tables, so a change to the seed cannot leave light and dark disagreeing about what `muted` means.
 */
export function buildPalettes(recipe: Recipe): { light: Palette; dark: Palette } {
	const seed = toOklch(recipe.seed);
	const neutralHue = recipe.neutralHue ?? seed.h;
	const shift = CONTRAST_SHIFT[recipe.contrast];
	const isGrey = seed.c < GREY_THRESHOLD;
	const tint = seed.c * recipe.accentTint;

	const chartHue = isGrey ? DATA_HUE : seed.h;
	const chartChroma = isGrey ? 0.12 : Math.max(0.09, seed.c);
	const charts = (base: number): string[] =>
		CHART_OFFSETS[recipe.harmony].map((offset, index) => {
			const hue = rotateHue({ ...seed, h: chartHue }, offset).h;
			const step = CHART_LIGHTNESS[index] ?? 0;
			const spread = recipe.harmony === 'mono' ? step * 1.6 : step;
			return color(base + spread, chartChroma, hue);
		});

	const light = ((): Palette => {
		const bg = recipe.lightBackground;
		const fg = 0.16 + shift.text;
		const raised = bg >= 0.995 ? bg : Math.min(1, bg + 0.012);
		// A grey seed stays as given — that is a deliberate near-black primary, not a colour that
		// happens to be dark. A chromatic seed is pulled into the band where it can carry white text.
		const primary = isGrey ? seed : { ...seed, l: clamp(seed.l, 0.42, 0.68) };
		const primaryValue = color(primary.l, primary.c, primary.h);

		return {
			background: color(bg, recipe.neutralChroma, neutralHue),
			foreground: color(fg, recipe.neutralChroma, neutralHue),
			card: color(raised, recipe.neutralChroma, neutralHue),
			'card-foreground': color(fg, recipe.neutralChroma, neutralHue),
			popover: color(raised, recipe.neutralChroma, neutralHue),
			'popover-foreground': color(fg, recipe.neutralChroma, neutralHue),
			muted: color(bg - 0.03, recipe.neutralChroma, neutralHue),
			'muted-foreground': color(0.53 + shift.muted, recipe.neutralChroma, neutralHue),
			border: color(bg - 0.08, recipe.neutralChroma, neutralHue),
			input: color(bg - 0.08, recipe.neutralChroma, neutralHue),

			primary: primaryValue,
			'primary-foreground': pairedFor(primaryValue),
			secondary: color(bg - 0.04, recipe.neutralChroma, neutralHue),
			'secondary-foreground': color(fg + 0.07, recipe.neutralChroma, neutralHue),
			accent: color(bg - 0.05, recipe.neutralChroma + tint * 0.8, seed.h),
			'accent-foreground': color(fg + 0.07, tint * 1.2, seed.h),
			ring: primaryValue,

			destructive: color(0.58, 0.21, 27),
			'destructive-foreground': color(0.99, 0, 0),
			// Darker than the badge colour a designer would reach for: green is the hue sRGB is
			// brightest in, and at the usual lightness white text on it lands under 4.5:1.
			success: color(0.51, 0.13, 150),
			'success-foreground': color(0.99, 0, 0),
			warning: color(0.75, 0.15, 75),
			'warning-foreground': color(0.22, 0.03, 75),

			...Object.fromEntries(charts(0.6).map((value, index) => [`chart-${index + 1}`, value])),

			sidebar: color(bg + TONE_STEP[recipe.sidebarTone].light, recipe.neutralChroma, neutralHue),
			'sidebar-foreground': color(fg, recipe.neutralChroma, neutralHue),
			'sidebar-primary': primaryValue,
			'sidebar-primary-foreground': pairedFor(primaryValue),
			'sidebar-accent': color(bg - 0.05, recipe.neutralChroma + tint * 0.8, seed.h),
			'sidebar-accent-foreground': color(fg + 0.07, tint * 1.2, seed.h),
			'sidebar-border': color(bg - 0.08, recipe.neutralChroma, neutralHue),
			'sidebar-ring': primaryValue
		};
	})();

	const dark = ((): Palette => {
		const bg = recipe.darkBackground;
		const fg = 0.97 - shift.text;
		// A near-black primary would vanish here, so a grey seed flips to the light end of the ramp
		// instead of being darkened further.
		const primary = isGrey
			? { ...seed, l: 0.92 }
			: { ...seed, l: clamp(seed.l + 0.06, 0.62, 0.82), c: seed.c * 0.92 };
		const primaryValue = color(primary.l, primary.c, primary.h);

		return {
			background: color(bg, recipe.neutralChroma, neutralHue),
			foreground: color(fg, recipe.neutralChroma * 0.5, neutralHue),
			card: color(bg + 0.045, recipe.neutralChroma, neutralHue),
			'card-foreground': color(fg, recipe.neutralChroma * 0.5, neutralHue),
			popover: color(bg + 0.045, recipe.neutralChroma, neutralHue),
			'popover-foreground': color(fg, recipe.neutralChroma * 0.5, neutralHue),
			muted: color(bg + 0.09, recipe.neutralChroma, neutralHue),
			'muted-foreground': color(0.71 - shift.muted, recipe.neutralChroma, neutralHue),
			// Translucent white, as shadcn writes it in dark mode: a border that keeps its weight
			// over `background` and over the raised `card` without being two different tokens.
			border: 'oklch(1 0 0 / 10%)',
			input: 'oklch(1 0 0 / 15%)',

			primary: primaryValue,
			'primary-foreground': pairedFor(primaryValue),
			secondary: color(bg + 0.11, recipe.neutralChroma, neutralHue),
			'secondary-foreground': color(fg, recipe.neutralChroma * 0.5, neutralHue),
			accent: color(bg + 0.12, recipe.neutralChroma + tint * 0.6, seed.h),
			'accent-foreground': color(fg, tint * 0.4, seed.h),
			ring: primaryValue,

			destructive: color(0.7, 0.19, 22),
			'destructive-foreground': color(0.16, 0.02, 22),
			success: color(0.72, 0.16, 150),
			'success-foreground': color(0.16, 0.02, 150),
			warning: color(0.8, 0.16, 80),
			'warning-foreground': color(0.18, 0.03, 80),

			...Object.fromEntries(charts(0.7).map((value, index) => [`chart-${index + 1}`, value])),

			sidebar: color(bg + TONE_STEP[recipe.sidebarTone].dark, recipe.neutralChroma, neutralHue),
			'sidebar-foreground': color(fg, recipe.neutralChroma * 0.5, neutralHue),
			'sidebar-primary': primaryValue,
			'sidebar-primary-foreground': pairedFor(primaryValue),
			'sidebar-accent': color(bg + 0.12, recipe.neutralChroma + tint * 0.6, seed.h),
			'sidebar-accent-foreground': color(fg, tint * 0.4, seed.h),
			'sidebar-border': 'oklch(1 0 0 / 10%)',
			'sidebar-ring': primaryValue
		};
	})();

	return { light, dark };
}

export interface ThemeDraft {
	id: string;
	name: string;
	description?: string;
	tags?: string[];
	recipe: Partial<Recipe> & { seed: string };
	/** Geometry, which no colour rule derives. */
	layout?: Partial<Layout>;
	/** Token values that win over the derived ones, per mode. */
	overrides?: { light?: Palette; dark?: Palette };
}

export function buildTheme(draft: ThemeDraft): Theme {
	const recipe: Recipe = { ...DEFAULT_RECIPE, ...draft.recipe };
	const { light, dark } = buildPalettes(recipe);

	return {
		id: draft.id,
		name: draft.name,
		description: draft.description ?? '',
		tags: draft.tags ?? [],
		layout: { ...DEFAULT_LAYOUT, ...draft.layout },
		light: { ...light, ...draft.overrides?.light },
		dark: { ...dark, ...draft.overrides?.dark }
	};
}
