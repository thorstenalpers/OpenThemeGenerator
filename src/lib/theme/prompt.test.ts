import { describe, expect, it } from 'vitest';
import { presetById } from './presets';
import { buildPrompt, extractTheme, SYSTEM } from './prompt';
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
