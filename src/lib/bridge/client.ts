import { invoke } from '@tauri-apps/api/core';
import { commands, type CommandArgs, type CommandName, type CommandResponse } from './contract';

function hasHost(): boolean {
	return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * The single door to the host. Every reply is parsed against the contract, so a host that drifts
 * fails here with the offending field rather than three components later with `undefined`.
 *
 * The stub behind it is a development affordance and nothing else: `npm run dev` opens the UI in a
 * plain browser, where iterating costs a hot reload instead of a Rust build. It is loaded through a
 * dynamic import behind `import.meta.env.DEV` so the bundler drops both the branch and the module
 * from a production build — a shipped desktop app has a real host by definition, and carrying a
 * fake one it can never reach is how a second code path starts drifting from the first.
 */
export async function call<T extends CommandName>(
	name: T,
	args: CommandArgs[T]
): Promise<CommandResponse<T>> {
	if (hasHost()) {
		const raw = await invoke(name, args as Record<string, unknown>);
		return commands[name].response.parse(raw) as CommandResponse<T>;
	}

	if (!import.meta.env.DEV) {
		throw new Error(`no host for ${name}: this build has to run inside the desktop app`);
	}

	const { mockHost } = await import('./mock');
	return commands[name].response.parse(mockHost(name, args)) as CommandResponse<T>;
}

/** True only in a development browser. In a build it folds to `false` and its callers fall away. */
export function isMockHost(): boolean {
	return import.meta.env.DEV && !hasHost();
}
