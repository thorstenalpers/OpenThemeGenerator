import { describe, expect, it } from 'vitest';
import { presetById } from './presets';
import { complete, inspect, themeSchema, type Theme } from './theme';

const azure = presetById('azure') as Theme;

describe('the schema', () => {
	it('takes the hex a model reaches for and stores OKLCH', () => {
		const parsed = themeSchema.parse({
			id: 'From The Model',
			name: 'From the model',
			light: { background: '#ffffff', foreground: '#000' },
			dark: { background: 'oklch(0.145 0 0)', foreground: '#fff' }
		});

		expect(parsed.id).toBe('from-the-model');
		expect(parsed.light.background).toBe('oklch(1 0 0)');
		expect(parsed.dark.foreground).toBe('oklch(1 0 0)');
		// A reply that says nothing about structure gets the whole default layout, not a hole.
		expect(parsed.layout.density).toBe('normal');
		expect(parsed.layout.radius).toBe(0.625);
	});

	it('keeps the layout fields a reply names and defaults the rest', () => {
		const parsed = themeSchema.parse({
			id: 'dense',
			name: 'Dense',
			layout: { density: 'compact', contentWidth: 96 },
			light: {},
			dark: {}
		});

		expect(parsed.layout.density).toBe('compact');
		expect(parsed.layout.contentWidth).toBe(96);
		expect(parsed.layout.elevation).toBe('subtle');
	});

	it('names the value it could not read rather than failing silently', () => {
		const result = themeSchema.safeParse({
			id: 'broken',
			name: 'Broken',
			light: { background: 'cornflowerblue' },
			dark: {}
		});

		expect(result.success).toBe(false);
		expect(JSON.stringify(result.error?.issues)).toContain('cornflowerblue');
	});
});

describe('inspection', () => {
	it('reports what is missing and what nothing will read', () => {
		const partial: Theme = {
			...azure,
			light: { background: 'oklch(1 0 0)', 'brand-gradient': 'oklch(0.5 0.1 200)' }
		};
		const problems = inspect(partial);

		expect(problems).toContainEqual({ mode: 'light', token: 'foreground', kind: 'missing' });
		expect(problems).toContainEqual({ mode: 'light', token: 'brand-gradient', kind: 'unknown' });
		expect(problems.filter((problem) => problem.mode === 'dark')).toEqual([]);
	});

	it('fills a partial theme from a fallback and drops what nothing reads', () => {
		const partial: Theme = {
			...azure,
			light: { background: 'oklch(0.99 0 0)', 'brand-gradient': 'oklch(0.5 0.1 200)' }
		};
		const filled = complete(partial, azure);

		expect(filled.light.background).toBe('oklch(0.99 0 0)');
		expect(filled.light.foreground).toBe(azure.light.foreground);
		expect(filled.light['brand-gradient']).toBeUndefined();
		expect(inspect(filled)).toEqual([]);
	});
});
