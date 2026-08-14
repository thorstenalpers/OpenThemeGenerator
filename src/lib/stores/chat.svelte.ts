import { call } from '$lib/bridge/client';
import type { ProjectContext } from '$lib/bridge/contract';
import { buildPrompt, extractTheme, SYSTEM } from '$lib/theme/prompt';
import type { Theme } from '$lib/theme/theme';
import { settings } from './settings.svelte';
import { workshop } from './workshop.svelte';

export interface Message {
	role: 'user' | 'assistant';
	text: string;
	/** The theme the reply carried, once it has been read and completed. */
	theme?: Theme;
	/** Why no theme could be read, when the reply was prose only. */
	problem?: string | null;
}

/** Enough for "now make it warmer" to mean something, without resending the whole session. */
const CARRIED_TURNS = 4;

class Chat {
	messages = $state<Message[]>([]);
	pending = $state(false);
	error = $state<string | null>(null);
	context = $state<ProjectContext | null>(null);

	async attach(root: string): Promise<void> {
		this.error = null;
		try {
			this.context = await call('project_scan', { root });
		} catch (caught) {
			this.error = caught instanceof Error ? caught.message : String(caught);
		}
	}

	detach(): void {
		this.context = null;
	}

	clear(): void {
		this.messages = [];
		this.error = null;
	}

	async send(request: string): Promise<void> {
		const trimmed = request.trim();
		if (!trimmed || this.pending) return;

		this.error = null;
		this.pending = true;
		this.messages = [...this.messages, { role: 'user', text: trimmed }];

		try {
			const reply = await call('assistant_ask', {
				source: settings.source,
				system: SYSTEM,
				prompt: buildPrompt({
					request: trimmed,
					current: workshop.theme,
					context: this.context,
					history: this.messages.slice(-CARRIED_TURNS - 1, -1).map((message) => ({
						role: message.role,
						text: message.text
					}))
				})
			});

			const { theme, problem } = extractTheme(reply, workshop.theme);
			this.messages = [
				...this.messages,
				{ role: 'assistant', text: reply, theme: theme ?? undefined, problem }
			];
		} catch (caught) {
			this.error = caught instanceof Error ? caught.message : String(caught);
			// The failed turn is dropped: leaving it would send it again as history on the retry.
			this.messages = this.messages.slice(0, -1);
		} finally {
			this.pending = false;
		}
	}
}

export const chat = new Chat();
