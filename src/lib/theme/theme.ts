import { z } from 'zod';
import { contrast, formatOklch, hexToOklch, parseOklch } from './color';
import { DEFAULT_LAYOUT, DENSITIES, ELEVATIONS, type Layout } from './layout';
import { ICON_COLOR_MODES, SIDEBAR_STYLES } from './sidebar';
import { TOKEN_NAMES, TOKEN_PAIRS, type Palette } from './tokens';

/**
 * A theme is two palettes and the structure they sit in. No fonts: a theme that names a typeface
 * it cannot ship is worse than one that leaves the host's typography alone — the type *scale*,
 * which needs no assets, is part of the layout.
 */
export interface Theme {
	/** Kebab-case, and the name every export uses for its class and its file. */
	id: string;
	name: string;
	description: string;
	tags: string[];
	layout: Layout;
	light: Palette;
	dark: Palette;
}

/**
 * Any CSS colour a model might answer with, normalised to `oklch(...)`. Hex is accepted because it
 * is what a model reaches for unprompted, and rejecting it would fail a reply that is otherwise
 * exactly right.
 */
const colorValue = z.string().transform((raw, context) => {
	const trimmed = raw.trim();
	const oklch = parseOklch(trimmed) ?? hexToOklch(trimmed);
	if (!oklch) {
		context.addIssue({ code: 'custom', message: `not a colour this app can read: ${raw}` });
		return z.NEVER;
	}
	return formatOklch(oklch);
});

const palette = z.record(z.string(), colorValue);

export const themeSchema = z.object({
	id: z
		.string()
		.min(1)
		.transform((value) =>
			value
				.trim()
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '')
		),
	name: z.string().min(1),
	description: z.string().default(''),
	tags: z.array(z.string()).default([]),
	layout: z
		.object({
			density: z.enum(DENSITIES).default(DEFAULT_LAYOUT.density),
			radius: z.number().min(0).max(2).default(DEFAULT_LAYOUT.radius),
			borderWidth: z.number().min(0).max(4).default(DEFAULT_LAYOUT.borderWidth),
			elevation: z.enum(ELEVATIONS).default(DEFAULT_LAYOUT.elevation),
			sidebarWidth: z.number().min(8).max(28).default(DEFAULT_LAYOUT.sidebarWidth),
			sidebarRail: z.number().min(2).max(8).default(DEFAULT_LAYOUT.sidebarRail),
			sidebarStyle: z.enum(SIDEBAR_STYLES).default(DEFAULT_LAYOUT.sidebarStyle),
			iconColor: z.enum(ICON_COLOR_MODES).default(DEFAULT_LAYOUT.iconColor),
			contentWidth: z.number().min(40).max(120).default(DEFAULT_LAYOUT.contentWidth)
		})
		.default(DEFAULT_LAYOUT),
	light: palette,
	dark: palette
});

export interface ThemeProblem {
	mode: 'light' | 'dark';
	token: string;
	kind: 'missing' | 'unknown';
}

/** What a palette is missing, and what it carries that no exporter knows what to do with. */
export function inspect(theme: Theme): ThemeProblem[] {
	const problems: ThemeProblem[] = [];
	for (const mode of ['light', 'dark'] as const) {
		const supplied = theme[mode];
		for (const token of TOKEN_NAMES) {
			if (supplied[token] === undefined) problems.push({ mode, token, kind: 'missing' });
		}
		for (const token of Object.keys(supplied)) {
			if (!TOKEN_NAMES.includes(token)) problems.push({ mode, token, kind: 'unknown' });
		}
	}
	return problems;
}

/**
 * A theme with every token present, in the canonical order, and nothing else. A palette missing a
 * token borrows it from `fallback` rather than leaving a hole an app would paint transparent.
 */
export function complete(theme: Theme, fallback: Theme): Theme {
	const fill = (mode: 'light' | 'dark'): Palette => {
		const supplied = theme[mode];
		const backup = fallback[mode];
		return Object.fromEntries(
			TOKEN_NAMES.map((token) => [token, supplied[token] ?? backup[token] ?? 'oklch(0.5 0 0)'])
		);
	};

	return {
		...theme,
		light: fill('light'),
		dark: fill('dark')
	};
}

export function paletteOf(theme: Theme, mode: 'light' | 'dark'): Palette {
	return mode === 'dark' ? theme.dark : theme.light;
}

/**
 * The surface/label pairs that fall below the 4.5:1 body text needs.
 *
 * Imported themes are carried exactly as published, which means some of them do not clear the bar.
 * Silently passing that on would be the worst of both: the user gets a theme that fails an audit
 * later, with nothing at the moment of choosing to warn them.
 */
/**
 * A theme's readability as one number, 0–100.
 *
 * This is what the gallery ranks by. It is not popularity — nothing here counts downloads or
 * stars, because no such figure exists for a locally generated theme and inventing one would make
 * the column a decoration. It is the mean contrast of every surface/label pair, normalised against
 * the 7:1 that AAA asks for and floored at the pair that scores worst, so one unreadable pairing
 * cannot be averaged away by thirty comfortable ones.
 */
export function readabilityScore(theme: Theme): number {
	const ratios: number[] = [];
	for (const mode of ['light', 'dark'] as const) {
		const palette = paletteOf(theme, mode);
		for (const { surface, label } of TOKEN_PAIRS) {
			ratios.push(contrast(palette[surface] ?? '', palette[label] ?? ''));
		}
	}
	if (ratios.length === 0) return 0;

	const mean = ratios.reduce((total, ratio) => total + ratio, 0) / ratios.length;
	const worst = Math.min(...ratios);
	const scaled = (Math.min(mean, 7) / 7) * 0.7 + (Math.min(worst, 4.5) / 4.5) * 0.3;
	return Math.round(scaled * 100);
}

/** Every surface/label pair that a reader would struggle with, and by how much it misses. */
export function lowContrastPairs(
	theme: Theme
): { mode: 'light' | 'dark'; pair: string; ratio: number }[] {
	const found: { mode: 'light' | 'dark'; pair: string; ratio: number }[] = [];
	for (const mode of ['light', 'dark'] as const) {
		const palette = paletteOf(theme, mode);
		for (const { surface, label } of TOKEN_PAIRS) {
			const ratio = contrast(palette[surface] ?? '', palette[label] ?? '');
			if (ratio < 4.5) found.push({ mode, pair: `${surface}/${label}`, ratio });
		}
	}
	return found;
}
