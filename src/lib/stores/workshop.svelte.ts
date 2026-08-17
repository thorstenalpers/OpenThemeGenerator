import { buildTheme, DEFAULT_RECIPE, type Recipe } from '$lib/theme/generate';
import { DEFAULT_LAYOUT, type Layout } from '$lib/theme/layout';
import { PRESET_DRAFTS, presetById } from '$lib/theme/presets';
import { TEMPLATE_DRAFTS } from '$lib/theme/templates';
import type { ThemeDraft } from '$lib/theme/generate';
import type { Theme } from '$lib/theme/theme';
import type { Palette } from '$lib/theme/tokens';
import { library } from './library.svelte';

const STORAGE_KEY = 'otg.workshop';

/** One open theme. Everything the studio edits belongs to a tab, not to the app. */
interface Tab {
	id: string;
	name: string;
	description: string;
	/**
	 * The state this tab was opened in. Renaming never touches it, and neither does anything else —
	 * it is what reset goes back to.
	 *
	 * It has to carry the overrides as well as the recipe. An imported theme arrives as a flat
	 * palette and nothing else, so a reset that only cleared the overrides would not restore it, it
	 * would delete it and leave whatever the seed happens to derive.
	 */
	origin: {
		id: string;
		name: string;
		recipe: Recipe;
		layout: Layout;
		overrides: { light: Palette; dark: Palette };
	} | null;
	tags: string[];
	recipe: Recipe;
	layout: Layout;
	overrides: { light: Palette; dark: Palette };
}

interface Stored {
	tabs: Tab[];
	activeId: string;
}

function tabFromDraft(draft: ThemeDraft): Tab {
	const recipe = { ...DEFAULT_RECIPE, ...draft.recipe };
	const layout = { ...DEFAULT_LAYOUT, ...draft.layout };
	const overrides = {
		light: { ...draft.overrides?.light },
		dark: { ...draft.overrides?.dark }
	};

	return {
		id: draft.id,
		name: draft.name,
		origin: { id: draft.id, name: draft.name, recipe, layout, overrides },
		description: draft.description ?? '',
		tags: [...(draft.tags ?? [])],
		recipe: { ...recipe },
		layout: { ...layout },
		overrides: { light: { ...overrides.light }, dark: { ...overrides.dark } }
	};
}

/**
 * The open themes and which one the studio is editing.
 *
 * A theme is a recipe plus the tokens someone overruled by hand, never a flat table of values.
 * That is what lets "make the corners tighter" stay one number, and what `reset` falls back
 * to when an experiment goes wrong. Several can be open at once: comparing two candidates means
 * switching between them, not rebuilding the one you left.
 */
class Workshop {
	tabs = $state<Tab[]>([]);
	activeId = $state('');

	get active(): Tab {
		return this.tabs.find((tab) => tab.id === this.activeId) ?? (this.tabs[0] as Tab);
	}

	get id(): string {
		return this.active?.id ?? 'custom';
	}
	get name(): string {
		return this.active?.name ?? 'Custom';
	}
	get recipe(): Recipe {
		return this.active?.recipe ?? DEFAULT_RECIPE;
	}
	get layout(): Layout {
		return this.active?.layout ?? DEFAULT_LAYOUT;
	}
	get origin() {
		return this.active?.origin ?? null;
	}

	theme: Theme = $derived(
		buildTheme({
			id: this.id,
			name: this.name,
			description: this.active?.description ?? '',
			tags: this.active?.tags ?? [],
			recipe: this.recipe,
			layout: this.layout,
			overrides: this.active?.overrides ?? { light: {}, dark: {} }
		})
	);

	get editedCount(): number {
		const overrides = this.active?.overrides;
		if (!overrides) return 0;
		return Object.keys(overrides.light).length + Object.keys(overrides.dark).length;
	}

	isEdited(mode: 'light' | 'dark', token: string): boolean {
		return this.active?.overrides[mode][token] !== undefined;
	}

	setToken(mode: 'light' | 'dark', token: string, value: string): void {
		const tab = this.active;
		if (!tab) return;
		tab.overrides = { ...tab.overrides, [mode]: { ...tab.overrides[mode], [token]: value } };
		this.persist();
	}

	clearToken(mode: 'light' | 'dark', token: string): void {
		const tab = this.active;
		if (!tab) return;
		const next = { ...tab.overrides[mode] };
		delete next[token];
		tab.overrides = { ...tab.overrides, [mode]: next };
		this.persist();
	}

	setRecipe(changes: Partial<Recipe>): void {
		if (!this.active) return;
		this.active.recipe = { ...this.active.recipe, ...changes };
		this.persist();
	}

	setLayout(changes: Partial<Layout>): void {
		if (!this.active) return;
		this.active.layout = { ...this.active.layout, ...changes };
		this.persist();
	}

	rename(name: string): void {
		const tab = this.active;
		if (!tab) return;
		tab.name = name;
		const slug =
			name
				.trim()
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '') || 'custom';

