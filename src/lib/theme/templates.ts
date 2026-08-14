import type { Recipe } from './generate';
import type { Layout } from './layout';
import type { SidebarStyle } from './sidebar';
import { SIDEBAR_SPECS } from './sidebar';
import type { ThemeDraft } from './generate';

/**
 * Ready-made templates, built as colour × sidebar rather than as hand-written palettes.
 *
 * A template is a whole product look: a colour family decides the palette, a sidebar style decides
 * the structure, and the pairing is what you pick from. Writing them out one by one would be fifty
 * tables to keep in sync with the generator; this way a change to the ramp reaches all of them, and
 * the file stays short enough to read.
 *
 * The weighting is deliberate: black and white first, because that is what most products want,
 * then blue and red, then the loud ones.
 */

interface Family {
	key: string;
	name: string;
	tags: string[];
	recipe: Partial<Recipe> & { seed: string };
}

const FAMILIES: readonly Family[] = [
	{
		key: 'ink',
		name: 'Ink',
		tags: ['monochrome', 'minimal'],
		recipe: { seed: '#18181b', neutralChroma: 0, accentTint: 0, harmony: 'mono' }
	},
	{
		key: 'paperwhite',
		name: 'Paperwhite',
		tags: ['monochrome', 'warm'],
		recipe: {
			seed: '#1c1917',
			neutralChroma: 0.006,
			neutralHue: 75,
			accentTint: 0,
			harmony: 'mono',
			lightBackground: 0.985
		}
	},
	{
		key: 'slate',
		name: 'Slate',
		tags: ['monochrome', 'cool'],
		recipe: {
			seed: '#1e293b',
			neutralChroma: 0.008,
			neutralHue: 250,
			accentTint: 0.15,
			harmony: 'mono'
		}
	},
	{
		key: 'carbon',
		name: 'Carbon',
		tags: ['monochrome', 'tech'],
		recipe: {
			seed: '#0a0a0a',
			neutralChroma: 0,
			accentTint: 0,
			harmony: 'mono',
			contrast: 'high',
			darkBackground: 0.11
		}
	},
	{
		key: 'cobalt',
		name: 'Cobalt',
		tags: ['cool'],
		recipe: {
			seed: '#2563eb',
			neutralChroma: 0.005,
			neutralHue: 250,
			accentTint: 0.35,
			harmony: 'analogous'
		}
	},
	{
		key: 'azure',
		name: 'Azure',
		tags: ['cool', 'minimal'],
		recipe: {
			seed: '#0ea5e9',
			neutralChroma: 0.004,
			neutralHue: 240,
			accentTint: 0.3,
			harmony: 'analogous',
			contrast: 'soft'
		}
	},
	{
		key: 'crimson',
		name: 'Crimson',
		tags: ['warm', 'vivid'],
		recipe: {
			seed: '#dc2626',
			neutralChroma: 0.006,
			neutralHue: 25,
			accentTint: 0.3,
			harmony: 'complementary'
		}
	},
	{
		key: 'rose',
		name: 'Rose',
		tags: ['warm'],
		recipe: {
			seed: '#e11d48',
			neutralChroma: 0.008,
			neutralHue: 15,
			accentTint: 0.4,
			harmony: 'analogous',
			contrast: 'soft'
		}
	},
	{
		key: 'forest',
		name: 'Forest',
		tags: ['minimal'],
		recipe: {
			seed: '#16a34a',
			neutralChroma: 0.006,
			neutralHue: 150,
			accentTint: 0.3,
			harmony: 'analogous'
		}
	},
	{
		key: 'amber',
		name: 'Amber',
		tags: ['warm'],
		recipe: {
			seed: '#f59e0b',
			neutralChroma: 0.008,
			neutralHue: 65,
			accentTint: 0.4,
			harmony: 'mono'
		}
	},
	{
		key: 'violet',
		name: 'Violet',
		tags: ['vivid'],
		recipe: { seed: '#7c3aed', neutralChroma: 0, accentTint: 0.4, harmony: 'analogous' }
	},
	{
		key: 'prism',
		name: 'Prism',
		tags: ['colourful', 'vivid'],
		recipe: {
			seed: '#ec4899',
			neutralChroma: 0.01,
			neutralHue: 310,
			accentTint: 0.55,
			harmony: 'triad'
		}
	},

	// The four below exist for the landing templates: a marketing page is lit by its chart ramp —
	// the hero glow, the gradient headline and the product shot all read from it — so these families
	// carry more chroma and a wider spread than a family meant to sit behind a table all day.
	{
		key: 'neon',
		name: 'Neon',
		tags: ['tech', 'vivid', 'cool'],
		recipe: {
			seed: '#22d3ee',
			neutralChroma: 0.012,
			neutralHue: 225,
			accentTint: 0.55,
			harmony: 'analogous',
			contrast: 'high',
			lightBackground: 0.995,
			darkBackground: 0.13
		}
	},
	{
		key: 'midnight',
		name: 'Midnight',
		tags: ['tech', 'cool'],
		recipe: {
			// Indigo 600 rather than 500: at the lighter step the generator can find no foreground
			// that clears 4.5:1 against it, and a landing page is mostly one large button.
			seed: '#4f46e5',
			neutralChroma: 0.014,
			neutralHue: 265,
			accentTint: 0.5,
			harmony: 'analogous',
			darkBackground: 0.15
		}
	},
	{
		key: 'sunset',
		name: 'Sunset',
		tags: ['warm', 'colourful', 'vivid'],
		recipe: {
			seed: '#f97316',
			neutralChroma: 0.011,
			neutralHue: 40,
			accentTint: 0.5,
			harmony: 'triad',
			darkBackground: 0.16
		}
	},
	{
		key: 'acid',
		name: 'Acid',
		tags: ['tech', 'vivid'],
		recipe: {
			seed: '#84cc16',
			neutralChroma: 0.009,
			neutralHue: 125,
			accentTint: 0.35,
			harmony: 'complementary',
			contrast: 'high',
			darkBackground: 0.14
		}
	}
];

