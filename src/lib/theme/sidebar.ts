/**
 * The sidebar as its own design axis.
 *
 * A sidebar is where apps differ most: the same palette reads as a different product depending on
 * whether the navigation is a strip of piano keys, a column of round pills, or a translucent pane.
 * Each style here is a set of custom properties plus two structural flags — everything a host (or
 * this app's own preview) needs to draw it. The sidebar is always on the left and always
 * collapsible to the rail; the styles change what it looks like, never how it behaves.
 */

export const SIDEBAR_STYLES = [
	'shadcn',
	'piano',
	'x',
	'vercel',
	'win11',
	'macos',
	'rail',
	'notion',
	'linear',
	'slack',
	'gnome',
	'material',
	'brutalist',
	'outline',
	'docked',
	'stripe',
	'keys',
	'neumorph',
	'aqua',
	'embossed'
] as const;
export type SidebarStyle = (typeof SIDEBAR_STYLES)[number];

/** The semantic roles the sidebar icons come in, and the only keys `--icon-*` is written for. */
export const ICON_COLOURS = ['info', 'success', 'warning', 'danger', 'feature', 'media'] as const;
export type IconColour = (typeof ICON_COLOURS)[number];

export const ICON_COLOR_MODES = ['mono', 'system'] as const;
/** `mono` inherits the text colour; `system` paints each icon in its semantic default — blue for
 *  info, green for success — the way Windows and macOS ship their own sidebars. */
export type IconColorMode = (typeof ICON_COLOR_MODES)[number];

export interface SidebarStyleSpec {
	/** One line for pickers and docs. */
	label: string;
	/** Row height in rem. */
	itemHeight: number;
	/** Corner radius of one row, in rem. 999 is a full pill. */
	itemRadius: number;
	/** Vertical gap between rows, in rem. */
	itemGap: number;
	/** Inset of the whole pane, in rem. */
	padding: number;
	/** Icon square, in rem. */
	iconSize: number;
	/** Font weight of an inactive label / the active label. */
	weight: [number, number];
	/** Width of the active-edge indicator in px. 0 means the style has none. */
	indicator: number;
	/** 1px key-separators between rows, the piano look. */
	separators: boolean;
	/**
	 * How solid the pane behind the rows is. 1 is opaque, between 0 and 1 it is tinted glass over
	 * the page (mica / vibrancy), and 0 is no pane at all — the sidebar is only its rows, and the
	 * page background runs underneath them.
	 */
	tint: number;
	/** Backdrop blur in px, only meaningful when tint is between 0 and 1. */
	blur: number;
	/**
	 * What marks the active row.
	 *
	 * `primary` and `accent` fill it with a solid token. `tint` washes the brand colour over
	 * whatever is behind at low alpha and colours the label with it — the quiet one, and the only
	 * one that works over a pane that is not there. `text` colours the label alone; `none` leaves
	 * weight and opacity to do the work.
	 */
	active: 'primary' | 'accent' | 'tint' | 'text' | 'none';
	/** Small uppercase group labels above the rows. */
	sections: boolean;
	/** Labels set in capitals — the brutalist and stripe end of the range. */
	uppercase: boolean;
	/** Inset of the pane from the window edge, in rem. Above 0 it reads as a floating card. */
	floating: number;
	/** Whether a dividing line is drawn against the content. */
	border: boolean;
	/**
	 * How the row is lit.
	 *
	 * Everything here is box-shadow and a linear gradient: both composite on the GPU and cost
	 * nothing per frame. No `filter`, no `backdrop-filter` and no transform, because those are what
	 * turn a list of forty rows into dropped frames — the relief is drawn, not rendered.
	 */
	relief: 'flat' | 'keycap' | 'soft' | 'gloss' | 'engraved';
}

