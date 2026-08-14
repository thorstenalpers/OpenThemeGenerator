import { describe, expect, it } from 'vitest';
import { fitToSrgb, oklchToHex, parseOklch } from './color';
import { buildTheme } from './generate';
import { presetById } from './presets';
import { gamutOutline, place, spacePoints, SPACE_SCALE } from './space';
import type { Theme } from './theme';

describe('placing a colour', () => {
	it('puts a grey on the axis whatever its hue says', () => {
		const [x, , z] = place({ l: 0.5, c: 0, h: 217, alpha: 1 });

		expect(Math.abs(x)).toBeLessThan(1e-9);
		expect(Math.abs(z)).toBeLessThan(1e-9);
	});

	it('runs lightness up the middle, black at the bottom and white at the top', () => {
		const black = place({ l: 0, c: 0, h: 0, alpha: 1 })[1];
		const white = place({ l: 1, c: 0, h: 0, alpha: 1 })[1];

		expect(black).toBeCloseTo(-SPACE_SCALE.height / 2, 10);
		expect(white).toBeCloseTo(SPACE_SCALE.height / 2, 10);
	});

	it('keeps the distance from the axis proportional to chroma', () => {
		const near = place({ l: 0.6, c: 0.05, h: 30, alpha: 1 });
		const far = place({ l: 0.6, c: 0.15, h: 30, alpha: 1 });
		const radius = (point: number[]) => Math.hypot(point[0] ?? 0, point[2] ?? 0);

		expect(radius(far) / radius(near)).toBeCloseTo(3, 6);
	});

	it('turns the same chroma to a different quarter for a different hue', () => {
		const [x] = place({ l: 0.6, c: 0.1, h: 0, alpha: 1 });
		const [, , z] = place({ l: 0.6, c: 0.1, h: 90, alpha: 1 });

		expect(x).toBeCloseTo(0.1 * SPACE_SCALE.chromaScale, 10);
		expect(z).toBeCloseTo(0.1 * SPACE_SCALE.chromaScale, 10);
	});
});