		// The id is what an export file is named after, so two tabs may not share one.
		tab.id = this.tabs.some((other) => other !== tab && other.id === slug) ? `${slug}-2` : slug;
		this.activeId = tab.id;
		this.persist();
	}

	/**
	 * Back to the theme as it was opened — the seed and every other dial, the structure, and the
	 * hand-set tokens all at once.
	 *
	 * Clearing the overrides alone left the recipe standing, so a seed nudged to the wrong hue
	 * survived the one button meant to undo it. A tab with no origin behind it — a theme the
	 * assistant wrote — has nothing to go back to but the defaults.
	 */
	reset(): void {
		const tab = this.active;
		if (!tab) return;

		const origin = tab.origin;
		tab.recipe = { ...(origin?.recipe ?? DEFAULT_RECIPE) };
		tab.layout = { ...(origin?.layout ?? DEFAULT_LAYOUT) };
		tab.overrides = {
			light: { ...origin?.overrides.light },
			dark: { ...origin?.overrides.dark }
		};
		this.persist();
	}

	activate(id: string): void {
		if (this.tabs.some((tab) => tab.id === id)) {
			this.activeId = id;
			this.persist();
		}
	}

	close(id: string): void {
		const index = this.tabs.findIndex((tab) => tab.id === id);
		if (index === -1) return;

		this.tabs = this.tabs.filter((tab) => tab.id !== id);
		if (this.tabs.length === 0) this.open(PRESET_DRAFTS[0] as ThemeDraft);
		else if (this.activeId === id) {
			this.activeId = (this.tabs[Math.min(index, this.tabs.length - 1)] as Tab).id;
		}
		this.persist();
	}

	/** Opens a draft as a tab, or focuses the one already open for it. */
	open(draft: ThemeDraft): void {
		const existing = this.tabs.find((tab) => tab.id === draft.id);
		if (existing) {
			this.activeId = existing.id;
		} else {
			this.tabs = [...this.tabs, tabFromDraft(draft)];
			this.activeId = draft.id;
		}
		this.persist();
	}

	/**
	 * A finished theme with no recipe behind it — what the assistant answers with. Every token
	 * becomes an override, so the palette is exactly what arrived; the recipe stays as a starting
	 * point for whoever presses reset.
	 */
	loadTheme(theme: Theme): void {
		this.open({
			id: theme.id,
			name: theme.name,
			description: theme.description,
			tags: [...theme.tags],
			recipe: { ...this.recipe },
			layout: { ...theme.layout },
			overrides: { light: { ...theme.light }, dark: { ...theme.dark } }
		});
	}

	loadPreset(id: string): void {
		// A draft first, because it carries the recipe: opening a generated theme should leave the
		// sliders meaning something, where an imported one can only ever arrive as a flat palette.
		// A saved theme is a draft too, which is the whole reason the library stores drafts.
		const draft =
			library.find(id) ??
			[...PRESET_DRAFTS, ...TEMPLATE_DRAFTS].find((candidate) => candidate.id === id);
		if (draft) this.open(draft);
		else {
			const preset = presetById(id);
			if (preset) this.loadTheme(preset);
		}
	}

	/**
	 * Takes an id the library has cleared as free, without touching the name.
	 *
	 * Saving an edited built-in has to become its own entry, and its id is what tells it apart from
	 * the one it came from — in the gallery's keyed list and in the name of every file it exports.
	 */
	adoptId(id: string): void {
		const tab = this.active;
		if (!tab || tab.id === id) return;
		tab.id = id;
		this.activeId = id;
		this.persist();
	}

	/** The open tab as a draft: what the library stores and what reopening it restores. */
	toDraft(): ThemeDraft {
		const tab = this.active;
		return {
			id: tab.id,
			name: tab.name,
			description: tab.description,
			tags: [...tab.tags],
			recipe: { ...tab.recipe },
			layout: { ...tab.layout },
			overrides: { light: { ...tab.overrides.light }, dark: { ...tab.overrides.dark } }
		};
	}

	restore(): void {
		if (typeof localStorage === 'undefined') return;
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			this.loadPreset('graphite');
			return;
		}
		try {
			const stored = JSON.parse(raw) as Stored;
			if (!Array.isArray(stored.tabs) || stored.tabs.length === 0) throw new Error('no tabs');

			this.tabs = stored.tabs.map((tab) => ({
				...tab,
				recipe: { ...DEFAULT_RECIPE, ...tab.recipe },
				layout: { ...DEFAULT_LAYOUT, ...tab.layout },
				// Tabs stored before reset needed them have an origin without overrides. Reading the
				// field back as undefined would make the first reset wipe the palette of an imported
				// theme, so it is filled in from what the tab currently holds.
				origin: tab.origin && {
					...tab.origin,
					overrides: tab.origin.overrides ?? {
						light: { ...tab.overrides.light },
						dark: { ...tab.overrides.dark }
					}
				}
			}));
			this.activeId = stored.activeId;
			if (!this.active) this.activeId = (this.tabs[0] as Tab).id;
		} catch {
			// A half-written or outdated entry is not worth a crash on start: the gallery is one
			// click away and the built-ins are all still there.
			this.tabs = [];
			this.loadPreset('graphite');
		}
	}

	private persist(): void {
		if (typeof localStorage === 'undefined') return;
		const stored: Stored = { tabs: this.tabs, activeId: this.activeId };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
	}
}

export const workshop = new Workshop();