export const SIDEBAR_SPECS: Record<SidebarStyle, SidebarStyleSpec> = {
	shadcn: {
		label: 'shadcn',
		itemHeight: 2.25,
		itemRadius: 0.375,
		itemGap: 0.125,
		padding: 0.5,
		iconSize: 1,
		weight: [400, 600],
		indicator: 3,
		separators: false,
		tint: 0,
		blur: 0,
		active: 'tint',
		sections: false,
		uppercase: false,
		floating: 0,
		border: true,
		relief: 'flat'
	},
	piano: {
		label: 'Piano',
		itemHeight: 3,
		itemRadius: 0,
		itemGap: 0,
		padding: 0,
		iconSize: 1.05,
		weight: [500, 700],
		indicator: 0,
		separators: true,
		tint: 1,
		blur: 0,
		active: 'primary',
		sections: false,
		uppercase: false,
		floating: 0,
		border: true,
		relief: 'flat'
	},
	x: {
		label: 'X',
		itemHeight: 3.25,
		itemRadius: 999,
		itemGap: 0.25,
		padding: 0.75,
		iconSize: 1.5,
		weight: [400, 700],
		indicator: 0,
		separators: false,
		tint: 0,
		blur: 0,
		active: 'none',
		sections: false,
		uppercase: false,
		floating: 0,
		border: true,
		relief: 'flat'
	},
	vercel: {
		label: 'Vercel',
		itemHeight: 2,
		itemRadius: 0.25,
		itemGap: 0.125,
		padding: 0.75,
		iconSize: 0.95,
		weight: [400, 500],
		indicator: 0,
		separators: false,
		tint: 0,
		blur: 0,
		active: 'tint',
		sections: true,
		uppercase: false,
		floating: 0,
		border: true,
		relief: 'flat'
	},
	win11: {
		label: 'Windows 11',
		itemHeight: 2.5,
		itemRadius: 0.25,
		itemGap: 0.2,
		padding: 0.55,
		iconSize: 1.1,
		weight: [400, 600],
		indicator: 3,
		separators: false,
		tint: 0.82,
		blur: 24,
		active: 'accent',
		sections: false,
		uppercase: false,
		floating: 0,
		border: false,
		relief: 'flat'
	},
	macos: {
		label: 'macOS',
		itemHeight: 1.8,
		itemRadius: 0.3,
		itemGap: 0.1,
		padding: 0.6,
		iconSize: 0.95,
		weight: [400, 500],
		indicator: 0,
		separators: false,
		tint: 0.72,
		blur: 32,
		active: 'primary',
		sections: true,
		uppercase: false,
		floating: 0,
		border: true,
		relief: 'flat'
	},
	rail: {
		label: 'Rail',
		itemHeight: 2.75,
		itemRadius: 0.5,
		itemGap: 0.35,
		padding: 0.4,
		iconSize: 1.4,
		weight: [500, 600],
		indicator: 3,
		separators: false,
		tint: 0,
		blur: 0,
		active: 'tint',
		sections: false,
		uppercase: false,
		floating: 0,
		border: true,
		relief: 'flat'
	},
	notion: {
		label: 'Notion',
		itemHeight: 1.7,
		itemRadius: 0.1875,
		itemGap: 0.05,
		padding: 0.4,
		iconSize: 0.9,
		weight: [400, 500],
		indicator: 0,
		separators: false,
		tint: 1,
		blur: 0,
		active: 'accent',
		sections: true,
		uppercase: false,
		floating: 0,
		border: false,
		relief: 'flat'
	},
	linear: {
		label: 'Linear',
		itemHeight: 1.9,
		itemRadius: 0.3125,
		itemGap: 0.0625,
		padding: 0.5,
		iconSize: 0.9,
		weight: [450, 600],
		indicator: 0,
		separators: false,
		tint: 0,
		blur: 0,
		active: 'tint',
		sections: true,
		uppercase: false,
		floating: 0,
		border: true,
		relief: 'flat'
	},
	slack: {
		label: 'Slack',
		itemHeight: 2.1,
		itemRadius: 0.5,
		itemGap: 0.1,
		padding: 0.6,
		iconSize: 1,
		weight: [400, 700],
		indicator: 0,
		separators: false,
		tint: 1,
		blur: 0,
		active: 'primary',
		sections: true,
		uppercase: false,
		floating: 0,
		border: false,
		relief: 'flat'
	},
	gnome: {
		label: 'GNOME',
		itemHeight: 2.6,
		itemRadius: 0.75,
		itemGap: 0.25,
		padding: 0.75,
		iconSize: 1.05,
		weight: [400, 600],
		indicator: 0,
		separators: false,
		tint: 1,
		blur: 0,
		active: 'accent',
		sections: false,
		uppercase: false,
		floating: 0,
		border: true,
		relief: 'flat'
	},
	material: {
		label: 'Material 3',
		itemHeight: 3.5,
		itemRadius: 999,
		itemGap: 0.2,
		padding: 0.75,
		iconSize: 1.25,
		weight: [400, 600],
		indicator: 0,
		separators: false,
		tint: 1,
		blur: 0,
		active: 'accent',
		sections: false,
		uppercase: false,
		floating: 0,
		border: false,
		relief: 'flat'
	},
	brutalist: {
		label: 'Brutalist',
		itemHeight: 2.75,
		itemRadius: 0,
		itemGap: 0,
		padding: 0,
		iconSize: 1.1,
		weight: [600, 800],
		indicator: 0,
		separators: true,
		tint: 1,
		blur: 0,
		active: 'primary',
		sections: false,
		uppercase: true,
		floating: 0,
		border: true,
		relief: 'flat'
	},
	outline: {
		label: 'Outline',
		itemHeight: 2.4,
		itemRadius: 0.375,
		itemGap: 0.3,
		padding: 0.6,
		iconSize: 1,
		weight: [450, 600],
		indicator: 0,
		separators: false,
		tint: 0,
		blur: 0,
		active: 'tint',
		sections: false,
		uppercase: false,
		floating: 0,
		border: true,
		relief: 'flat'
	},
	docked: {
		label: 'Docked',
		itemHeight: 2.3,
		itemRadius: 0.5,
		itemGap: 0.15,
		padding: 0.6,
		iconSize: 1,
		weight: [400, 600],
		indicator: 0,
		separators: false,
		tint: 1,
		blur: 0,
		active: 'primary',
		sections: false,
		uppercase: false,
		floating: 0.75,
		border: false,
		relief: 'flat'
	},
	stripe: {
		label: 'Stripe',
		itemHeight: 2.1,
		itemRadius: 0.25,
		itemGap: 0.1,
		padding: 0.8,
		iconSize: 0.85,
		weight: [400, 600],
		indicator: 2,
		separators: false,
		tint: 0,
		blur: 0,
		active: 'text',
		sections: true,
		uppercase: true,
		floating: 0,
		border: true,
		relief: 'flat'
	},
	keys: {
		label: 'Ivory Keys',
		itemHeight: 3.1,
		itemRadius: 0.2,
		itemGap: 0.15,
		padding: 0.35,
		iconSize: 1.05,
		weight: [500, 700],
		indicator: 0,
		separators: false,
		tint: 1,
		blur: 0,
		active: 'primary',
		sections: false,
		uppercase: false,
		floating: 0,
		border: true,
		relief: 'keycap'
	},
	neumorph: {
		label: 'Neumorph',
		itemHeight: 2.7,
		itemRadius: 0.7,
		itemGap: 0.4,
		padding: 0.8,
		iconSize: 1.05,
		weight: [450, 650],
		indicator: 0,
		separators: false,
		tint: 1,
		blur: 0,
		active: 'accent',
		sections: false,
		uppercase: false,
		floating: 0,
		border: false,
		relief: 'soft'
	},
	aqua: {
		label: 'Aqua',
		itemHeight: 2.6,
		itemRadius: 999,
		itemGap: 0.25,
		padding: 0.7,
		iconSize: 1.05,
		weight: [500, 700],
		indicator: 0,
		separators: false,
		tint: 1,
		blur: 0,
		active: 'primary',
		sections: false,
		uppercase: false,
		floating: 0,
		border: true,
		relief: 'gloss'
	},
	embossed: {
		label: 'Embossed',
		itemHeight: 2.5,
		itemRadius: 0.35,
		itemGap: 0.25,
		padding: 0.65,
		iconSize: 1,
		weight: [500, 700],
		indicator: 0,
		separators: false,
		tint: 1,
		blur: 0,
		active: 'accent',
		sections: true,
		uppercase: false,
		floating: 0,
		border: true,
		relief: 'engraved'
	}
};

