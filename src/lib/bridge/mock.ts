import { PRESETS } from '$lib/theme/presets';
import type { CommandArgs, CommandName } from './contract';

/**
 * What the browser answers when there is no Tauri host.
 *
 * `npm run dev` in a plain browser is the fastest way to work on the UI, and every view here is
 * reachable without a host — except the ones that write files, which say so rather than pretending.
 */
export function mockHost<T extends CommandName>(name: T, args: CommandArgs[T]): unknown {
	switch (name) {
		case 'get_settings':
		case 'set_settings':
			return { source: 'cli', exportDirectory: null };
		case 'assistant_status':
			return {
				source: (args as CommandArgs['assistant_status']).source,
				cliAvailable: false,
				hasKey: false
			};
		case 'assistant_set_key':
		case 'reveal':
			return null;
		case 'assistant_ask': {
			const sample = PRESETS[4] ?? PRESETS[0];
			return `Here is a theme without a host to ask.\n\n\`\`\`json\n${JSON.stringify(
				{ ...sample, id: 'mock-theme', name: 'Mock theme' },
				null,
				2
			)}\n\`\`\``;
		}
		case 'project_scan':
			return {
				root: (args as CommandArgs['project_scan']).root,
				files: [
					{
						path: 'src/app.css',
						bytes: 0,
						excerpt: '/* no host to read files with */',
						truncated: false
					}
				],
				stack: 'mock host — nothing was read from disk'
			};
		case 'export_write':
			throw new Error('writing files needs the desktop app; in the browser, copy the file instead');
		default:
			throw new Error(`no mock for ${name}`);
	}
}
