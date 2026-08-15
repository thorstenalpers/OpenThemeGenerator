<script lang="ts" module>
	import type { Component } from 'svelte';
	import type { IconColour } from '$lib/theme/sidebar';

	export interface SidebarChild {
		label: string;
		active?: boolean;
		href?: string;
		onselect?: () => void;
		/** Only the app's own tab list has children you can close. */
		onclose?: () => void;
		closeLabel?: string;
	}

	export interface SidebarEntry {
		label: string;
		icon: Component;
		/** Semantic colour, read only where the style paints its icons the way an OS does. */
		colour?: IconColour;
		section?: string;
		href?: string;
		active?: boolean;
		/**
		 * Show the children even when neither this row nor any of them is current. The app's own
		 * navigation wants it: a tab you can only see from inside the studio is a tab you have to be
		 * in the studio to remember you left open.
		 */
		expanded?: boolean;
		onselect?: () => void;
		children?: SidebarChild[];
	}
</script>

<script lang="ts">
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
	import XIcon from '@lucide/svelte/icons/x';
	import { SIDEBAR_SPECS, type SidebarStyle } from '$lib/theme/sidebar';

	interface Props {
		/** Which design to draw. It must be the style whose variables are in scope, or the two
		 *  halves of one sidebar — the flags here and the values there — will disagree. */
		style: SidebarStyle;
		entries: SidebarEntry[];
		/** A second group pinned to the foot, above nothing. */
		footer?: SidebarEntry[];
		collapsed: boolean;
		/** The brand line in the header. */
		title: string;
		subtitle?: string;
		/** What a screen reader calls the landmark, when that is not the brand. */
		label?: string;
		ontoggle?: () => void;
		toggleLabel?: string;
		/** The app's own chrome forces the rail below `md`; a fixed-width preview never does. */
		responsive?: boolean;
	}

	let {
		style,
		entries,
		footer = [],
		collapsed,
		title,
		subtitle,
		label = title,
		ontoggle,
		toggleLabel = 'Collapse the sidebar',
		responsive = false
	}: Props = $props();

	const spec = $derived(SIDEBAR_SPECS[style]);

	const sections = $derived(
		spec.sections
			? [...new Set(entries.map((entry) => entry.section ?? ''))].map((name) => ({
					name,
					items: entries.filter((entry) => (entry.section ?? '') === name)
				}))
			: [{ name: '', items: entries }]
	);

	const tagOf = (entry: SidebarEntry | SidebarChild) =>
		entry.href ? 'a' : entry.onselect ? 'button' : 'div';

	const attrsOf = (entry: SidebarEntry | SidebarChild) =>
		entry.href ? { href: entry.href } : entry.onselect ? { type: 'button' } : {};
</script>

