import { buildTheme, type ThemeDraft } from '$lib/theme/generate';
import { presetById } from '$lib/theme/presets';
import type { Theme } from '$lib/theme/theme';

const STORAGE_KEY = 'otg.library';

export interface SavedDraft extends ThemeDraft {
	/** When it was last written, for the gallery's date order. */
	savedAt: string;
}

/**
 * The themes you saved, beside the ones the app ships with.
 *
 * A draft is stored rather than a finished palette — recipe, structure and the tokens overruled by
 * hand — so reopening one leaves the sliders meaning something instead of handing back a flat table
 * of colours nothing can be derived from any more. It is the same shape a built-in preset has,
 * which is what lets the gallery, the studio and every exporter treat both alike.
 *
 * On disk, in `localStorage`, because a theme generator that phones home to keep your work is not
 * one anybody needs.
 */
class Library {
	drafts = $state<SavedDraft[]>([]);

	themes: Theme[] = $derived(this.drafts.map((draft) => buildTheme(draft)));

	has(id: string): boolean {
		return this.drafts.some((draft) => draft.id === id);
	}

	find(id: string): SavedDraft | undefined {
		return this.drafts.find((draft) => draft.id === id);
	}

	/**
	 * An id nothing else is using — neither a built-in nor another saved theme.
	 *
	 * Saving an edited Graphite under `graphite` put two cards with one id into the gallery, and a
	 * keyed list with a duplicate key is a crash, not a near miss. The id is also what an export
	 * file is named after, so it has to be its own regardless.
	 */
	freeId(id: string): string {
		// Saving over an entry that is already yours is an update, not a collision.
		if (this.has(id)) return id;

		const taken = (candidate: string) =>
			presetById(candidate) !== undefined || this.drafts.some((draft) => draft.id === candidate);

		if (!taken(id)) return id;
		for (let suffix = 2; ; suffix += 1) {
			if (!taken(`${id}-${suffix}`)) return `${id}-${suffix}`;
		}
	}

	/**
	 * Writes a draft under its own id, replacing the entry already there.
	 *
	 * Saving the same theme twice is a correction, not a second theme. A new name gives a new id,
	 * which is how "save a copy" works without a button for it.
	 */
	save(draft: ThemeDraft, at: string): void {
		const saved: SavedDraft = { ...draft, savedAt: at };
		const index = this.drafts.findIndex((candidate) => candidate.id === draft.id);

		this.drafts =
			index === -1
				? [saved, ...this.drafts]
				: this.drafts.map((candidate, position) => (position === index ? saved : candidate));
		this.persist();
	}

	remove(id: string): void {
		this.drafts = this.drafts.filter((draft) => draft.id !== id);
		this.persist();
	}

	restore(): void {
		if (typeof localStorage === 'undefined') return;
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;

		try {
			const stored: unknown = JSON.parse(raw);
			if (!Array.isArray(stored)) throw new Error('not a list');

			// Built through the generator on the way in, so an entry that cannot become a theme is
			// dropped here rather than breaking the gallery it would have been drawn into.
			const usable = (entry: unknown): entry is SavedDraft => {
				const draft = entry as SavedDraft;
				if (typeof draft?.id !== 'string' || typeof draft.name !== 'string') return false;
				try {
					buildTheme(draft);
					return true;
				} catch {
					return false;
				}
			};

			this.drafts = stored.filter(usable);
		} catch {
			this.drafts = [];
		}
	}

	private persist(): void {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(this.drafts));
	}
}

export const library = new Library();