/**
 * The relief, as two shadows and a gradient.
 *
 * `keycap` is the one worth reading closely: a raised key is a light edge along the top, a dark
 * one under the bottom, and a cast shadow below it — three stops in one box-shadow. Pressing it
 * flips the same three inward, which is why the active row reads as *down* rather than just
 * differently coloured. That is a real piano key rather than a coloured bar, and it costs one
 * composited layer, not a filter.
 */
const RELIEF: Record<
	SidebarStyleSpec['relief'],
	{ rest: string; active: string; gradient: string; activeGradient: string }
> = {
	flat: { rest: 'none', active: 'none', gradient: 'none', activeGradient: 'none' },
	keycap: {
		rest: 'inset 0 1px 0 oklch(1 0 0 / 0.55), inset 0 -2px 0 oklch(0 0 0 / 0.16), 0 2px 3px -1px oklch(0 0 0 / 0.22)',
		active:
			'inset 0 2px 4px oklch(0 0 0 / 0.32), inset 0 -1px 0 oklch(1 0 0 / 0.12), 0 0 0 oklch(0 0 0 / 0)',
		gradient: 'linear-gradient(to bottom, oklch(1 0 0 / 0.1), oklch(0 0 0 / 0.06))',
		activeGradient: 'linear-gradient(to bottom, oklch(0 0 0 / 0.12), oklch(0 0 0 / 0))'
	},
	soft: {
		rest: '4px 4px 10px oklch(0 0 0 / 0.13), -4px -4px 10px oklch(1 0 0 / 0.5)',
		active: 'inset 3px 3px 7px oklch(0 0 0 / 0.16), inset -3px -3px 7px oklch(1 0 0 / 0.45)',
		gradient: 'none',
		activeGradient: 'none'
	},
	gloss: {
		rest: 'inset 0 1px 0 oklch(1 0 0 / 0.5), 0 1px 2px oklch(0 0 0 / 0.18)',
		active: 'inset 0 1px 0 oklch(1 0 0 / 0.6), 0 2px 6px -1px oklch(0 0 0 / 0.3)',
		gradient: 'linear-gradient(to bottom, oklch(1 0 0 / 0.22), oklch(1 0 0 / 0) 55%)',
		activeGradient: 'linear-gradient(to bottom, oklch(1 0 0 / 0.3), oklch(0 0 0 / 0.08))'
	},
	engraved: {
		rest: 'inset 0 1px 1px oklch(0 0 0 / 0.1), inset 0 -1px 0 oklch(1 0 0 / 0.35)',
		active: 'inset 0 2px 3px oklch(0 0 0 / 0.2), inset 0 -1px 0 oklch(1 0 0 / 0.25)',
		gradient: 'none',
		activeGradient: 'none'
	}
};

