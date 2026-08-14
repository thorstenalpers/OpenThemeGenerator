// Pulls published shadcn themes from the tweakcn registry into src/lib/theme/registry-themes.ts.
//
// These are other people's designs, taken as published: the values are copied, never retinted, and
// the generator does not touch them. That is the point — a gallery of what the ecosystem actually
// ships, next to what this app can derive.
//
// Run it again to refresh: `node scripts/fetch-registry-themes.mjs`

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'src',
	'lib',
	'theme',
	'registry-themes.ts'
);

/** The names tweakcn serves at /r/themes/<name>.json, with the tags this app files them under. */
const WANTED = [
	['modern-minimal', 'Modern Minimal', ['minimal', 'cool']],
	['vercel', 'Vercel', ['minimal', 'monochrome']],
	['t3-chat', 'T3 Chat', ['vivid', 'warm']],
	['mocha-mousse', 'Mocha Mousse', ['warm', 'minimal']],
	['amethyst-haze', 'Amethyst Haze', ['vivid', 'cool']],
	['notebook', 'Notebook', ['minimal', 'monochrome']],
	['doom-64', 'Doom 64', ['vivid', 'warm']],
	['graphite', 'Graphite (tweakcn)', ['minimal', 'monochrome']],
	['perpetuity', 'Perpetuity', ['cool', 'tech']],
	['kodama-grove', 'Kodama Grove', ['warm', 'minimal']],
	['cosmic-night', 'Cosmic Night', ['vivid', 'cool']],
	['tangerine', 'Tangerine', ['warm', 'vivid']],
	['quantum-rose', 'Quantum Rose', ['vivid', 'warm']],
	['nature', 'Nature', ['warm', 'minimal']],
	['bold-tech', 'Bold Tech', ['tech', 'vivid']],
	['elegant-luxury', 'Elegant Luxury', ['warm', 'vivid']],
	['midnight-bloom', 'Midnight Bloom', ['cool', 'vivid']],
	['candyland', 'Candyland', ['colourful', 'vivid']],
	['northern-lights', 'Northern Lights', ['cool', 'minimal']],
	['vintage-paper', 'Vintage Paper', ['warm', 'monochrome']],
	['sunset-horizon', 'Sunset Horizon', ['warm', 'vivid']],
	['caffeine', 'Caffeine', ['warm', 'monochrome']],
	['ocean-breeze', 'Ocean Breeze', ['cool', 'minimal']],
	['retro-arcade', 'Retro Arcade', ['vivid', 'colourful']],
	['claymorphism', 'Claymorphism', ['cool', 'minimal']],
	['clean-slate', 'Clean Slate', ['minimal', 'cool']],
	['supabase', 'Supabase', ['tech', 'cool']],
	['mono', 'Mono', ['monochrome', 'minimal']],
	['starry-night', 'Starry Night', ['cool', 'vivid']],
	['solar-dusk', 'Solar Dusk', ['warm', 'vivid']]
];

/** Only the tokens this app knows how to draw. Fonts and letter-spacing need assets it cannot ship. */
const TOKENS = [
	'background',
	'foreground',
	'card',
	'card-foreground',
	'popover',
	'popover-foreground',
	'muted',
	'muted-foreground',
	'border',
	'input',
	'primary',
	'primary-foreground',
	'secondary',
	'secondary-foreground',
	'accent',
	'accent-foreground',
	'ring',
	'destructive',
	'destructive-foreground',
	'chart-1',
	'chart-2',
	'chart-3',
	'chart-4',
	'chart-5',
	'sidebar',
	'sidebar-foreground',
	'sidebar-primary',
	'sidebar-primary-foreground',
	'sidebar-accent',
	'sidebar-accent-foreground',
	'sidebar-border',
	'sidebar-ring'
];

function pick(source) {
	const out = {};
	for (const token of TOKENS) {
		const value = source?.[token];
		if (typeof value === 'string' && value.trim()) out[token] = value.trim();
	}
	return out;
}