describe('the points of a theme', () => {
	const theme = presetById('graphite') as Theme;

	it('carries one point per colour token, in both modes', () => {
		for (const mode of ['light', 'dark'] as const) {
			const points = spacePoints(theme, mode);

			expect(points.length).toBeGreaterThan(30);
			expect(new Set(points.map((point) => point.token)).size).toBe(points.length);
			for (const point of points) expect(point.hex).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	const radius = (point: { colour: Parameters<typeof place>[0] }) =>
		Math.hypot(place(point.colour)[0], place(point.colour)[2]);

	it('stands the surfaces of a neutral theme on the axis, and a loud one well off it', () => {
		const surfaces = new Set([
			'background',
			'foreground',
			'card',
			'popover',
			'muted',
			'muted-foreground',
			'secondary',
			'accent',
			'border',
			'input',
			'sidebar',
			'sidebar-foreground',
			'sidebar-accent',
			'sidebar-border'
		]);

		const grey = spacePoints(theme, 'light').filter((point) => surfaces.has(point.token));
		expect(grey.length).toBeGreaterThan(10);
		expect(Math.max(...grey.map(radius))).toBeLessThan(0.02);

		const loud = spacePoints(presetById('spectrum') as Theme, 'light');
		expect(Math.max(...loud.map(radius))).toBeGreaterThan(0.5);
	});

	/**
	 * The one thing the space shows that a swatch does not: Graphite's brand colour is not actually
	 * neutral. Its seed is zinc-900, which carries a little blue, and a grey seed is passed through
	 * as given rather than flattened — so `primary` stands just off the axis while every surface
	 * derived from `neutralChroma: 0` sits on it.
	 */
	it('keeps the seed of a grey theme exactly as given, off the axis and all', () => {
		const primary = spacePoints(theme, 'light').find((point) => point.token === 'primary');

		expect(primary?.colour.c).toBeGreaterThan(0);
		expect(radius(primary as { colour: Parameters<typeof place>[0] })).toBeGreaterThan(0.02);
		expect(radius(primary as { colour: Parameters<typeof place>[0] })).toBeLessThan(0.1);
	});

	it('keeps a translucent token, because dropping it would hide a real value', () => {
		const dark = spacePoints(theme, 'dark');
		const border = dark.find((point) => point.token === 'border');

		expect(border?.colour.alpha).toBeLessThan(1);
	});
});

describe('the sRGB outline', () => {
	it('closes at white, where there is no chroma left to have', () => {
		expect(gamutOutline(250, 32).at(-1)).toBeLessThan(0.001);
	});

	it('closes at black too, where the gamut check alone would leave a spur', () => {
		expect(gamutOutline(250, 32)[0]).toBe(0);
	});

	it.each([0, 90, 180, 250])('reports nothing invisible at %s degrees', (hue) => {
		const steps = 40;

		for (const [step, chroma] of gamutOutline(hue, steps).entries()) {
			if (chroma === 0) continue;
			const l = step / steps;
			const tinted = oklchToHex({ l, c: chroma, h: hue, alpha: 1 });
			const grey = oklchToHex({ l, c: 0, h: hue, alpha: 1 });

			// Whatever chroma survives has to change the pixel; otherwise it is width the eye cannot
			// see, drawn onto a silhouette people read as the shape of the space.
			expect(tinted, `${hue}deg at L=${l.toFixed(2)}`).not.toBe(grey);
		}
	});

	it('bulges in the middle, which is where the colours actually are', () => {
		const outline = gamutOutline(250, 32);
		const peak = Math.max(...outline);

		expect(peak).toBeGreaterThan(0.1);
		expect(outline.indexOf(peak)).toBeGreaterThan(2);
		expect(outline.indexOf(peak)).toBeLessThan(30);
	});

	it.each([0, 60, 120, 180, 250, 300])('is the real boundary at %s degrees', (hue) => {
		const steps = 16;
		const outline = gamutOutline(hue, steps);

		for (const [step, chroma] of outline.entries()) {
			const l = step / steps;
			if (chroma < 0.005) continue;

			// On the boundary: the value itself survives a re-fit, and a nudge outwards does not.
			expect(fitToSrgb({ l, c: chroma, h: hue, alpha: 1 }).c).toBeCloseTo(chroma, 4);
			expect(fitToSrgb({ l, c: chroma + 0.02, h: hue, alpha: 1 }).c).toBeLessThan(chroma + 0.02);
		}
	});

	it('reaches further for the hues sRGB is widest in', () => {
		const peak = (hue: number) => Math.max(...gamutOutline(hue, 48));

		// Blue and red are the corners of the sRGB cube; the yellow-green side of it is shallower in
		// chroma even though it is the brightest.
		expect(peak(264)).toBeGreaterThan(peak(120));
	});
});

describe('the space of a generated theme', () => {
	it('spreads a triad ramp around the axis rather than stacking it on one side', () => {
		const theme = buildTheme({
			id: 'triad-space',
			name: 'Triad',
			recipe: { seed: '#ec4899', harmony: 'triad', neutralChroma: 0.01 }
		});

		const hues = spacePoints(theme, 'light')
			.filter((point) => point.token.startsWith('chart-'))
			.map((point) => point.colour.h);

		expect(Math.max(...hues) - Math.min(...hues)).toBeGreaterThan(120);
	});

	it('reads the same hue back out of the token it wrote', () => {
		const theme = buildTheme({
			id: 'hue-space',
			name: 'Hue',
			recipe: { seed: '#2563eb' }
		});

		const seedHue = parseOklch(theme.light.primary ?? '')?.h ?? 0;
		const [x, , z] = place({ l: 0.5, c: 0.1, h: seedHue, alpha: 1 });
		const back = ((Math.atan2(z, x) * 180) / Math.PI + 360) % 360;

		expect(back).toBeCloseTo(seedHue, 6);
	});
});
