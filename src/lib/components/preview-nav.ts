import ChartIcon from '@lucide/svelte/icons/chart-column';
import FolderIcon from '@lucide/svelte/icons/folder-kanban';
import HomeIcon from '@lucide/svelte/icons/layout-dashboard';
import InfoIcon from '@lucide/svelte/icons/info';
import SettingsIcon from '@lucide/svelte/icons/settings';
import UsersIcon from '@lucide/svelte/icons/users';
import type { Component } from 'svelte';
import type { IconColour } from '$lib/theme/sidebar';

export interface SampleEntry {
	label: string;
	icon: Component;
	colour: IconColour;
	section: string;
	children?: string[];
}

/**
 * The sample navigation the preview draws.
 *
 * Each entry names a semantic colour rather than a literal one: under `mono` the icons inherit the
 * row's text colour and these are never read, and under `system` they are what makes an info icon
 * blue and a members icon green in every theme.
 */
export const SAMPLE_ENTRIES: readonly SampleEntry[] = [
	{ label: 'Overview', icon: HomeIcon, colour: 'info', section: 'Workspace' },
	{
		label: 'Projects',
		icon: FolderIcon,
		colour: 'feature',
		section: 'Workspace',
		children: ['Acme Web', 'Acme API', 'Marketing site']
	},
	{ label: 'Reports', icon: ChartIcon, colour: 'media', section: 'Workspace' },
	{ label: 'Members', icon: UsersIcon, colour: 'success', section: 'Account' },
	{ label: 'Settings', icon: SettingsIcon, colour: 'warning', section: 'Account' },
	{ label: 'About', icon: InfoIcon, colour: 'info', section: 'Account' }
];
