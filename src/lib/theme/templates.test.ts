import { describe, expect, it } from 'vitest';
import { contrast } from './color';
import { TEMPLATE_PRESETS } from './presets';
import { SIDEBAR_STYLES } from './sidebar';
import { inspect } from './theme';

describe('the templates', () => {
	it('are at least fifty, uniquely named and uniquely identified', () => {
		expect(TEMPLATE_PRESETS.length).toBeGreaterThanOrEqual(50);
		expect(new Set(TEMPLATE_PRESETS.map((theme) => theme.id)).size).toBe(TEMPLATE_PRESETS.length);
		expect(new Set(TEMPLATE_PRESETS.map((theme) => theme.name)).size).toBe(TEMPLATE_PRESETS.length);
	});

	it('lean black and white, which is what most products ask for', () => {
		const monochrome = TEMPLATE_PRESETS.filter((theme) => theme.tags.includes('monochrome'));

		expect(monochrome.length).toBeGreaterThanOrEqual(20);
	});

	it('cover the colour families the request named', () => {
		const named = (word: string) =>
			TEMPLATE_PRESETS.some((theme) => theme.name.toLowerCase().startsWith(word));

		for (const family of ['ink', 'cobalt', 'azure', 'crimson', 'rose', 'prism']) {
			expect(named(family), family).toBe(true);
		}
	});

	it('reach every sidebar design, so no design is offered without a template that uses it', () => {
		const used = new Set(TEMPLATE_PRESETS.map((theme) => theme.layout.sidebarStyle));

		expect([...used].sort()).toEqual([...SIDEBAR_STYLES].sort());
	});

	it('are complete and readable, the same bar the curated presets are held to', () => {
		for (const theme of TEMPLATE_PRESETS) {
			expect(inspect(theme), theme.id).toEqual([]);

			for (const mode of ['light', 'dark'] as const) {
				const ratio = contrast(theme[mode].background ?? '', theme[mode].foreground ?? '');
				expect(ratio, `${theme.id} ${mode}`).toBeGreaterThanOrEqual(4.5);
			}
		}
	});

	it('differ in structure, not only in colour', () => {
		// Two templates from one family must still be two different products, or the fifty are ten
		// palettes listed five times.
		const ink = TEMPLATE_PRESETS.filter((theme) => theme.id.startsWith('ink-'));
		const shapes = new Set(
			ink.map(
				(theme) => `${theme.layout.sidebarStyle}|${theme.layout.radius}|${theme.layout.density}`
			)
		);

		expect(ink.length).toBeGreaterThanOrEqual(8);
		expect(shapes.size).toBe(ink.length);
	});
});
