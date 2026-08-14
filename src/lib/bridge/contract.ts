import { z } from 'zod';

export const assistantSource = z.enum(['cli', 'anthropic']);
export type AssistantSource = z.infer<typeof assistantSource>;

export const assistantStatus = z.object({
	source: assistantSource,
	cliAvailable: z.boolean(),
	hasKey: z.boolean()
});
export type AssistantStatus = z.infer<typeof assistantStatus>;

export const hostSettings = z.object({
	source: assistantSource,
	/** Where the last export went, so the next one opens there. */
	exportDirectory: z.string().nullable()
});
export type HostSettings = z.infer<typeof hostSettings>;

export const projectFile = z.object({
	/** Relative to the scanned root, with forward slashes on every platform. */
	path: z.string(),
	bytes: z.number(),
	/** Truncated: a whole design system does not fit in a prompt, and its tokens do. */
	excerpt: z.string(),
	truncated: z.boolean()
});
export type ProjectFile = z.infer<typeof projectFile>;

export const projectContext = z.object({
	root: z.string(),
	files: z.array(projectFile),
	/** What the scan concluded about the stack, in one line for the prompt. */
	stack: z.string()
});
export type ProjectContext = z.infer<typeof projectContext>;

export const writtenFile = z.object({ path: z.string() });

export const commands = {
	get_settings: { response: hostSettings },
	set_settings: { response: hostSettings },
	assistant_status: { response: assistantStatus },
	assistant_set_key: { response: z.null() },
	assistant_ask: { response: z.string() },
	project_scan: { response: projectContext },
	export_write: { response: z.array(writtenFile) },
	reveal: { response: z.null() }
} as const;

export type CommandName = keyof typeof commands;
export type CommandResponse<T extends CommandName> = z.infer<(typeof commands)[T]['response']>;

export interface CommandArgs {
	get_settings: Record<string, never>;
	set_settings: { settings: HostSettings };
	assistant_status: { source: AssistantSource };
	assistant_set_key: { key: string };
	assistant_ask: { source: AssistantSource; system: string; prompt: string };
	project_scan: { root: string };
	export_write: { directory: string; files: { path: string; contents: string }[] };
	reveal: { path: string };
}
