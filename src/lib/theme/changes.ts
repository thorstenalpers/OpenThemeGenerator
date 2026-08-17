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
	overrides: { light: Palette; dark: Palette };
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

	/**
	 * A token counts as changed against what the tab was opened holding, not against what the recipe
	 * would derive.
	 *
	 * The two are the same for a theme made here, which is why the difference stayed hidden: it opens
	 * with no overrides at all, so every one that appears is a hand edit. An imported theme opens as
	 * nothing but overrides — sixty-four published values that the seed was never going to derive —
	 * and comparing those against the recipe reported the whole palette as manual work on a theme
	 * nobody had touched.
	 *
	 * The derived palette still supplies the `from` where the origin has nothing to say, so a token
	 * overruled on a generated theme is shown against the value it stopped following.
	 */
	const derived = buildPalettes(current.recipe);
	for (const mode of ['light', 'dark'] as const) {
		const before = origin?.overrides[mode] ?? {};
		const after = current.overrides[mode];

		for (const token of new Set([...Object.keys(before), ...Object.keys(after)])) {
			const was = before[token] ?? derived[mode][token];
			// Dropped from the overrides: the token has gone back to following the recipe, which is a
			// change from an imported palette even though nothing was typed.
			const now = after[token] ?? derived[mode][token];
			if (was === now) continue;

			changes.push({
				kind: 'colour',
				scope: mode,
				label: token,
				from: was ?? '—',
				to: now ?? '—'
			});
		}
	}

	return changes;
}
