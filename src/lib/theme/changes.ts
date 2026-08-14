import { buildPalettes, DEFAULT_RECIPE, type Recipe } from './generate';
import { DEFAULT_LAYOUT, type Layout } from './layout';
import type { Palette } from './tokens';

export interface Change {
	kind: 'colour' | 'recipe' | 'layout';
	/** `light` or `dark` for a colour; empty for the rest. */
	scope: string;
	label: string;
	from: string;
	to: string;
}

export interface Origin {
	id: string;
	name: string;
	recipe: Recipe;
	layout: Layout;
}

interface Current {
	recipe: Recipe;
	layout: Layout;
	overrides: { light: Palette; dark: Palette };
}

/** Recipe and layout fields are numbers and short strings; anything else is a bug, not a value. */
const show = (value: string | number | undefined): string =>
	value === undefined ? '' : String(value);

/**
 * What has been changed by hand, against the template a tab was opened from.
 *
 * Three kinds, because they are undone differently: a colour override is a token that stopped
 * following the recipe, a recipe change re-derives every token, and a layout change moves the
 * structure. Renaming is deliberately not a change — the name is the tab's, the origin is the
 * template's, and conflating them is how you lose track of what a theme actually started as.
 */
export function describeChanges(current: Current, origin: Origin | null): Change[] {
	const changes: Change[] = [];
	const baseRecipe = origin?.recipe ?? DEFAULT_RECIPE;
	const baseLayout = origin?.layout ?? DEFAULT_LAYOUT;

	for (const key of Object.keys(current.recipe) as (keyof Recipe)[]) {
		if (show(current.recipe[key]) !== show(baseRecipe[key])) {
			changes.push({
				kind: 'recipe',
				scope: '',
				label: key,
				from: show(baseRecipe[key]),
				to: show(current.recipe[key])
			});
		}
	}

	for (const key of Object.keys(current.layout) as (keyof Layout)[]) {
		if (show(current.layout[key]) !== show(baseLayout[key])) {
			changes.push({
				kind: 'layout',
				scope: '',
				label: key,
				from: show(baseLayout[key]),
				to: show(current.layout[key])
			});
		}
	}

	// The derived palette the recipe *would* produce, so a token override is shown against what it
	// replaced rather than against nothing.
	const derived = buildPalettes(current.recipe);
	for (const mode of ['light', 'dark'] as const) {
		for (const [token, value] of Object.entries(current.overrides[mode])) {
			const before = derived[mode][token];
			if (before === value) continue;
			changes.push({
				kind: 'colour',
				scope: mode,
				label: token,
				from: before ?? '—',
				to: value
			});
		}
	}

	return changes;
}
