import { call } from '$lib/bridge/client';
import type { ProjectContext } from '$lib/bridge/contract';
import {
	buildImportPrompt,
	buildPrompt,
	extractTheme,
	IMPORT_SYSTEM,
	SYSTEM
} from '$lib/theme/prompt';
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

	/**
	 * Read a project's own look back out of it as a theme.
	 *
	 * The same transport and the same parser as a described theme, with a brief that asks for
	 * extraction instead of invention — and no conversation history, because the answer must depend
	 * on the project rather than on what was asked five turns ago. The result arrives in the studio
	 * as a tab like any other, which is what makes the round trip work: adjust it there, export it,
	 * and the project it came from can take it back.
	 */
	async importProject(root: string, label: string): Promise<Theme | null> {
		if (this.pending) return null;
		this.error = null;
		this.pending = true;
		this.messages = [...this.messages, { role: 'user', text: label }];

		try {
			const context = await call('project_scan', { root });
			this.context = context;

			const reply = await call('assistant_ask', {
				source: settings.source,
				system: IMPORT_SYSTEM,
				prompt: buildImportPrompt(context)
			});

			const { theme, problem } = extractTheme(reply, workshop.theme);
			this.messages = [
				...this.messages,
				{ role: 'assistant', text: reply, theme: theme ?? undefined, problem }
			];
			// The conversation keeps the reasoning either way; the caller gets the theme so an import
			// started from the gallery can land there without a detour through the chat.
			if (!theme && problem) this.error = problem;
			return theme;
		} catch (caught) {
			this.error = caught instanceof Error ? caught.message : String(caught);
			this.messages = this.messages.slice(0, -1);
			return null;
		} finally {
			this.pending = false;
		}
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
