<script lang="ts">
	import ThemeSidebar, { type SidebarEntry } from './theme-sidebar.svelte';
	import { SAMPLE_ENTRIES } from './preview-nav';
	import type { SidebarStyle } from '$lib/theme/sidebar';

	interface Props {
		style: SidebarStyle;
		/** Collapsed to the rail. The sidebar is always on the left and always able to do this. */
		collapsed: boolean;
		/** Which entry reads as current. */
		active?: number;
		/** Which of that entry's children is current, if the navigation went one level down. */
		child?: number | null;
		ontoggle?: () => void;
		/** Set when the preview is navigable; without it the rows are a picture, not a menu. */
		onselect?: (index: number, child: number | null) => void;
	}

	let { style, collapsed, active = 1, child = null, ontoggle, onselect }: Props = $props();

	const entries = $derived<SidebarEntry[]>(
		SAMPLE_ENTRIES.map((entry, index) => ({
			label: entry.label,
			icon: entry.icon,
			colour: entry.colour,
			section: entry.section,
			// Exactly one row is current. A parent whose child you are on is open, not active, or two
			// rows claim the page at once.
			active: index === active && child === null,
			onselect: onselect ? () => onselect(index, null) : undefined,
			children: entry.children?.map((label, childIndex) => ({
				label,
				active: index === active && child === childIndex,
				onselect: onselect ? () => onselect(index, childIndex) : undefined
			}))
		}))
	);
</script>

<ThemeSidebar {style} {entries} {collapsed} {ontoggle} title="Acme" />