{#snippet row(entry: SidebarEntry)}
	{@const Icon = entry.icon}
	{@const onChild = entry.children?.some((child) => child.active) ?? false}
	<svelte:element
		this={tagOf(entry)}
		{...attrsOf(entry)}
		onclick={entry.onselect}
		aria-current={entry.active ? 'page' : undefined}
		aria-label={entry.label}
		title={collapsed ? entry.label : undefined}
		class="row"
		class:active={entry.active}
		class:open={onChild}
		style:--icon-current="var(--icon-{entry.colour ?? 'info'})"
	>
		<span class="indicator" aria-hidden="true"></span>
		<Icon class="sb-icon" />
		<span class="label">{entry.label}</span>
	</svelte:element>

	{#if entry.children?.length && (entry.active || entry.expanded || onChild) && !collapsed}
		<!-- Indented against the parent rather than nested inside it: a submenu inside the row would
		     inherit the active fill and the relief, and a pressed key would appear to contain its
		     own children. -->
		<div class="children">
			{#each entry.children as child (child.label)}
				<svelte:element
					this={tagOf(child)}
					{...attrsOf(child)}
					onclick={child.onselect}
					aria-current={child.active ? 'page' : undefined}
					aria-label={child.label}
					class="child"
					class:active={child.active}
				>
					<span class="label">{child.label}</span>
					{#if child.onclose}
						<button
							type="button"
							class="close"
							aria-label={child.closeLabel ?? child.label}
							onclick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								child.onclose?.();
							}}
						>
							<XIcon class="sb-close" />
						</button>
					{/if}
				</svelte:element>
			{/each}
		</div>
	{/if}
{/snippet}

<aside class:collapsed class:responsive aria-label={label}>
	<!-- The pane is a layer of its own rather than an alpha on the sidebar colour: mica and vibrancy
	     are the page showing through, so the blur has to apply to what is behind it. At zero opacity
	     there is no pane at all and the page runs under the rows. -->
	<span aria-hidden="true" class="pane"></span>

	<div class="head">
		{#if ontoggle}
			<button type="button" class="toggle" aria-label={toggleLabel} onclick={() => ontoggle?.()}>
				<PanelLeftIcon class="sb-icon" />
			</button>
		{/if}
		{#if !collapsed}
			<span class="brand">
				<span class="brand-name">{title}</span>
				{#if subtitle}<span class="brand-sub">{subtitle}</span>{/if}
			</span>
		{/if}
	</div>

	<nav class="body">
		{#each sections as section (section.name)}
			<div class="group">
				{#if section.name && !collapsed}
					<span class="section">{section.name}</span>
				{/if}
				{#each section.items as entry (entry.label)}
					{@render row(entry)}
				{/each}
			</div>
		{/each}
	</nav>

	{#if footer.length > 0}
		<div class="foot">
			{#each footer as entry (entry.label)}
				{@render row(entry)}
			{/each}
		</div>
	{/if}
</aside>

<style>
	/* Everything below reads the sidebar variables and nothing else, so this one component draws all
	   twenty designs — and draws the app's own navigation and the preview identically, which is the
	   only way the two can be kept from drifting apart. */
	aside {
		position: relative;
		display: flex;
		flex: 0 0 auto;
		flex-direction: column;
		width: var(--sidebar-width);
		overflow: hidden;
		margin: var(--sidebar-floating);
		border-inline-end: var(--sidebar-border-width) solid var(--sidebar-border);
		border-radius: var(--sidebar-pane-radius);
		box-shadow: var(--sidebar-pane-shadow);
		color: var(--sidebar-foreground);
		isolation: isolate;
		transition: width 150ms;
	}

	aside.collapsed {
		width: var(--sidebar-width-icon);
	}

	.pane {
		position: absolute;
		z-index: -1;
		inset: 0;
		background: var(--sidebar);
		opacity: var(--sidebar-tint-opacity);
		backdrop-filter: blur(var(--sidebar-blur));
	}

	.head {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
		height: var(--header-height);
		padding-inline: var(--sidebar-padding);
		gap: calc(var(--spacing-base) * 2);
	}

	.toggle {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
		justify-content: center;
		width: calc(var(--sidebar-icon-size) * 1.9);
		height: calc(var(--sidebar-icon-size) * 1.9);
		padding: 0;
		border: none;
		border-radius: var(--sidebar-item-radius);
		background: transparent;
		color: inherit;
		cursor: pointer;
	}

	.toggle:hover {
		background: var(--sidebar-hover-surface);
	}

	.brand {
		display: flex;
		min-width: 0;
		flex-direction: column;
		line-height: 1.15;
	}

	.brand-name {
		overflow: hidden;
		font-weight: 700;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.brand-sub {
		overflow: hidden;
		font-size: 0.75em;
		opacity: 0.6;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.body {
		display: flex;
		min-height: 0;
		flex: 1;
		flex-direction: column;
		padding: var(--sidebar-padding);
		gap: calc(var(--spacing-base) * 2);
		overflow-x: hidden;
		overflow-y: hidden;
	}

	aside.responsive .body {
		overflow-y: auto;
	}

	.group,
	.foot {
		display: flex;
		flex-direction: column;
		gap: var(--sidebar-item-gap);
	}

	.foot {
		flex: 0 0 auto;
		padding: var(--sidebar-padding);
		border-top: var(--border-width) solid var(--sidebar-border);
	}

	.section {
		padding: calc(var(--spacing-base) * 1) calc(var(--spacing-base) * 2);
		font-size: 0.72em;
		font-weight: 600;
		letter-spacing: 0.06em;
		opacity: 0.55;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.row {
		position: relative;
		display: flex;
		width: 100%;
		height: var(--sidebar-item-height);
		align-items: center;
		/* The active-edge indicator parks itself outside the start edge when the row is not current.
		   Without this it is painted there rather than hidden — a row's own margin is not a clip, so
		   every entry wore the stroke that is supposed to mark exactly one. */
		overflow: hidden;
		padding-inline: calc(var(--spacing-base) * 2.5);
		border: var(--sidebar-item-border) solid var(--sidebar-border);
		/* Written after the shorthand and not folded into it: a shorthand resets all four edges, and
		   declaring it first is what silently cost the piano its key separators. */
		border-bottom: calc(var(--sidebar-item-border) + var(--sidebar-separator-width)) solid
			var(--sidebar-border);
		border-radius: var(--sidebar-item-radius);
		background-color: var(--sidebar-row-surface);
		background-image: var(--sidebar-row-gradient);
		box-shadow: var(--sidebar-row-shadow);
		color: inherit;
		cursor: pointer;
		font: inherit;
		font-weight: var(--sidebar-weight);
		gap: calc(var(--spacing-base) * 2.5);
		letter-spacing: var(--sidebar-letter-spacing);
		opacity: 0.78;
		text-align: start;
		text-decoration: none;
		text-transform: var(--sidebar-uppercase);
		transition:
			background-color 150ms,
			color 150ms,
			opacity 150ms;
		white-space: nowrap;
	}

	.row.open {
		opacity: 1;
	}

	.row:hover {
		opacity: 1;
	}

	.row:not(.active):hover {
		background-color: var(--sidebar-hover-surface);
	}

	.row:focus-visible,
	.child:focus-visible {
		outline: 2px solid var(--sidebar-ring);
		outline-offset: -2px;
	}

	.row.active {
		background-color: var(--sidebar-active-surface);
		background-image: var(--sidebar-row-gradient-active);
		box-shadow: var(--sidebar-row-shadow-active);
		color: var(--sidebar-active-foreground);
		font-weight: var(--sidebar-weight-active);
		opacity: 1;
	}

	.indicator {
		position: absolute;
		top: 22%;
		bottom: 22%;
		width: var(--sidebar-indicator-width);
		border-radius: 0 999px 999px 0;
		background: var(--sidebar-primary);
		inset-inline-start: 0;
		transform: translateX(-150%);
		transition: transform 200ms;
	}

	.row.active .indicator {
		transform: none;
	}

	.label {
		overflow: hidden;
		flex: 1;
		text-overflow: ellipsis;
	}

	.row :global(.sb-icon) {
		width: var(--sidebar-icon-size);
		height: var(--sidebar-icon-size);
		flex: 0 0 auto;
		color: var(--sidebar-icon-color);
	}

	.row.active :global(.sb-icon) {
		color: var(--sidebar-active-icon);
	}

	.toggle :global(.sb-icon) {
		width: var(--sidebar-icon-size);
		height: var(--sidebar-icon-size);
	}

	.children {
		display: flex;
		flex-direction: column;
		padding-inline-start: calc(var(--sidebar-icon-size) + var(--spacing-base) * 4);
		border-inline-start: var(--sidebar-child-border);
		margin-block: calc(var(--spacing-base) * 1);
		margin-inline-start: calc(var(--spacing-base) * 3);
		gap: var(--sidebar-item-gap);
	}

	.child {
		display: flex;
		height: calc(var(--sidebar-item-height) * 0.72);
		align-items: center;
		padding-inline: calc(var(--spacing-base) * 2.5);
		border: none;
		border-radius: var(--sidebar-item-radius);
		background: transparent;
		color: inherit;
		cursor: pointer;
		font: inherit;
		font-size: 0.92em;
		gap: calc(var(--spacing-base) * 1.5);
		opacity: 0.66;
		text-align: start;
		text-decoration: none;
		transition:
			background-color 150ms,
			opacity 150ms;
		white-space: nowrap;
	}

	.child:hover {
		background: var(--sidebar-hover-surface);
		opacity: 1;
	}

	.child.active {
		background: var(--sidebar-active-surface);
		color: var(--sidebar-active-foreground);
		opacity: 1;
	}

	.close {
		display: flex;
		width: 1em;
		height: 1em;
		flex: 0 0 auto;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		border-radius: 999px;
		background: transparent;
		color: inherit;
		cursor: pointer;
		opacity: 0.6;
	}

	.close:hover {
		background: var(--sidebar-hover-surface);
		opacity: 1;
	}

	.close :global(.sb-close) {
		width: 0.85em;
		height: 0.85em;
	}

	aside.collapsed .head,
	aside.collapsed .row {
		justify-content: center;
		padding-inline: 0;
	}

	aside.collapsed .label {
		display: none;
	}

	/* Below `md` the app's own chrome is a rail whatever the preference says: sixteen rem of
	   navigation on a narrow window leaves nothing for the preview. It is a media query rather than
	   a resize listener, so the width and the labels can never disagree for a frame. */
	@media (width < 48rem) {
		aside.responsive {
			width: var(--sidebar-width-icon);
		}

		aside.responsive .head,
		aside.responsive .row {
			justify-content: center;
			padding-inline: 0;
		}

		aside.responsive .label,
		aside.responsive .brand,
		aside.responsive .section,
		aside.responsive .children {
			display: none;
		}
	}
</style>
