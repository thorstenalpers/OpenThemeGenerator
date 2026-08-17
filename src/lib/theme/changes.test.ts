import { describe, expect, it } from 'vitest';
import { describeChanges, type Origin } from './changes';
import { DEFAULT_RECIPE } from './generate';
import { DEFAULT_LAYOUT } from './layout';
import { presetById, REGISTRY_PRESETS } from './presets';
import type { Theme } from './theme';

/** A tab as the workshop builds it, which is the only shape `describeChanges` is ever handed. */
function opened(theme: Theme, overrides = { light: {}, dark: {} }) {
	const recipe = { ...DEFAULT_RECIPE, seed: theme.light.primary ?? '#18181b' };
	const layout = { ...DEFAULT_LAYOUT, ...theme.layout };
	const origin: Origin = { id: theme.id, name: theme.name, recipe, layout, overrides };
	return { current: { recipe, layout, overrides }, origin };
}

describe('what changed since a tab was opened', () => {
	const graphite = presetById('graphite') as Theme;
	const imported = REGISTRY_PRESETS[0] as Theme;

	it('reports nothing on a generated theme nobody has touched', () => {
		const { current, origin } = opened(graphite);
		expect(describeChanges(current, origin)).toEqual([]);
	});

	/**
	 * The one that was wrong. An imported theme opens as nothing but overrides — every published
	 * value — and comparing those against what the recipe would derive called the whole palette
	 * manual work on a theme straight out of the gallery.
	 */
	it('reports nothing on an imported palette either', () => {
		const overrides = { light: { ...imported.light }, dark: { ...imported.dark } };
		const { current, origin } = opened(imported, overrides);

		expect(Object.keys(overrides.light).length).toBeGreaterThan(20);
		expect(describeChanges(current, origin)).toEqual([]);
	});

	it('names a token overruled on a generated theme, against what it stopped following', () => {
		const { current, origin } = opened(graphite);
		const derivedBackground = current.recipe && graphite.light.background;
		current.overrides = { light: { background: 'oklch(0.5 0.2 30)' }, dark: {} };

		const changes = describeChanges(current, origin);
		expect(changes).toHaveLength(1);
		expect(changes[0]).toMatchObject({ kind: 'colour', scope: 'light', label: 'background' });
		expect(changes[0]?.to).toBe('oklch(0.5 0.2 30)');
		expect(changes[0]?.from).toBe(derivedBackground);
	});

	it('names a published token that has been overruled, against the published value', () => {
		const overrides = { light: { ...imported.light }, dark: { ...imported.dark } };
		const { current, origin } = opened(imported, overrides);
		current.overrides = {
			light: { ...overrides.light, background: 'oklch(0.2 0 0)' },
			dark: { ...overrides.dark }
		};

		const changes = describeChanges(current, origin);
		expect(changes).toHaveLength(1);
		expect(changes[0]?.from).toBe(imported.light.background);
		expect(changes[0]?.to).toBe('oklch(0.2 0 0)');
	});

	it('names a published token that has been dropped back to the recipe', () => {
		const overrides = { light: { ...imported.light }, dark: { ...imported.dark } };
		const { current, origin } = opened(imported, overrides);
		const rest = { ...overrides.light };
		delete rest.background;
		current.overrides = { light: rest, dark: { ...overrides.dark } };

		const changes = describeChanges(current, origin);
		expect(changes).toHaveLength(1);
		expect(changes[0]?.from).toBe(imported.light.background);
		// Nothing was typed, but the token now follows the seed, which is a change from what arrived.
		expect(changes[0]?.to).not.toBe(imported.light.background);
	});

	it('separates the recipe and the structure from the palette', () => {
		const { current, origin } = opened(graphite);
		current.recipe = { ...current.recipe, harmony: 'triad' };
		current.layout = { ...current.layout, radius: 1.4 };

		const changes = describeChanges(current, origin);
		expect(changes.map((change) => `${change.kind}:${change.label}`).sort()).toEqual([
			'layout:radius',
			'recipe:harmony'
		]);
	});
});
