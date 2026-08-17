import { describe, expect, it } from 'vitest';
import { presetById } from './presets';
import { buildImportPrompt, buildPrompt, extractTheme, IMPORT_SYSTEM, SYSTEM } from './prompt';
import { SIDEBAR_STYLES } from './sidebar';
import { inspect, type Theme } from './theme';

const azure = presetById('azure') as Theme;

describe('the prompt', () => {
	it('names every token the answer has to carry', () => {
		expect(SYSTEM).toContain('sidebar-primary-foreground');
		expect(SYSTEM).toContain('chart-5');
		expect(SYSTEM).toContain('4.5:1');
	});

	it('carries the project files and the theme being edited', () => {
		const prompt = buildPrompt({
			request: 'warmer',
			current: azure,
			context: {
				root: 'C:/Sources/OpenExamTrainer',
				stack: 'SvelteKit with Tailwind v4 and shadcn-svelte.',
				files: [{ path: 'src/app.css', bytes: 20, excerpt: ':root { --x: 1 }', truncated: true }]
			},
			history: [{ role: 'user', text: 'something calmer' }]
		});

		expect(prompt).toContain('SvelteKit with Tailwind v4');
		expect(prompt).toContain('--- src/app.css (truncated)');
		expect(prompt).toContain('Earlier request: something calmer');
		expect(prompt).toContain('Request: warmer');
		expect(prompt).toContain(azure.light.primary as string);
	});

	it('offers every sidebar design rather than the six it was written with', () => {
		for (const style of SIDEBAR_STYLES) expect(SYSTEM, style).toContain(`"${style}"`);
		expect(IMPORT_SYSTEM).toContain('"neumorph"');
	});
});

describe('importing a project', () => {
	const context = {
		root: 'C:/Sources/OpenExamTrainer',
		stack: 'SvelteKit with Tailwind v4 and shadcn-svelte.',
		files: [
			{ path: 'src/app.css', bytes: 20, excerpt: ':root { --brand: #123456 }', truncated: false },
			{ path: 'components.json', bytes: 9, excerpt: '{"style":"new-york"}', truncated: true }
		]
	};

	it('asks for what is there instead of for a design', () => {
		expect(IMPORT_SYSTEM).toContain('importing, not designing');
		expect(IMPORT_SYSTEM).toContain('Derive only what is genuinely absent');
		// The one failure mode worth naming in the brief: a project with nothing to read.
		expect(IMPORT_SYSTEM).toContain('say that plainly instead of inventing one');
	});

	it('sends the whole scan and none of the editor', () => {
		const prompt = buildImportPrompt(context);

		expect(prompt).toContain('SvelteKit with Tailwind v4');
		expect(prompt).toContain('--- src/app.css');
		expect(prompt).toContain('--brand: #123456');
		expect(prompt).toContain('--- components.json (truncated)');
		// The theme in the editor has no business steering an import.
		expect(prompt).not.toContain(azure.light.primary as string);
		expect(prompt).not.toContain('currently in the editor');
	});

	it('still demands the full token set, so a partial answer can be completed', () => {
		for (const token of ['sidebar-primary-foreground', 'chart-5', 'popover-foreground']) {
			expect(IMPORT_SYSTEM, token).toContain(token);
		}
	});
});

describe('reading a reply', () => {
	const body = (light: Record<string, string>) => ({
		id: 'sunset',
		name: 'Sunset',
		description: 'Warm.',
		tags: ['warm'],
		layout: { density: 'compact', radius: 0.25 },
		light,
		dark: azure.dark
	});

	it('takes the fenced block and ignores the prose around it', () => {
		const reply = `I warmed the greys up. Nothing else moved.

\`\`\`json
${JSON.stringify(body(azure.light))}
\`\`\`
`;
		const { theme, problem } = extractTheme(reply, azure);

		expect(problem).toBeNull();
		expect(theme?.id).toBe('sunset');
		expect(inspect(theme as Theme)).toEqual([]);
	});

	it('finds a bare object when the model forgot the fence', () => {
		const { theme } = extractTheme(`Here you go: ${JSON.stringify(body(azure.light))}`, azure);

		expect(theme?.name).toBe('Sunset');
	});

	it('fills the tokens the model left out from the theme on screen', () => {
		const partial = body({ background: '#ffffff', foreground: '#111111' });
		const { theme } = extractTheme(`\`\`\`json\n${JSON.stringify(partial)}\n\`\`\``, azure);

		expect(theme?.light.background).toBe('oklch(1 0 0)');
		expect(theme?.light['sidebar-ring']).toBe(azure.light['sidebar-ring']);
		expect(inspect(theme as Theme)).toEqual([]);
	});

	it('says what was wrong rather than returning half a theme', () => {
		expect(extractTheme('No JSON at all here.', azure)).toEqual({ theme: null, problem: null });

		const broken = extractTheme('```json\n{ "id": "x" }\n```', azure);
		expect(broken.theme).toBeNull();
		expect(broken.problem).toBeTruthy();
	});
});
