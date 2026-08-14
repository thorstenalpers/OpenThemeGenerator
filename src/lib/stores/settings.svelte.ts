import { call } from '$lib/bridge/client';
import type { AssistantSource } from '$lib/bridge/contract';
import { i18n, isLocale, type Locale } from '$lib/i18n/index.svelte';

const LOCALE_KEY = 'otg.locale';
const SIDEBAR_KEY = 'otg.sidebar';
const APPLY_KEY = 'otg.applyToApp';
const TAB_CLOSE_KEY = 'otg.tabClose';

/**
 * Preferences the UI owns. They live in `localStorage` rather than in the host's settings file:
 * they only affect what this webview paints, and reading them before the first frame is what keeps
 * the app from flashing the wrong palette on every start.
 */
class SettingsStore {
	locale = $state<Locale>('en');
	sidebarExpanded = $state(true);
	applyToApp = $state(false);
	/** Whether the open themes under Studio carry a close button. */
	tabClose = $state(true);

	// The assistant source belongs to the host: it decides which transport Rust reaches for, and
	// the answer to "is the CLI even installed" only exists on that side.
	source = $state<AssistantSource>('cli');
	exportDirectory = $state<string | null>(null);

	restore(): void {
		void this.loadHostSettings();
		if (typeof localStorage === 'undefined') return;

		const locale = localStorage.getItem(LOCALE_KEY);
		if (locale && isLocale(locale)) this.locale = locale;
		i18n.locale = this.locale;

		this.sidebarExpanded = localStorage.getItem(SIDEBAR_KEY) !== 'collapsed';
		this.applyToApp = localStorage.getItem(APPLY_KEY) === 'on';
		this.tabClose = localStorage.getItem(TAB_CLOSE_KEY) !== 'off';
	}

	toggleSidebar(): void {
		this.sidebarExpanded = !this.sidebarExpanded;
		localStorage?.setItem(SIDEBAR_KEY, this.sidebarExpanded ? 'expanded' : 'collapsed');
	}

	setLocale(locale: Locale): void {
		this.locale = locale;
		i18n.locale = locale;
		localStorage?.setItem(LOCALE_KEY, locale);
	}

	setApplyToApp(on: boolean): void {
		this.applyToApp = on;
		localStorage?.setItem(APPLY_KEY, on ? 'on' : 'off');
	}

	setTabClose(on: boolean): void {
		this.tabClose = on;
		localStorage?.setItem(TAB_CLOSE_KEY, on ? 'on' : 'off');
	}

	async setSource(source: AssistantSource): Promise<void> {
		this.source = source;
		await this.save();
	}

	async setExportDirectory(directory: string): Promise<void> {
		this.exportDirectory = directory;
		await this.save();
	}

	private async save(): Promise<void> {
		const saved = await call('set_settings', {
			settings: { source: this.source, exportDirectory: this.exportDirectory }
		});
		this.source = saved.source;
		this.exportDirectory = saved.exportDirectory;
	}

	private async loadHostSettings(): Promise<void> {
		try {
			const stored = await call('get_settings', {});
			this.source = stored.source;
			this.exportDirectory = stored.exportDirectory;
		} catch {
			// A host that cannot answer leaves the defaults standing. Which transport the assistant
			// uses is not worth taking the app down for.
		}
	}
}

export const settings = new SettingsStore();
