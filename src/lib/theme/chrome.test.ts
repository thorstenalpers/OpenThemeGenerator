import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { contrast } from './color';
import { TOKEN_NAMES, TOKEN_PAIRS } from './tokens';

/**
 * The app's own chrome, held to the bar it holds everyone else to.
 *
 * `app.css` is hand-written — it is what the window wears before a theme is applied to it — so it
 * is the one palette in the project the generator cannot keep honest. It drifted exactly the way
 * an unwatched copy does: `success` was corrected in the generator and left behind here, and the
 * app shipped a swatch its own gallery would have flagged.
 */
const css = readFileSync('src/app.css', 'utf8');

function rules(text: string): { selector: string; body: string }[] {
	const out: { selector: string; body: string }[] = [];
	let depth = 0;
	let selectorStart = 0;
	let open = -1;

	for (let index = 0; index < text.length; index += 1) {
		if (text[index] === '{') {
			if (depth === 0) open = index + 1;
			depth += 1;
		} else if (text[index] === '}') {
			depth -= 1;
			if (depth === 0) {
				out.push({
					selector: text
						.slice(selectorStart, open - 1)
						.trim()
						.replace(/\s+/g, ' '),
					body: text.slice(open, index)
				});
				selectorStart = index + 1;
			}
		}
	}
	return out;
}

const declarations = (body: string): Record<string, string> =>
	Object.fromEntries(
		[...body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)].map((match) => [
			match[1] as string,
			(match[2] as string).trim()
		])
	);

/** The two palettes, found by what they declare rather than by a selector that could be renamed. */
const palettes = (() => {
	const found: Record<string, Record<string, string>> = {};
	for (const rule of rules(css)) {
		const declared = declarations(rule.body);
		if (!declared.background || !declared.foreground) continue;
		found[rule.selector.endsWith('.dark') ? 'dark' : 'light'] = declared;
	}
	return found;
})();

describe("the app's own stylesheet", () => {
	it('declares both palettes', () => {
		expect(Object.keys(palettes).sort()).toEqual(['dark', 'light']);
	});

	it.each(['light', 'dark'])('%s carries every token an export would write', (mode) => {
		const palette = palettes[mode] as Record<string, string>;
		for (const token of TOKEN_NAMES) expect(palette[token], `--${token}`).toBeTruthy();
	});

	it.each(['light', 'dark'])('%s keeps its text above 4.5:1', (mode) => {
		const palette = palettes[mode] as Record<string, string>;
		for (const { surface, label } of TOKEN_PAIRS) {
			const ratio = contrast(palette[surface] ?? '', palette[label] ?? '');
			expect(ratio, `${mode} ${surface}/${label}`).toBeGreaterThanOrEqual(4.5);
		}
	});
});
