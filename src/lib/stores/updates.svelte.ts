// Types only, so nothing from the plugin is loaded in a browser that has no host to talk to.
import type { Update } from '@tauri-apps/plugin-updater';
import { isMockHost } from '$lib/bridge/client';

type Stage = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'failed';

/**
 * Whether a newer build is published, and fetching it on request.
 *
 * Checked once at start and never again on a timer: an app someone opens to pick a colour has no
 * business interrupting them twice an hour, and the answer does not change while they work. The
 * download only starts when they say so — this replaces the binary they are running.
 *
 * Everything here is desktop-only. The plugin talks to the updater endpoint through the host, so
 * in a development browser the whole thing stays `idle` rather than throwing on an import that
 * cannot resolve.
 */
class Updates {
	stage = $state<Stage>('idle');
	version = $state<string | null>(null);
	notes = $state<string | null>(null);
	error = $state<string | null>(null);
	/** 0–1 while downloading, once a content length is known. */
	progress = $state(0);

	#pending: Update | null = null;

	async check(): Promise<void> {
		if (isMockHost() || this.stage !== 'idle') return;
		this.stage = 'checking';

		try {
			const { check } = await import('@tauri-apps/plugin-updater');
			const update = await check();

			if (!update) {
				this.stage = 'idle';
				return;
			}
			this.#pending = update;
			this.version = update.version;
			this.notes = update.body ?? null;
			this.stage = 'available';
		} catch (caught) {
			// A release that has not been published yet, or no network: worth saying once in the Info
			// page, never worth a dialog over.
			this.error = caught instanceof Error ? caught.message : String(caught);
			this.stage = 'failed';
		}
	}

	async install(): Promise<void> {
		if (!this.#pending || this.stage !== 'available') return;
		this.stage = 'downloading';
		this.progress = 0;

		let total = 0;
		let received = 0;

		try {
			await this.#pending.downloadAndInstall((event) => {
				if (event.event === 'Started') total = event.data.contentLength ?? 0;
				else if (event.event === 'Progress') {
					received += event.data.chunkLength;
					if (total > 0) this.progress = received / total;
				}
			});

			this.stage = 'ready';
		} catch (caught) {
			this.error = caught instanceof Error ? caught.message : String(caught);
			this.stage = 'failed';
		}
	}

	/** The installer has run; the new binary only takes over on the next start. */
	async restart(): Promise<void> {
		const { relaunch } = await import('@tauri-apps/plugin-process');
		await relaunch();
	}
}

export const updates = new Updates();
