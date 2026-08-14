/**
 * A theme as points in the space it is written in.
 *
 * OKLCH is a cylinder: lightness up the middle, chroma out from it, hue around. Laying the tokens
 * out that way turns questions that are hard to answer from a list of strings — are the neutrals
 * actually neutral, is the chart ramp evenly spread, how much chroma is left before sRGB runs out —
 * into things you can see at a glance.
 *
 * The maths lives here rather than in the view because it is theme logic, and because a projection
 * that is wrong is much easier to catch in a test than in a rotating scene.
 */

import { fitToSrgb, oklchToHex, parseOklch, type Oklch } from './color';

import { paletteOf, type Theme } from './theme';
import { TOKEN_NAMES } from './tokens';

export interface SpaceScale {
	/** Length of the lightness axis, centred on zero. */
	height: number;
	/** Chroma is small — sRGB reaches about 0.37 — so it needs scaling to be visible beside it. */
	chromaScale: number;
}

// Taller than the gamut is wide, because lightness is the axis being read: the tokens of a
// monochrome theme all stack on it, and at a squarer scale they land on top of each other.
export const SPACE_SCALE: SpaceScale = { height: 3, chromaScale: 5.5 };

export interface SpacePoint {
	token: string;
	colour: Oklch;
	/** Six digits; the alpha is carried on `colour` and applied to the material instead. */
	hex: string;
	value: string;
}

/** Cylindrical to cartesian, with lightness on the vertical axis. */
export function place(
	colour: Oklch,
	scale: SpaceScale = SPACE_SCALE
): [x: number, y: number, z: number] {
	const radians = (colour.h * Math.PI) / 180;
	const radius = colour.c * scale.chromaScale;
	return [radius * Math.cos(radians), (colour.l - 0.5) * scale.height, radius * Math.sin(radians)];
}

/** Every token of one mode that is a colour at all. Order follows the exporters', so does the view. */
export function spacePoints(theme: Theme, mode: 'light' | 'dark'): SpacePoint[] {
	const palette = paletteOf(theme, mode);
	const points: SpacePoint[] = [];

	for (const token of TOKEN_NAMES) {
		const value = palette[token];
		if (!value) continue;
		const colour = parseOklch(value);
		if (colour) points.push({ token, colour, hex: oklchToHex(colour).slice(0, 7), value });
	}
	return points;
}

/** Two 8-bit channels this close apart are the same pixel; the chroma between them is not real. */
const INVISIBLE = 3;

function indistinguishable(l: number, c: number, h: number): boolean {
	const tinted = oklchToHex({ l, c, h, alpha: 1 });
	const grey = oklchToHex({ l, c: 0, h, alpha: 1 });

	return [1, 3, 5].every(
		(channel) =>
			Math.abs(
				parseInt(tinted.slice(channel, channel + 2), 16) -
					parseInt(grey.slice(channel, channel + 2), 16)
			) <= INVISIBLE
	);
}

/**
 * The chroma sRGB can still show at each lightness for one hue — the silhouette of a cut through
 * the colour solid, which tapers to a point at black and at white.
 *
 * At the black end the boundary needs the second test. `fitToSrgb` judges gamut with an absolute
 * tolerance, and down there every channel is so near zero that a chroma of about 0.05 still passes
 * it — which drew a small blunt spur under a silhouette that should come to a point. A chroma whose
 * pixel is the same as the grey beside it is not chroma the space can show.
 */
export function gamutOutline(hue: number, steps: number): number[] {
	const outline: number[] = [];

	for (let step = 0; step <= steps; step += 1) {
		const l = step / steps;
		// 0.45 is past the far edge of sRGB at every hue, so the search always starts outside and
		// converges onto the boundary rather than returning the value it was handed.
		const c = fitToSrgb({ l, c: 0.45, h: hue, alpha: 1 }).c;
		outline.push(indistinguishable(l, c, hue) ? 0 : c);
	}
	return outline;
}
