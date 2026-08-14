/**
 * Colour maths in OKLCH, the space shadcn and Tailwind v4 write their tokens in.
 *
 * Everything the editor shows and every exported value round-trips through here, so hue and
 * lightness stay the numbers the user set rather than drifting through an sRGB detour.
 */

export interface Oklch {
	/** Perceived lightness, 0–1. */
	l: number;
	/** Chroma. 0 is grey; sRGB runs out somewhere below 0.37 depending on hue. */
	c: number;
	/** Hue angle in degrees, 0–360. */
	h: number;
	/** 0–1. Only written out when it is below 1. */
	alpha: number;
}

const OKLCH_PATTERN =
	/^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?)\s*)?\)$/i;

export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function ratio(raw: string): number {
	return raw.endsWith('%') ? Number(raw.slice(0, -1)) / 100 : Number(raw);
}

/** `null` rather than a throw: the parser also runs on text a model wrote. */
export function parseOklch(value: string): Oklch | null {
	const match = OKLCH_PATTERN.exec(value.trim());
	if (!match) return null;

	const [, rawL, rawC, rawH, rawAlpha] = match;
	if (rawL === undefined || rawC === undefined || rawH === undefined) return null;

	const l = ratio(rawL);
	const c = rawC.endsWith('%') ? Number(rawC.slice(0, -1)) / 250 : Number(rawC);
	const h = Number(rawH);
	const alpha = rawAlpha === undefined ? 1 : ratio(rawAlpha);
	if ([l, c, h, alpha].some((n) => !Number.isFinite(n))) return null;

	return {
		l: clamp(l, 0, 1),
		c: Math.max(0, c),
		h: ((h % 360) + 360) % 360,
		alpha: clamp(alpha, 0, 1)
	};
}

function trim(value: number, digits: number): string {
	return Number(value.toFixed(digits)).toString();
}

/** A grey's hue is arithmetic noise — it is written as 0, the way shadcn writes its neutrals. */
export function formatOklch({ l, c, h, alpha }: Oklch): string {
	const base = `${trim(l, 4)} ${trim(c, 4)} ${trim(c < 1e-4 ? 0 : h, 2)}`;
	return alpha >= 1 ? `oklch(${base})` : `oklch(${base} / ${trim(alpha * 100, 1)}%)`;
}

function toLinear(channel: number): number {
	return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function toGamma(channel: number): number {
	return channel <= 0.0031308 ? channel * 12.92 : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
}

interface Rgb {
	r: number;
	g: number;
	b: number;
}

/** Ottosson's Oklab → linear sRGB. Values outside 0–1 mean the colour is out of gamut. */
function oklabToLinear(l: number, a: number, b: number): Rgb {
	const lp = l + 0.3963377774 * a + 0.2158037573 * b;
	const mp = l - 0.1055613458 * a - 0.0638541728 * b;
	const sp = l - 0.0894841775 * a - 1.291485548 * b;

	const lc = lp * lp * lp;
	const mc = mp * mp * mp;
	const sc = sp * sp * sp;

	return {
		r: 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
		g: -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
		b: -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc
	};
}

function linearToOklab(rgb: Rgb): { l: number; a: number; b: number } {
	const r = toLinear(rgb.r);
	const g = toLinear(rgb.g);
	const b = toLinear(rgb.b);

	const lc = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const mc = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const sc = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

	return {
		l: 0.2104542553 * lc + 0.793617785 * mc - 0.0040720468 * sc,
		a: 1.9779984951 * lc - 2.428592205 * mc + 0.4505937099 * sc,
		b: 0.0259040371 * lc + 0.7827717662 * mc - 0.808675766 * sc
	};
}

function inGamut({ r, g, b }: Rgb): boolean {
	const epsilon = 1e-4;
	return [r, g, b].every((channel) => channel >= -epsilon && channel <= 1 + epsilon);
}

/**
 * The chroma sRGB can still show at this lightness and hue. Out-of-gamut values would otherwise
 * be clipped per channel, which shifts the hue — dropping chroma keeps the colour recognisable.
 */
export function fitToSrgb(color: Oklch): Oklch {
	const radians = (color.h * Math.PI) / 180;
	const at = (c: number) => oklabToLinear(color.l, c * Math.cos(radians), c * Math.sin(radians));

	if (inGamut(at(color.c))) return color;

	let low = 0;
	let high = color.c;
	for (let step = 0; step < 24; step += 1) {
		const mid = (low + high) / 2;
		if (inGamut(at(mid))) low = mid;
		else high = mid;
	}
	return { ...color, c: low };
}

function channelToHex(channel: number): string {
	return Math.round(clamp(channel, 0, 1) * 255)
		.toString(16)
		.padStart(2, '0');
}

function toSrgb(color: Oklch): Rgb {
	const fitted = fitToSrgb(color);
	const radians = (fitted.h * Math.PI) / 180;
	const linear = oklabToLinear(
		fitted.l,
		fitted.c * Math.cos(radians),
		fitted.c * Math.sin(radians)
	);
	return { r: toGamma(linear.r), g: toGamma(linear.g), b: toGamma(linear.b) };
}

/** Eight digits when the colour is translucent, so the alpha survives the conversion. */
export function oklchToHex(color: Oklch): string {
	const { r, g, b } = toSrgb(color);
	const alpha = color.alpha >= 1 ? '' : channelToHex(color.alpha);
	return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}${alpha}`;
}

/**
 * A translucent colour composited over the surface behind it. Targets that cannot carry alpha in a
 * token — Tailwind v3 splits colours into HSL channels — need the flat result instead.
 */
export function flatten(color: Oklch, backdrop: Oklch): Oklch {
	if (color.alpha >= 1) return color;

	const front = toSrgb(color);
	const back = toSrgb(backdrop);
	const mix = (a: number, b: number) => a * color.alpha + b * (1 - color.alpha);
	const hex = `#${channelToHex(mix(front.r, back.r))}${channelToHex(mix(front.g, back.g))}${channelToHex(mix(front.b, back.b))}`;
	return hexToOklch(hex) ?? { ...color, alpha: 1 };
}

