<script lang="ts" module>
	/**
	 * Every route the sidebar can reach, in one list so the layout can preload exactly what the
	 * navigation offers — a route added here is preloaded without anyone remembering to say so.
	 */
	export const ROUTES = ['/', '/studio', '/assistant', '/info', '/settings'] as const;

	export type Route = (typeof ROUTES)[number];
</script>

<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import GalleryIcon from '@lucide/svelte/icons/layout-grid';
	import StudioIcon from '@lucide/svelte/icons/sliders-horizontal';
	import AssistantIcon from '@lucide/svelte/icons/message-square';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import InfoIcon from '@lucide/svelte/icons/info';
	import ThemeSidebar, { type SidebarEntry } from '$lib/components/theme-sidebar.svelte';
	import { i18n } from '$lib/i18n/index.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { workshop } from '$lib/stores/workshop.svelte';
	import { DEFAULT_LAYOUT } from '$lib/theme/layout';

	const t = $derived(i18n.t);

	function isActive(route: string): boolean {
		const href = resolve(route as Route);
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}

	/**
	 * The app's own navigation wears the same design as the preview beside it.
	 *
	 * Both are the one component reading the one set of variables, so the two cannot drift: with
	 * `applyToApp` on, the chrome is literally the theme being edited; with it off, both fall back
	 * to the default layout, which `apply.ts` keeps on the document either way. Taking the style
	 * from anywhere other than the source of those variables is what would put the flags and the
	 * values out of step.
	 */
	const style = $derived(
		settings.applyToApp ? workshop.layout.sidebarStyle : DEFAULT_LAYOUT.sidebarStyle
	);

	const inStudio = $derived(isActive('/studio'));

	const entries = $derived<SidebarEntry[]>([
		{
			label: t.sidebar.gallery,
			icon: GalleryIcon,
			colour: 'feature',
			href: resolve('/'),
			active: isActive('/')
		},
		{
			label: t.sidebar.studio,
			icon: StudioIcon,
			colour: 'info',
			href: resolve('/studio'),
			// The open theme is what you are on, not the studio itself — otherwise the row and its
			// child both claim to be the current page.
			active: inStudio && workshop.tabs.length === 0,
			expanded: true,
			children: workshop.tabs.map((tab) => ({
				label: tab.name,
				// Two themes may carry one name — a saved copy keeps the name it was copied from — and
				// a keyed list with a duplicate key is a crash rather than a near miss.
				key: tab.id,
				href: resolve('/studio'),
				active: inStudio && workshop.id === tab.id,
				onselect: () => workshop.activate(tab.id),
				onclose:
					settings.tabClose && workshop.tabs.length > 1 ? () => workshop.close(tab.id) : undefined,
				closeLabel: `${t.studio.closeTab} — ${tab.name}`
			}))
		},
		{
			label: t.sidebar.assistant,
			icon: AssistantIcon,
			colour: 'media',
			href: resolve('/assistant'),
			active: isActive('/assistant')
		}
	]);

	// Info sits above Settings at the foot, where the things you reach for last belong.
	const footer = $derived<SidebarEntry[]>([
		{
			label: t.sidebar.info,
			icon: InfoIcon,
			colour: 'info',
			href: resolve('/info'),
			active: isActive('/info')
		},
		{
			label: t.sidebar.settings,
			icon: SettingsIcon,
			colour: 'warning',
			href: resolve('/settings'),
			active: isActive('/settings')
		}
	]);
</script>

<ThemeSidebar
	{style}
	{entries}
	{footer}
	responsive
	collapsed={!settings.sidebarExpanded}
	title={workshop.name}
	subtitle={t.sidebar.editing}
	label={t.sidebar.sections}
	toggleLabel={settings.sidebarExpanded ? t.sidebar.collapse : t.sidebar.expand}
	ontoggle={() => settings.toggleSidebar()}
/>
