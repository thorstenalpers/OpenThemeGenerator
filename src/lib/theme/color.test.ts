import { describe, expect, it } from 'vitest';
import {
	contrast,
	fitToSrgb,
	flatten,
	formatOklch,
	hexToOklch,
	oklchToHex,
	oklchToHslChannels,
	parseOklch,
	readableOn
} from './color';

describe('parsing', () => {
	it('reads the forms a theme file actually contains', () => {
		expect(parseOklch('oklch(0.145 0 0)')).toEqual({ l: 0.145, c: 0, h: 0, alpha: 1 });
		expect(parseOklch('oklch(1 0 0 / 10%)')?.alpha).toBeCloseTo(0.1, 5);
		expect(parseOklch('oklch(62.31% 0.188 259.81)')?.l).toBeCloseTo(0.6231, 4);
	});

	it('answers null instead of throwing on text a model made up', () => {
		expect(parseOklch('rebeccapurple')).toBeNull();
		expect(parseOklch('rgb(1 2 3)')).toBeNull();
		expect(hexToOklch('#zzz')).toBeNull();
	});

	it('keeps alpha out of the string when the colour is opaque', () => {
		expect(formatOklch({ l: 0.5, c: 0.1, h: 200, alpha: 1 })).toBe('oklch(0.5 0.1 200)');
		expect(formatOklch({ l: 0.5, c: 0.1, h: 200, alpha: 0.1 })).toBe('oklch(0.5 0.1 200 / 10%)');
	});
});

describe('conversion', () => {
	it('round-trips sRGB through OKLCH', () => {
		for (const hex of ['#000000', '#ffffff', '#3b82f6', '#e11d48', '#14b8a6', '#18181b']) {
			const oklch = hexToOklch(hex);
			expect(oklch).not.toBeNull();
			expect(oklchToHex(oklch!)).toBe(hex);
		}
	});

	it('drops chroma rather than clipping channels when a colour leaves sRGB', () => {
		const impossible = { l: 0.6, c: 0.4, h: 150, alpha: 1 };
		const fitted = fitToSrgb(impossible);

		expect(fitted.c).toBeLessThan(impossible.c);
		// The hue is what a per-channel clip would have moved, and it is what the eye names first.
		expect(fitted.h).toBe(impossible.h);
		expect(fitted.l).toBe(impossible.l);
	});

	it('composites a translucent token onto the surface behind it', () => {
		const white = { l: 1, c: 0, h: 0, alpha: 0.1 };
		const black = { l: 0.145, c: 0, h: 0, alpha: 1 };
		const flat = flatten(white, black);

		expect(flat.alpha).toBe(1);
		expect(flat.l).toBeGreaterThan(black.l);
		expect(flat.l).toBeLessThan(0.35);
	});

	it('writes the three channels Tailwind v3 expects', () => {
		expect(oklchToHslChannels({ l: 1, c: 0, h: 0, alpha: 1 })).toBe('0 0% 100%');
		expect(oklchToHslChannels({ l: 0, c: 0, h: 0, alpha: 1 })).toBe('0 0% 0%');

		const red = hexToOklch('#ff0000');
		expect(oklchToHslChannels(red!)).toBe('0 100% 50%');
	});
});

describe('contrast', () => {
	it('puts black on white at the top of the scale', () => {
		expect(contrast('oklch(1 0 0)', 'oklch(0 0 0)')).toBeCloseTo(21, 1);
		expect(contrast('oklch(1 0 0)', 'oklch(1 0 0)')).toBeCloseTo(1, 5);
	});

	it('picks the label a surface can actually carry', () => {
		expect(readableOn({ l: 0.15, c: 0, h: 0, alpha: 1 }).l).toBeGreaterThan(0.9);
		expect(readableOn({ l: 0.95, c: 0, h: 0, alpha: 1 }).l).toBeLessThan(0.3);
	});
});
