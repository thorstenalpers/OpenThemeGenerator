import { describe, expect, it } from 'vitest';
import { buildTheme } from './generate';
import { layoutVariables } from './layout';
import { PRESETS } from './presets';
import {
	ICON_COLOR_MODES,
	SIDEBAR_SPECS,
	SIDEBAR_STYLES,
	sidebarVariables,
	type SidebarStyle
} from './sidebar';

describe('the sidebar styles', () => {
	it.each(SIDEBAR_STYLES)('%s emits every variable a host has to draw', (style) => {
		const variables = sidebarVariables(style, 'mono', 'light');

		for (const name of [
			'sidebar-item-height',
			'sidebar-item-radius',
			'sidebar-padding',
			'sidebar-icon-size',
			'sidebar-active-surface',
			'sidebar-active-foreground',
			'sidebar-indicator-width',
			'sidebar-separator-width',
			'sidebar-tint-opacity',
			'sidebar-blur'
		]) {
			expect(variables[name], `${style} ${name}`).toBeTruthy();
		}
	});

	it('gives each style a shape no other style has', () => {
		const shapes = SIDEBAR_STYLES.map((style) =>
			JSON.stringify(sidebarVariables(style, 'mono', 'light'))
		);

		expect(new Set(shapes).size).toBe(SIDEBAR_STYLES.length);
	});

	it('keeps the structural traits to the styles that are about them', () => {
		const withTrait = (pick: (spec: (typeof SIDEBAR_SPECS)[SidebarStyle]) => boolean) =>
			SIDEBAR_STYLES.filter((style) => pick(SIDEBAR_SPECS[style]));

		// Key separators are the piano idea; translucency is the OS one; a floating pane is the
		// docked one. A style that quietly picks up a second family's trait stops being distinct.
		expect(withTrait((spec) => spec.separators)).toEqual(['piano', 'brutalist']);
		expect(withTrait((spec) => spec.tint > 0 && spec.tint < 1)).toEqual(['win11', 'macos']);
		expect(withTrait((spec) => spec.floating > 0)).toEqual(['docked']);
		expect(withTrait((spec) => spec.uppercase)).toEqual(['brutalist', 'stripe']);

		// The quiet end of the range has no pane at all: the page runs under the rows, and the
		// current one is a wash of the brand colour rather than a filled bar.
		expect(withTrait((spec) => spec.tint === 0)).toEqual([
			'shadcn',
			'x',
			'vercel',
			'rail',
			'linear',
			'outline',
			'stripe'
		]);
	});

	it('offers at least sixteen designs, each with a name of its own', () => {
		expect(SIDEBAR_STYLES.length).toBeGreaterThanOrEqual(16);

		const labels = SIDEBAR_STYLES.map((style) => SIDEBAR_SPECS[style].label);
		expect(new Set(labels).size).toBe(SIDEBAR_STYLES.length);
	});
});

describe('icon colours', () => {
	it.each(ICON_COLOR_MODES)('%s carries the semantic palette either way', (iconColor) => {
		const variables = sidebarVariables('shadcn', iconColor, 'light');

		// The colours are always emitted; the blend factor is what decides whether they are used,
		// so a host can switch at runtime without re-exporting the theme.
		expect(variables['icon-info']).toContain('oklch(');
		expect(variables['icon-success']).toContain('oklch(');
		expect(variables['sidebar-icon-uses-system']).toBe(iconColor === 'system' ? '1' : '0');
	});

	it('lifts the icons in dark mode rather than reusing the light values', () => {
		const light = sidebarVariables('shadcn', 'system', 'light');
		const dark = sidebarVariables('shadcn', 'system', 'dark');

		expect(dark['icon-info']).not.toBe(light['icon-info']);
	});
});

describe('the themes', () => {
	it('carries the sidebar variables into the layout a theme emits', () => {
		const theme = buildTheme({
			id: 'piano-test',
			name: 'Piano test',
			recipe: { seed: '#18181b' },
			layout: { sidebarStyle: 'piano', iconColor: 'system' }
		});
		const variables = layoutVariables(theme.layout, 'light');

		expect(variables['sidebar-style']).toBe('piano');
		expect(variables['sidebar-separator-width']).toBe('var(--border-width)');
		expect(variables['sidebar-icon-uses-system']).toBe('1');
	});

	it('ships a preset for every sidebar design, so each one can be seen without building it', () => {
		const covered = new Set(PRESETS.map((preset) => preset.layout.sidebarStyle));

		expect([...covered].sort()).toEqual([...SIDEBAR_STYLES].sort());
	});
});