/** The structure each sidebar design implies. A style is a whole look, not just a nav strip. */
const STYLE_LAYOUT: Record<SidebarStyle, Partial<Layout>> = {
	shadcn: { radius: 0.625, density: 'normal', elevation: 'subtle' },
	piano: { radius: 0.125, density: 'normal', elevation: 'none', sidebarWidth: 15 },
	x: { radius: 1, density: 'comfortable', elevation: 'none', sidebarWidth: 17, sidebarRail: 4.5 },
	vercel: { radius: 0.375, density: 'compact', elevation: 'subtle', contentWidth: 88 },
	win11: { radius: 0.375, density: 'normal', elevation: 'subtle', sidebarWidth: 17 },
	macos: { radius: 0.5, density: 'normal', elevation: 'soft', sidebarWidth: 14, sidebarRail: 3 },
	rail: { radius: 0.5, density: 'normal', elevation: 'subtle', sidebarWidth: 13, sidebarRail: 3.5 },
	notion: { radius: 0.1875, density: 'compact', elevation: 'none', sidebarWidth: 15 },
	linear: { radius: 0.3125, density: 'compact', elevation: 'subtle', contentWidth: 84 },
	slack: { radius: 0.5, density: 'normal', elevation: 'none', sidebarWidth: 16 },
	gnome: { radius: 0.75, density: 'comfortable', elevation: 'none', sidebarWidth: 17 },
	material: {
		radius: 1,
		density: 'comfortable',
		elevation: 'soft',
		sidebarWidth: 18,
		sidebarRail: 4
	},
	brutalist: { radius: 0, density: 'normal', borderWidth: 2, elevation: 'none', sidebarWidth: 15 },
	outline: { radius: 0.375, density: 'normal', elevation: 'none', sidebarWidth: 16 },
	docked: { radius: 0.75, density: 'normal', elevation: 'lifted', sidebarWidth: 16 },
	stripe: { radius: 0.25, density: 'comfortable', elevation: 'subtle', contentWidth: 76 },
	keys: { radius: 0.2, density: 'normal', elevation: 'subtle', sidebarWidth: 15 },
	neumorph: { radius: 0.7, density: 'comfortable', elevation: 'none', sidebarWidth: 17 },
	aqua: { radius: 0.75, density: 'normal', elevation: 'soft', sidebarWidth: 16 },
	embossed: { radius: 0.35, density: 'normal', elevation: 'subtle', sidebarWidth: 16 }
};

