import { DEFAULT_LAYOUT, layoutVariables } from './layout';
import { paletteOf, type Theme } from './theme';

const declaration = (variables: Record<string, string>): string =>
	Object.entries(variables)
		.map(([token, value]) => `--${token}: ${value}`)
		.join('; ');

/**
 * A theme as an inline `style` value.
 *
 * The preview sets the tokens on its own container rather than on `<html>`, which is what lets the
 * app's chrome keep its own colours while the sample next to it wears the theme being edited. It
 * works because `@theme inline` resolves `bg-background` to `var(--background)` at the utility, so
 * the nearest ancestor that declares the property wins.
 */
export function inlineStyle(theme: Theme, mode: 'light' | 'dark'): string {
	return declaration({ ...layoutVariables(theme.layout, mode), ...paletteOf(theme, mode) });
}

const APPLIED = 'otg-applied-theme';

/**
 * Paints the app itself in a theme. Transitions are suppressed across the swap: Chromium keeps the
 * old colour indefinitely on an element whose `transition` covers `background-color` when that
 * colour comes from a custom property changed on an ancestor.
 *
 * With no theme the structural half is still written, because the app's own navigation is drawn by
 * the same component as the preview and reads the same variables. Duplicating the default layout
 * into `app.css` by hand is exactly the copy-and-drift this app exists to end.
 */
export function applyToApp(theme: Theme | null): void {
	if (typeof document === 'undefined') return;

	const suppressor = document.createElement('style');
	suppressor.textContent =
		'*,*::before,*::after{transition:none!important;animation:none!important}';
	document.head.appendChild(suppressor);

	const previous = document.getElementById(APPLIED);
	previous?.remove();

	const scope = (mode: 'light' | 'dark') =>
		(theme ? inlineStyle(theme, mode) : declaration(layoutVariables(DEFAULT_LAYOUT, mode))).replace(
			/; /g,
			';'
		);

	const sheet = document.createElement('style');
	sheet.id = APPLIED;
	sheet.textContent = `:root{${scope('light')}}\n:root.dark{${scope('dark')}}`;
	document.head.appendChild(sheet);

	void document.body.offsetHeight;

	// The timeout is not belt and braces: a webview that is not compositing never fires rAF, and a
	// suppressor left in the document would kill every transition in the app for good.
	let removed = false;
	const remove = () => {
		if (removed) return;
		removed = true;
		suppressor.remove();
	};
	requestAnimationFrame(() => requestAnimationFrame(remove));
	setTimeout(remove, 100);
}
