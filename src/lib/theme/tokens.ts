/**
 * The token surface every export writes and every editor row edits.
 *
 * The first four groups are the shadcn set as `shadcn-svelte` and `shadcn/ui` ship it, so a theme
 * generated here drops into either without a rename. `state` and `chart` are additions: apps that
 * do not declare them simply ignore the extra custom properties.
 */

export const TOKEN_GROUPS = ['surface', 'brand', 'state', 'chart', 'sidebar'] as const;
export type TokenGroup = (typeof TOKEN_GROUPS)[number];

interface TokenSpec {
	name: string;
	group: TokenGroup;
	/** The token a label on this surface is drawn in, when there is one. */
	pairedWith?: string;
	/** Part of the canonical shadcn set — everything else is an addition this app also emits. */
	core: boolean;
}

export const TOKENS: readonly TokenSpec[] = [
	{ name: 'background', group: 'surface', pairedWith: 'foreground', core: true },
	{ name: 'foreground', group: 'surface', core: true },
	{ name: 'card', group: 'surface', pairedWith: 'card-foreground', core: true },
	{ name: 'card-foreground', group: 'surface', core: true },
	{ name: 'popover', group: 'surface', pairedWith: 'popover-foreground', core: true },
	{ name: 'popover-foreground', group: 'surface', core: true },
	{ name: 'muted', group: 'surface', pairedWith: 'muted-foreground', core: true },
	{ name: 'muted-foreground', group: 'surface', core: true },
	{ name: 'border', group: 'surface', core: true },
	{ name: 'input', group: 'surface', core: true },

	{ name: 'primary', group: 'brand', pairedWith: 'primary-foreground', core: true },
	{ name: 'primary-foreground', group: 'brand', core: true },
	{ name: 'secondary', group: 'brand', pairedWith: 'secondary-foreground', core: true },
	{ name: 'secondary-foreground', group: 'brand', core: true },
	{ name: 'accent', group: 'brand', pairedWith: 'accent-foreground', core: true },
	{ name: 'accent-foreground', group: 'brand', core: true },
	{ name: 'ring', group: 'brand', core: true },

	{ name: 'destructive', group: 'state', pairedWith: 'destructive-foreground', core: true },
	{ name: 'destructive-foreground', group: 'state', core: true },
	{ name: 'success', group: 'state', pairedWith: 'success-foreground', core: false },
	{ name: 'success-foreground', group: 'state', core: false },
	{ name: 'warning', group: 'state', pairedWith: 'warning-foreground', core: false },
	{ name: 'warning-foreground', group: 'state', core: false },

	{ name: 'chart-1', group: 'chart', core: true },
	{ name: 'chart-2', group: 'chart', core: true },
	{ name: 'chart-3', group: 'chart', core: true },
	{ name: 'chart-4', group: 'chart', core: true },
	{ name: 'chart-5', group: 'chart', core: true },

	{ name: 'sidebar', group: 'sidebar', pairedWith: 'sidebar-foreground', core: true },
	{ name: 'sidebar-foreground', group: 'sidebar', core: true },
	{
		name: 'sidebar-primary',
		group: 'sidebar',
		pairedWith: 'sidebar-primary-foreground',
		core: true
	},
	{ name: 'sidebar-primary-foreground', group: 'sidebar', core: true },
	{ name: 'sidebar-accent', group: 'sidebar', pairedWith: 'sidebar-accent-foreground', core: true },
	{ name: 'sidebar-accent-foreground', group: 'sidebar', core: true },
	{ name: 'sidebar-border', group: 'sidebar', core: true },
	{ name: 'sidebar-ring', group: 'sidebar', core: true }
];

export const TOKEN_NAMES = TOKENS.map((token) => token.name);

/** One mode of a theme: every token name mapped to an `oklch(...)` string. */
export type Palette = Record<string, string>;

export function tokensOf(group: TokenGroup): readonly TokenSpec[] {
	return TOKENS.filter((token) => token.group === group);
}

/**
 * Surface/label pairs, for the contrast check. A pair whose ratio falls below 4.5 is text somebody
 * cannot read, which is the one defect a colour picker will not show you.
 */
export const TOKEN_PAIRS: readonly { surface: string; label: string }[] = TOKENS.filter(
	(token) => token.pairedWith !== undefined
).map((token) => ({ surface: token.name, label: token.pairedWith as string }));