/** `H S% L%` — the three channels shadcn writes into a Tailwind v3 custom property. */
export function oklchToHslChannels(color: Oklch): string {
	const { r, g, b } = toSrgb(color);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	const delta = max - min;

	let h = 0;
	if (delta > 1e-6) {
		if (max === r) h = ((g - b) / delta) % 6;
		else if (max === g) h = (b - r) / delta + 2;
		else h = (r - g) / delta + 4;
		h = (h * 60 + 360) % 360;
	}
	const s = delta < 1e-6 ? 0 : delta / (1 - Math.abs(2 * l - 1));
	return `${trim(h, 1)} ${trim(clamp(s, 0, 1) * 100, 1)}% ${trim(clamp(l, 0, 1) * 100, 1)}%`;
}

export function hexToOklch(hex: string): Oklch | null {
	const cleaned = hex.trim().replace(/^#/, '');
	const full =
		cleaned.length === 3
			? cleaned
					.split('')
					.map((char) => char + char)
					.join('')
			: cleaned;
	if (!/^[0-9a-f]{6}$/i.test(full)) return null;

	const rgb = {
		r: parseInt(full.slice(0, 2), 16) / 255,
		g: parseInt(full.slice(2, 4), 16) / 255,
		b: parseInt(full.slice(4, 6), 16) / 255
	};
	const lab = linearToOklab(rgb);
	const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
	const h = c < 1e-6 ? 0 : ((Math.atan2(lab.b, lab.a) * 180) / Math.PI + 360) % 360;
	return { l: lab.l, c, h, alpha: 1 };
}

/** sRGB relative luminance, for the WCAG ratio the editor warns on. */
function luminance(hex: string): number {
	const cleaned = hex.replace(/^#/, '');
	const [r, g, b] = [0, 2, 4].map((offset) =>
		toLinear(parseInt(cleaned.slice(offset, offset + 2), 16) / 255)
	);
	return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/** WCAG 2.1 contrast, 1–21. Both arguments are token values, so alpha is ignored. */
export function contrast(a: string, b: string): number {
	const first = parseOklch(a);
	const second = parseOklch(b);
	if (!first || !second) return 1;

	const one = luminance(oklchToHex(first));
	const two = luminance(oklchToHex(second));
	return (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05);
}

/** Black or white — whichever a label on this surface can actually be read against. */
export function readableOn(surface: Oklch): Oklch {
	const light: Oklch = { l: 0.985, c: 0, h: surface.h, alpha: 1 };
	const dark: Oklch = { l: 0.16, c: 0, h: surface.h, alpha: 1 };
	const value = formatOklch(surface);
	return contrast(value, formatOklch(light)) >= contrast(value, formatOklch(dark)) ? light : dark;
}

export function withLightness(color: Oklch, l: number): Oklch {
	return { ...color, l: clamp(l, 0, 1) };
}

export function rotateHue(color: Oklch, degrees: number): Oklch {
	return { ...color, h: (((color.h + degrees) % 360) + 360) % 360 };
}

export function scaleChroma(color: Oklch, factor: number): Oklch {
	return { ...color, c: Math.max(0, color.c * factor) };
}
