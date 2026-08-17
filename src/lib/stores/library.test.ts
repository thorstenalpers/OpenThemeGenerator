import { beforeEach, describe, expect, it } from 'vitest';
import { library } from './library.svelte';
import { PRESETS, presetById } from '$lib/theme/presets';
import type { ThemeDraft } from '$lib/theme/generate';

const draft = (id: string, name = id): ThemeDraft => ({
	id,
	name,
	description: '',
	tags: [],
	recipe: { seed: '#0ea5e9' },
	layout: { radius: 0.5 }
});

describe('the saved themes', () => {
	beforeEach(() => {
		localStorage.clear();
		library.drafts = [];
	});

	it('keeps a draft rather than a palette, so reopening one still has a recipe', () => {
		library.save(draft('nordlicht', 'Nordlicht'), '2026-08-17');

		const stored = library.find('nordlicht');
		expect(stored?.recipe.seed).toBe('#0ea5e9');
		expect(stored?.layout?.radius).toBe(0.5);
		expect(library.themes[0]?.light.background).toMatch(/^oklch\(/);
	});

	/**
	 * The one that crashed the gallery. Saving an edited Graphite under `graphite` put two cards with
	 * the same id into a keyed list, which is a crash rather than a near miss.
	 */
	it('never takes an id a built-in already has', () => {
		expect(presetById('graphite')).toBeDefined();
		expect(library.freeId('graphite')).toBe('graphite-2');

		// And it keeps counting: the copy just saved is taken too.
		library.save(draft('graphite-2'), '2026-08-17');
		expect(library.freeId('graphite')).toBe('graphite-3');
	});

	it('leaves an id alone when the entry under it is already yours', () => {
		library.save(draft('nordlicht'), '2026-08-17');
		expect(library.freeId('nordlicht')).toBe('nordlicht');
	});

	it('every id in the gallery stays unique once yours are mixed in', () => {
		library.save({ ...draft('graphite-2'), name: 'Graphite' }, '2026-08-17');
		library.save(draft('nordlicht'), '2026-08-17');

		const ids = [...library.themes, ...PRESETS].map((theme) => theme.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('replaces rather than duplicates when the same theme is saved twice', () => {
		library.save(draft('nordlicht', 'Nordlicht'), '2026-08-17');
		library.save({ ...draft('nordlicht', 'Nordlicht'), recipe: { seed: '#ff0000' } }, '2026-08-18');

		expect(library.drafts).toHaveLength(1);
		expect(library.find('nordlicht')?.recipe.seed).toBe('#ff0000');
		expect(library.find('nordlicht')?.savedAt).toBe('2026-08-18');
	});

	it('survives a restart, and drops an entry that is no longer a theme', () => {
		library.save(draft('nordlicht'), '2026-08-17');
		localStorage.setItem(
			'otg.library',
			JSON.stringify([...library.drafts, { id: 'broken' }, 'not even an object'])
		);

		library.drafts = [];
		library.restore();
		expect(library.drafts.map((entry) => entry.id)).toEqual(['nordlicht']);
	});

	it('starts empty rather than throwing on a half-written entry', () => {
		localStorage.setItem('otg.library', '{not json');
		library.restore();
		expect(library.drafts).toEqual([]);
	});
});