/**
 * The semantic icon defaults, per mode — the blues and greens an OS paints its own sidebar icons
 * in. They are theme-independent on purpose: an info icon is blue in every theme, which is what
 * makes it readable as "info" rather than as decoration.
 */
const ICONS: Record<'light' | 'dark', Record<string, string>> = {
	light: {
		'icon-info': 'oklch(0.55 0.19 259)',
		'icon-success': 'oklch(0.55 0.15 150)',
		'icon-warning': 'oklch(0.68 0.15 70)',
		'icon-danger': 'oklch(0.58 0.21 27)',
		'icon-feature': 'oklch(0.55 0.2 300)',
		'icon-media': 'oklch(0.6 0.12 220)'
	},
	dark: {
		'icon-info': 'oklch(0.7 0.15 259)',
		'icon-success': 'oklch(0.72 0.15 150)',
		'icon-warning': 'oklch(0.78 0.14 75)',
		'icon-danger': 'oklch(0.7 0.18 25)',
		'icon-feature': 'oklch(0.72 0.16 300)',
		'icon-media': 'oklch(0.74 0.11 220)'
	}
};

/**
 * The custom properties one style turns into. The active-row surface is itself a variable whose
 * value is another token, so a host draws `background: var(--sidebar-active-surface)` and the
 * style decides whether that means the brand colour, the quiet fill, or nothing.
 */