/** `0.5rem` -> 0.5. Anything unreadable falls back to the shadcn default rather than to zero. */
function radiusOf(theme) {
	const raw = theme?.radius;
	const parsed = typeof raw === 'string' ? Number.parseFloat(raw) : Number.NaN;
	return Number.isFinite(parsed) ? parsed : 0.625;
}

/** OKLCH hue bands, which sit differently from the HSL ones: blue lands near 260, not near 220. */
const HUES = [
	[20, 'red'],
	[50, 'orange'],
	[105, 'amber'],
	[160, 'green'],
	[215, 'teal'],
	[275, 'blue'],
	[320, 'violet'],
	[350, 'pink'],
	[360, 'red']
];

/**
 * The registry ships these without descriptions, and inventing prose for someone else's design
 * would be making up a characterisation nobody wrote. This says only what the numbers say.
 */
function describe(light, radius) {
	const match = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(light.primary ?? '');
	if (!match) return `From the tweakcn registry. ${radius}rem corners.`;

	const [, lightness, chroma, hue] = match.map(Number);
	const family =
		chroma < 0.03 ? 'near-neutral' : (HUES.find(([limit]) => hue < limit)?.[1] ?? 'red');
	const intensity = chroma < 0.03 ? '' : chroma > 0.16 ? 'vivid ' : chroma > 0.08 ? '' : 'muted ';
	const weight = lightness < 0.45 ? 'dark' : lightness > 0.72 ? 'light' : 'mid-tone';
	const corners =
		radius < 0.2 ? 'square corners' : radius > 0.8 ? 'very round' : `${radius}rem corners`;

	return `A ${intensity}${weight} ${family} brand colour, ${corners}. From the tweakcn registry.`;
}

const stamp = new Date().toISOString().slice(0, 10);
const collected = [];
const failed = [];

for (const [slug, name, tags] of WANTED) {
	try {
		const response = await fetch(`https://tweakcn.com/r/themes/${slug}.json`);
		if (!response.ok) {
			failed.push(`${slug} (HTTP ${response.status})`);
			continue;
		}
		const item = await response.json();
		const light = pick(item?.cssVars?.light);
		const dark = pick(item?.cssVars?.dark);

		// A theme that only defines half its tokens would be completed from the fallback and stop
		// being the design it claims to be. Better to skip it and say so.
		if (Object.keys(light).length < 20 || Object.keys(dark).length < 20) {
			failed.push(`${slug} (only ${Object.keys(light).length}/${Object.keys(dark).length} tokens)`);
			continue;
		}

		const radius = radiusOf(item?.cssVars?.theme);
		collected.push({
			// Namespaced, because the registry and this app both ship a theme called Graphite and an
			// id is what an export file is named after.
			id: `tweakcn-${slug}`,
			name,
			description: describe(light, radius),
			added: stamp,
			tags,
			radius,
			light,
			dark
		});
	} catch (error) {
		failed.push(`${slug} (${error.message})`);
	}
}

const body = `
/**
 * Published shadcn themes, retrieved from the tweakcn registry (https://tweakcn.com/r/themes/) on
 * ${stamp}.
 *
 * Generated by scripts/fetch-registry-themes.mjs — do not edit by hand.
 *
 * Token values are taken as published; nothing is retinted here. Only the surface tokens this app
 * declares are carried over: the fonts, letter-spacing and shadows those themes also define would
 * need font files this app does not ship. Structure is this app's own — a registry theme has no
 * opinion about sidebars — so each one is given the shadcn defaults and can be restyled in the
 * studio like anything else.
 */

import type { Palette } from './tokens';

export interface RegistryTheme {
	id: string;
	name: string;
	description: string;
	tags: string[];
	radius: number;
	/** When this entry entered the repository, which is what the gallery sorts 'recent' by. */
	added: string;
	light: Palette;
	dark: Palette;
}

export const REGISTRY_THEMES: readonly RegistryTheme[] = ${JSON.stringify(collected, null, '\t')};
`;

writeFileSync(OUT, body);
console.log(`${collected.length} themes written to src/lib/theme/registry-themes.ts`);
if (failed.length) console.log(`skipped: ${failed.join(', ')}`);