/**
 * The fifty pairings, in the order the gallery shows them. Black and white leads because that is
 * the request most products actually have; the loud families close it out.
 */
const PLAN: readonly [familyKey: string, style: SidebarStyle, iconColor?: 'system'][] = [
	['ink', 'shadcn'],
	['ink', 'piano'],
	['ink', 'vercel'],
	['ink', 'brutalist'],
	['ink', 'outline'],
	['ink', 'linear'],
	['ink', 'notion'],
	['ink', 'stripe'],
	['ink', 'rail'],
	['ink', 'x'],
	['paperwhite', 'vercel'],
	['paperwhite', 'notion'],
	['paperwhite', 'gnome'],
	['paperwhite', 'stripe'],
	['paperwhite', 'docked'],
	['slate', 'linear'],
	['slate', 'macos', 'system'],
	['slate', 'rail'],
	['slate', 'shadcn'],
	['slate', 'docked'],
	['carbon', 'piano'],
	['carbon', 'brutalist'],
	['carbon', 'rail'],
	['carbon', 'outline'],
	['carbon', 'material'],
	['cobalt', 'win11', 'system'],
	['cobalt', 'macos', 'system'],
	['cobalt', 'material'],
	['cobalt', 'slack'],
	['cobalt', 'linear'],
	['cobalt', 'shadcn'],
	['azure', 'gnome'],
	['azure', 'notion'],
	['azure', 'docked'],
	['azure', 'stripe'],
	['crimson', 'brutalist'],
	['crimson', 'piano'],
	['crimson', 'shadcn'],
	['crimson', 'outline'],
	['crimson', 'material'],
	['rose', 'x'],
	['rose', 'gnome'],
	['rose', 'docked'],
	['forest', 'macos', 'system'],
	['forest', 'linear'],
	['amber', 'brutalist'],
	['amber', 'rail'],
	['violet', 'x'],
	['violet', 'material'],
	['prism', 'slack', 'system'],

	// The relief styles: black and white first, because a raised key reads best without a hue
	// competing with the light.
	['ink', 'keys'],
	['paperwhite', 'keys'],
	['carbon', 'embossed'],
	['slate', 'neumorph'],
	['cobalt', 'aqua'],
	['crimson', 'keys'],
	['forest', 'neumorph'],
	['amber', 'aqua'],
	['violet', 'embossed'],
	['prism', 'aqua']
];

function familyNamed(key: string): Family {
	const family = FAMILIES.find((candidate) => candidate.key === key);
	if (!family) throw new Error(`no colour family named ${key}`);
	return family;
}

function toDraft([familyKey, style, iconColor]: (typeof PLAN)[number]): ThemeDraft {
	const family = familyNamed(familyKey);
	const spec = SIDEBAR_SPECS[style];

	return {
		id: `${family.key}-${style}`,
		name: `${family.name} ${spec.label}`,
		description: `${family.name} colours in the ${spec.label} sidebar layout.`,
		tags: [...family.tags, 'template'],
		recipe: family.recipe,
		layout: { ...STYLE_LAYOUT[style], sidebarStyle: style, iconColor: iconColor ?? 'mono' }
	};
}