export function sidebarVariables(
	style: SidebarStyle,
	iconColor: IconColorMode,
	mode: 'light' | 'dark'
): Record<string, string> {
	const spec = SIDEBAR_SPECS[style];

	// Each row declares its own `--icon-current`, and this blend picks between that semantic colour
	// and the row's text colour without the host having to branch on a keyword it cannot read.
	const icon =
		'color-mix(in oklch, var(--icon-current) calc(100% * var(--sidebar-icon-uses-system)), currentColor calc(100% * (1 - var(--sidebar-icon-uses-system))))';

	const [activeSurface, activeForeground] =
		spec.active === 'primary'
			? ['var(--sidebar-primary)', 'var(--sidebar-primary-foreground)']
			: spec.active === 'accent'
				? ['var(--sidebar-accent)', 'var(--sidebar-accent-foreground)']
				: spec.active === 'tint'
					? [
							'color-mix(in oklch, var(--sidebar-primary) 14%, transparent)',
							'var(--sidebar-primary)'
						]
					: spec.active === 'text'
						? ['transparent', 'var(--sidebar-primary)']
						: ['transparent', 'var(--sidebar-foreground)'];

	return {
		'sidebar-style': style,
		'sidebar-item-height': `${spec.itemHeight}rem`,
		'sidebar-item-radius': spec.itemRadius >= 999 ? '999px' : `${spec.itemRadius}rem`,
		'sidebar-item-gap': `${spec.itemGap}rem`,
		'sidebar-padding': `${spec.padding}rem`,
		'sidebar-icon-size': `${spec.iconSize}rem`,
		'sidebar-weight': `${spec.weight[0]}`,
		'sidebar-weight-active': `${spec.weight[1]}`,
		'sidebar-indicator-width': `${spec.indicator}px`,
		'sidebar-separator-width': spec.separators ? 'var(--border-width)' : '0px',
		'sidebar-tint-opacity': `${spec.tint}`,
		'sidebar-blur': `${spec.blur}px`,
		'sidebar-active-surface': activeSurface,
		'sidebar-active-foreground': activeForeground,
		// An active row that is only washed or only coloured keeps its semantic icon colour; one
		// that is filled cannot, because the fill is what the icon now has to be legible against.
		'sidebar-active-icon':
			spec.active === 'text' || spec.active === 'none' ? icon : 'var(--sidebar-active-foreground)',
		'sidebar-hover-surface': 'color-mix(in oklch, var(--sidebar-foreground) 8%, transparent)',
		'sidebar-icon-color': icon,
		'sidebar-relief': spec.relief,
		'sidebar-row-shadow': RELIEF[spec.relief].rest,
		'sidebar-row-shadow-active': RELIEF[spec.relief].active,
		'sidebar-row-gradient': RELIEF[spec.relief].gradient,
		'sidebar-row-gradient-active': RELIEF[spec.relief].activeGradient,
		// A relief style needs a surface to catch the light; a flat one leaves the row to whatever
		// is behind it, which is the whole point of a pane that is not painted.
		'sidebar-row-surface': spec.relief === 'flat' ? 'transparent' : 'var(--sidebar-accent)',
		'sidebar-uppercase': spec.uppercase ? 'uppercase' : 'none',
		'sidebar-letter-spacing': spec.uppercase ? '0.06em' : 'normal',
		'sidebar-floating': `${spec.floating}rem`,
		'sidebar-pane-radius': spec.floating > 0 ? 'var(--radius)' : '0px',
		'sidebar-pane-shadow': spec.floating > 0 ? 'var(--elevation-mid)' : 'none',
		// A submenu hangs off a vertical rule, except where the rows are pills or lit from the side
		// and a second line would cut across the shape.
		'sidebar-child-border':
			spec.itemRadius >= 999 || spec.relief !== 'flat'
				? 'none'
				: 'var(--border-width) solid var(--sidebar-border)',
		'sidebar-border-width': spec.border ? 'var(--border-width)' : '0px',
		// `outline` is the one style whose rows carry their own frame; every other style leaves the
		// row unbordered and says so with a zero.
		'sidebar-item-border': style === 'outline' ? 'var(--border-width)' : '0px',
		'sidebar-icon-mode': iconColor,
		// The same choice as a number, so a stylesheet can blend with it instead of branching on a
		// keyword it has no way to read.
		'sidebar-icon-uses-system': iconColor === 'system' ? '1' : '0',
		...ICONS[mode]
	};
}
