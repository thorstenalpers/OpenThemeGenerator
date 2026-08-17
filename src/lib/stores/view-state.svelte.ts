import type { FormatId } from '$lib/theme/export';

/**
 * What a view had on screen, kept beyond its own lifetime.
 *
 * Routing unmounts a page, so anything held in a `let … = $state()` inside a view is gone the
 * moment you click elsewhere. For most of it that is correct — an error should not outlive the
 * thing that caused it. These are the ones where it is not: choices the user made and text they
 * typed, which coming back should find exactly as left.
 *
 * Module-level runes rather than a snapshot per route: the state belongs to the app, not to a
 * history entry, so it survives a click as well as a back button.
 */
class ViewState {
	/** Which mode's tokens the studio grid shows. */
	studioMode = $state<'light' | 'dark'>('light');

	/** What the studio shows beside the editor: the theme as an app, as a landing page, or as
	 *  points in the colour space it is written in. */
	studioSurface = $state<'app' | 'landing' | 'space'>('app');

	/** The export dialog's choices. Which format a project needs does not change per theme. */
	export = $state<{
		formatId: FormatId;
		colorSpace: 'oklch' | 'hex';
		includeExtras: boolean;
		includeReadme: boolean;
	}>({ formatId: 'tailwind-v4', colorSpace: 'oklch', includeExtras: true, includeReadme: true });

	/** How the gallery is filtered. Forty-odd themes need one, and scrolling back to re-apply it
	 *  after every visit to the studio would make the filter worse than useless. */
	gallery = $state<{
		source: 'all' | 'generated' | 'templates' | 'registry';
		tag: string | null;
		search: string;
		page: number;
		/** Two cards a row, one wide card a row, or a dense table. */
		layout: 'grid' | 'single' | 'list';
		/** Which modes each card previews. Dropping one gives the other the whole card. */
		modes: { light: boolean; dark: boolean };
		/**
		 * Ordered by, in the list view stacked: the first click is primary, the next secondary.
		 *
		 * `curated` is the hand-written order the gallery ships in and has no button — it is what
		 * "not sorted by anything" means, and the tie-breaker under everything else.
		 */
		sort: { key: 'curated' | 'name' | 'added'; desc: boolean }[];
	}>({
		source: 'all',
		tag: null,
		search: '',
		page: 1,
		layout: 'grid',
		modes: { light: true, dark: true },
		sort: [{ key: 'curated', desc: false }]
	});

	/** Which studio panels are open. Collapsed ones stay collapsed across navigation. */
	panels = $state({ colour: true, layout: true });

	/** The chat prompt, half-typed. Navigating away to check a token must not eat it. */
	chatDraft = $state('');
}

export const viewState = new ViewState();
