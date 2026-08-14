import type { ProjectContext } from '$lib/bridge/contract';
import { complete, themeSchema, type Theme } from './theme';
import { TOKENS } from './tokens';

export const SYSTEM = `You design colour themes for shadcn-style design systems.

Answer with one short paragraph, then one \`\`\`json fenced block and nothing after it. The block is
an object with exactly these keys:

  id           kebab-case
  name         short, human
  description  one sentence
  tags         array of short strings
  layout       object, see below
  light        object of token -> colour
  dark         object of token -> colour

\`layout\` is the structure, not the palette. Every field is optional and falls back to a sane
default, so send only the ones the request actually calls for:

  density       "compact" | "normal" | "comfortable" — moves spacing, base font size and header
  radius        corner radius in rem, 0 to 2
  borderWidth   in px, 0 to 4. 0 means the design leans on shadow and fill instead
  elevation     "none" | "subtle" | "soft" | "lifted"
  sidebarWidth  expanded sidebar in rem, 8 to 28
  sidebarRail   collapsed sidebar in rem, 2 to 8
  sidebarStyle  "shadcn" | "piano" | "x" | "vercel" | "win11" | "macos" — the sidebar's whole
                design. piano is full-width keys with hairline separators; x is big icons in round
                pills; vercel is small dense rows under section labels; win11 is a translucent
                mica pane with an accent edge; macos is a small translucent list with sections
  iconColor     "mono" (icons inherit the text colour) | "system" (semantic defaults: blue for
                info, green for success, amber for warnings)
  contentWidth  where a centred page stops growing, in rem, 40 to 120

Both palettes must carry every one of these tokens:
${TOKENS.map((token) => token.name).join(', ')}

Rules:
- Colours are \`oklch(L C H)\`, L between 0 and 1. Hex is accepted but OKLCH is preferred.
- Every foreground token must reach at least 4.5:1 against the surface it names.
- \`chart-1\` to \`chart-5\` must be distinguishable from each other, not five steps of one grey.
- The dark palette is its own design, not the light one inverted.
- A request about the shape of the page — dense, roomy, sharp, flat, wide, narrow — is a \`layout\`
  change. Do not answer it by nudging colours.
- A request that names a product's navigation — "like Vercel", "like Windows", "like a Mac app" —
  is \`sidebarStyle\`. The sidebar is always on the left and always collapsible; do not propose
  moving it or removing it.
- Say what you changed and why in the paragraph. Do not explain the JSON.`;

export interface PromptInput {
	request: string;
	current: Theme;
	context: ProjectContext | null;
	/** Earlier turns, oldest first. Only the text is carried, never the parsed themes. */
	history: { role: 'user' | 'assistant'; text: string }[];
}

export function buildPrompt({ request, current, context, history }: PromptInput): string {
	const parts: string[] = [];

	if (context) {
		parts.push(
			`The theme is for this project. ${context.stack}\n\n${context.files
				.map((file) => `--- ${file.path}${file.truncated ? ' (truncated)' : ''}\n${file.excerpt}`)
				.join('\n\n')}`
		);
	}

	parts.push(
		`The theme currently in the editor:\n\`\`\`json\n${JSON.stringify(
			{
				id: current.id,
				name: current.name,
				layout: current.layout,
				light: current.light,
				dark: current.dark
			},
			null,
			2
		)}\n\`\`\``
	);

	for (const turn of history) {
		parts.push(`${turn.role === 'user' ? 'Earlier request' : 'Your earlier answer'}: ${turn.text}`);
	}

	parts.push(`Request: ${request}`);
	return parts.join('\n\n');
}

/** Fenced first, because a reply that also discusses colours in prose has braces in the prose too. */
function candidates(reply: string): string[] {
	const fenced = [...reply.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)]
		.map((match) => match[1]?.trim() ?? '')
		.filter(Boolean);

	const start = reply.indexOf('{');
	if (start === -1) return fenced;

	let depth = 0;
	for (let index = start; index < reply.length; index += 1) {
		const char = reply[index];
		if (char === '{') depth += 1;
		else if (char === '}') {
			depth -= 1;
			if (depth === 0) return [...fenced, reply.slice(start, index + 1)];
		}
	}
	return fenced;
}

export interface ExtractResult {
	theme: Theme | null;
	/** Why nothing could be read, in the words the chat view shows. */
	problem: string | null;
}

/**
 * The theme inside a reply. `fallback` fills tokens the model forgot rather than letting a
 * near-complete answer fail over one missing sidebar colour.
 */
export function extractTheme(reply: string, fallback: Theme): ExtractResult {
	let lastProblem: string | null = null;

	for (const candidate of candidates(reply)) {
		let parsed: unknown;
		try {
			parsed = JSON.parse(candidate);
		} catch {
			lastProblem = 'the block in that reply is not valid JSON';
			continue;
		}

		const result = themeSchema.safeParse(parsed);
		if (!result.success) {
			lastProblem = result.error.issues[0]?.message ?? 'the JSON is not a theme';
			continue;
		}
		return { theme: complete(result.data, fallback), problem: null };
	}

	return { theme: null, problem: lastProblem };
}
