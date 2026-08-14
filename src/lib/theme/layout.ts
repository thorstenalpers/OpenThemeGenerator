/**
 * The structural half of a theme: the decisions that shape a whole page rather than one colour.
 *
 * These are deliberately few and coarse. Density moves the spacing scale, the base font size and
 * the header together, because pulling them apart is how a design system drifts. Everything here
 * is emitted as a custom property, so a host can re-theme its layout at runtime the same way it
 * re-themes its colours — and in a Tailwind v4 project the spacing and text scales are wired
 * through `@theme inline`, so `p-4` and `text-base` follow the theme instead of the framework's
 * defaults.
 */

import { sidebarVariables, type IconColorMode, type SidebarStyle } from './sidebar';

export const DENSITIES = ['compact', 'normal', 'comfortable'] as const;
export type Density = (typeof DENSITIES)[number];

export const ELEVATIONS = ['none', 'subtle', 'soft', 'lifted'] as const;
export type Elevation = (typeof ELEVATIONS)[number];

export interface Layout {
	density: Density;
	/** The `--radius` base, in rem. */
	radius: number;
	/** Hairline, one pixel, or a drawn frame. In px, because a border does not scale with text. */
	borderWidth: number;
	elevation: Elevation;
	/** Expanded sidebar, in rem. Feeds shadcn's own `--sidebar-width`. */
	sidebarWidth: number;
	/** Collapsed sidebar, in rem. Feeds shadcn's own `--sidebar-width-icon`. */
	sidebarRail: number;
	/** Which of the sidebar designs the theme wears. Always left, always collapsible. */
	sidebarStyle: SidebarStyle;
	/** Whether sidebar icons inherit the text colour or keep their semantic defaults. */
	iconColor: IconColorMode;
	/** Where a centred page stops growing, in rem. */
	contentWidth: number;
}

export const DEFAULT_LAYOUT: Layout = {
	density: 'normal',
	radius: 0.625,
	borderWidth: 1,
	elevation: 'subtle',
	sidebarWidth: 16,
	// 16rem and 3rem are shadcn's own SIDEBAR_WIDTH and SIDEBAR_WIDTH_ICON, so a theme that says
	// nothing about its sidebar lands exactly where the component already is.
	sidebarRail: 3,
	sidebarStyle: 'shadcn',
	iconColor: 'mono',
	contentWidth: 80
};

interface Scale {
	/** The base of the spacing scale, in rem. Tailwind multiplies it: `p-4` is four of these. */
	spacing: number;
	/** Base font size, in rem. */
	fontSize: number;
	/** Header and toolbar height, in rem. */
	headerHeight: number;
}

const SCALE: Record<Density, Scale> = {
	compact: { spacing: 0.2, fontSize: 0.8125, headerHeight: 2.5 },
	normal: { spacing: 0.25, fontSize: 0.875, headerHeight: 3 },
	comfortable: { spacing: 0.3, fontSize: 0.9375, headerHeight: 3.5 }
};

interface Shadow {
	low: string;
	mid: string;
	high: string;
}

/** Offsets and blurs per step; the alpha is applied per mode. */
const SHADOW: Record<
	Elevation,
	{ low: [string, number]; mid: [string, number]; high: [string, number] }
> = {
	none: { low: ['', 0], mid: ['', 0], high: ['', 0] },
	subtle: {
		low: ['0 1px 2px -1px', 0.06],
		mid: ['0 2px 6px -2px', 0.08],
		high: ['0 6px 16px -6px', 0.1]
	},
	soft: {
		low: ['0 1px 3px 0', 0.08],
		mid: ['0 6px 14px -4px', 0.1],
		high: ['0 16px 32px -12px', 0.14]
	},
	lifted: {
		low: ['0 2px 4px -1px', 0.1],
		mid: ['0 10px 20px -6px', 0.14],
		high: ['0 24px 48px -16px', 0.2]
	}
};

/** A shadow over a dark surface has almost nothing to darken, so the same alpha reads as nothing. */
const DARK_FACTOR = 2.4;

function shadows(elevation: Elevation, mode: 'light' | 'dark'): Shadow {
	const steps = SHADOW[elevation];
	const render = ([geometry, alpha]: [string, number]) => {
		if (!geometry) return 'none';
		const strength = Math.min(0.6, mode === 'dark' ? alpha * DARK_FACTOR : alpha);
		return `${geometry} oklch(0 0 0 / ${Number(strength.toFixed(3))})`;
	};

	return {
		low: render(steps.low),
		mid: render(steps.mid),
		high: render(steps.high)
	};
}

/** The custom properties a layout turns into. Only the shadows differ between the two modes. */
export function layoutVariables(layout: Layout, mode: 'light' | 'dark'): Record<string, string> {
	const scale = SCALE[layout.density];
	const shadow = shadows(layout.elevation, mode);

	return {
		radius: `${layout.radius}rem`,
		'spacing-base': `${scale.spacing}rem`,
		'font-size-base': `${scale.fontSize}rem`,
		'border-width': `${layout.borderWidth}px`,
		'header-height': `${scale.headerHeight}rem`,
		'sidebar-width': `${layout.sidebarWidth}rem`,
		'sidebar-width-icon': `${layout.sidebarRail}rem`,
		'container-max': `${layout.contentWidth}rem`,
		'elevation-low': shadow.low,
		'elevation-mid': shadow.mid,
		'elevation-high': shadow.high,
		...sidebarVariables(layout.sidebarStyle, layout.iconColor, mode)
	};
}

/**
 * How the emitted variables reach Tailwind v4's own scales. Source and target are deliberately
 * different names: `@theme inline { --spacing: var(--spacing) }` would be a cycle.
 */
export const THEME_BRIDGE: readonly { theme: string; source: string }[] = [
	{ theme: 'spacing', source: 'spacing-base' },
	{ theme: 'text-base', source: 'font-size-base' },
	{ theme: 'shadow-sm', source: 'elevation-low' },
	{ theme: 'shadow-md', source: 'elevation-mid' },
	{ theme: 'shadow-lg', source: 'elevation-high' }
];

/** Names in the order the exporters write them, so a diff between two themes stays readable. */
export const LAYOUT_VARIABLES = Object.keys(layoutVariables(DEFAULT_LAYOUT, 'light'));