interface Landing {
	id: string;
	name: string;
	family: string;
	style: SidebarStyle;
	description: string;
	layout: Partial<Layout>;
}

/**
 * Templates aimed at a marketing page rather than a dashboard.
 *
 * A landing page loads a theme differently: the type runs three times larger, the page is wider
 * than any table wants to be, the shadows are the only thing separating the hero from the section
 * under it, and the chart ramp stops being data and becomes the glow behind the headline. These
 * carry the structure that suits that — and the preview has a Landing surface to judge them on,
 * because a hero cannot be assessed from a screenshot of a sidebar.
 */
const LANDING: readonly Landing[] = [
	{
		id: 'launch-ink',
		name: 'Ink Launch',
		family: 'ink',
		style: 'vercel',
		description:
			'Black on white, set wide, with the hero carried by type and a single hairline. The default answer for a developer tool.',
		layout: { radius: 0.5, density: 'comfortable', elevation: 'soft', contentWidth: 100 }
	},
	{
		id: 'launch-carbon',
		name: 'Carbon Launch',
		family: 'carbon',
		style: 'linear',
		description:
			'Near-black surfaces, tight corners and a lifted product shot. The look every infrastructure company converged on.',
		layout: { radius: 0.375, density: 'normal', elevation: 'lifted', contentWidth: 96 }
	},
	{
		id: 'launch-neon',
		name: 'Neon Launch',
		family: 'neon',
		style: 'rail',
		description:
			'Electric cyan over cool graphite, the glow doing the work the illustration usually does.',
		layout: { radius: 0.75, density: 'comfortable', elevation: 'lifted', contentWidth: 104 }
	},
	{
		id: 'launch-midnight',
		name: 'Midnight Launch',
		family: 'midnight',
		style: 'shadcn',
		description:
			'Indigo on deep blue-black, generous corners, soft shadows. Reads as a platform rather than a tool.',
		layout: { radius: 1, density: 'comfortable', elevation: 'soft', contentWidth: 100 }
	},
	{
		id: 'launch-sunset',
		name: 'Sunset Launch',
		family: 'sunset',
		style: 'gnome',
		description:
			'Orange into pink into violet across the ramp, so the headline gradient and the chart are the same three colours.',
		layout: { radius: 1.25, density: 'comfortable', elevation: 'lifted', contentWidth: 96 }
	},
	{
		id: 'launch-acid',
		name: 'Acid Launch',
		family: 'acid',
		style: 'brutalist',
		description:
			'Lime on graphite with square corners and a two-pixel frame. Loud on purpose, and legible anyway.',
		layout: {
			radius: 0,
			density: 'normal',
			borderWidth: 2,
			elevation: 'none',
			contentWidth: 92
		}
	},
	{
		id: 'launch-slate',
		name: 'Slate Launch',
		family: 'slate',
		style: 'stripe',
		description:
			'Cool grey, small caps in the navigation, and the widest measure here. The enterprise end of the range.',
		layout: { radius: 0.25, density: 'normal', elevation: 'subtle', contentWidth: 110 }
	},
	{
		id: 'launch-prism',
		name: 'Prism Launch',
		family: 'prism',
		style: 'docked',
		description:
			'A three-way split across the whole ramp and a floating sidebar. For a product whose screenshot is the pitch.',
		layout: { radius: 1, density: 'comfortable', elevation: 'lifted', contentWidth: 100 }
	}
];

function toLandingDraft(entry: Landing): ThemeDraft {
	const family = familyNamed(entry.family);

	return {
		id: entry.id,
		name: entry.name,
		description: entry.description,
		tags: [...family.tags, 'template', 'landing'],
		recipe: family.recipe,
		layout: { ...entry.layout, sidebarStyle: entry.style, iconColor: 'mono' }
	};
}

export const TEMPLATE_DRAFTS: readonly ThemeDraft[] = [
	...PLAN.map(toDraft),
	...LANDING.map(toLandingDraft)
];
