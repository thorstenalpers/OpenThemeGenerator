import type { ProjectContext } from '$lib/bridge/contract';
import { SIDEBAR_SPECS, SIDEBAR_STYLES } from './sidebar';
import { complete, themeSchema, type Theme } from './theme';
import { TOKENS } from './tokens';

/** Written from the specs rather than by hand, so a new design cannot go missing from the brief. */
const SIDEBAR_CHOICES = SIDEBAR_STYLES.map((style) => `"${style}" (${SIDEBAR_SPECS[style].label})`)
	.join(', ')
	.replace(/^/, '');

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
  sidebarStyle  the sidebar's whole design, one of:
                ${SIDEBAR_CHOICES}
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

/**
 * Reading a project's theme back out of it, rather than writing one for it.
 *
 * The difference from `SYSTEM` is the whole point: this asks for what is already there. A project
 * that already looks like something has that look scattered across a stylesheet, a Tailwind config
 * and whatever the team happened to name their variables — and the job is to land it on this token
 * set without redesigning it on the way. What cannot be read has to be derived and declared as
 * derived, because the one thing an import must not do is quietly invent a brand colour.
 */
export const IMPORT_SYSTEM = `You read an existing project's visual design and express it as a
shadcn-style theme. You are importing, not designing.

Answer with one short paragraph, then one \`\`\`json fenced block and nothing after it, in exactly
the shape described below.

  id           kebab-case, from the project's own name where you can see it
  name         the project's name, or a short human one
  description  one sentence saying what the project's look is
  tags         array of short strings
  layout       object, see below
  light        object of token -> colour
  dark         object of token -> colour

Rules that make this an import rather than a redesign:
- Use the values the project already has. A colour you can read from its stylesheet, its Tailwind
  config or its component classes goes in unchanged.
- Map the project's own naming onto the token set. A variable called --brand, --surface, --panel or
  a Tailwind \`primary\` scale is what \`primary\`, \`background\`, \`card\` and so on are for.
- Derive only what is genuinely absent, and stay near what is there when you do: a missing
  \`chart-3\` comes from the palette you found, not from your own taste.
- Infer \`layout\` from what you can see — rounded-lg and a border-2 are radius and borderWidth, a
  w-64 aside is sidebarWidth, tight paddings are a compact density.
- If the project declares only a light palette, build the dark one from it and say so.
- If the project has no theme worth reading, say that plainly instead of inventing one.
- In the paragraph: which tokens came from the project, which you derived, and where you had to
  guess. That is the only part of the answer anyone can check.

Every token must be present in both palettes:
${TOKENS.map((token) => token.name).join(', ')}

\`layout\` fields are the same as for a designed theme, all optional:
  density "compact" | "normal" | "comfortable"; radius in rem 0–2; borderWidth in px 0–4;
  elevation "none" | "subtle" | "soft" | "lifted"; sidebarWidth rem 8–28; sidebarRail rem 2–8;
  contentWidth rem 40–120; iconColor "mono" | "system"; sidebarStyle one of:
  ${SIDEBAR_CHOICES}

Colours are \`oklch(L C H)\` with L between 0 and 1; hex is accepted.`;

/** Everything the scan found, and nothing about the theme currently in the editor. */
export function buildImportPrompt(context: ProjectContext): string {
	return [
		`Import the theme this project already uses. ${context.stack}`,
		context.files
			.map((file) => `--- ${file.path}${file.truncated ? ' (truncated)' : ''}\n${file.excerpt}`)
			.join('\n\n'),
		'Read its colours and structure and express them as the token set above.'
	].join('\n\n');
}

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
