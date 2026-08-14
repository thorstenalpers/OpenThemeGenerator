<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import FolderIcon from '@lucide/svelte/icons/folder-open';
	import XIcon from '@lucide/svelte/icons/x';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Select } from '$lib/components/ui/select';
	import { call, isMockHost } from '$lib/bridge/client';
	import { i18n } from '$lib/i18n/index.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { viewState } from '$lib/stores/view-state.svelte';
	import {
		buildExport,
		FORMATS,
		formatById,
		type ExportOptions,
		type FormatId
	} from '$lib/theme/export';
	import type { Theme } from '$lib/theme/theme';

	interface Props {
		/** `null` keeps the dialog closed; a theme opens it. The caller owns the binding. */
		theme: Theme | null;
		onclose: () => void;
	}

	let { theme, onclose }: Props = $props();

	const t = $derived(i18n.t);

	// Format and options live in view-state, not here: closing the dialog on one theme and opening
	// it on another should not forget that the target project is on Tailwind v3.
	const formatId = $derived(viewState.export.formatId);
	const options = $derived<ExportOptions>({
		colorSpace: viewState.export.colorSpace,
		includeExtras: viewState.export.includeExtras,
		includeReadme: viewState.export.includeReadme
	});

	let copied = $state<string | null>(null);
	let written = $state<string | null>(null);
	let error = $state<string | null>(null);

	const format = $derived(formatById(formatId));
	const files = $derived(theme ? buildExport(formatId, theme, options) : []);
	const formatOptions = $derived(FORMATS.map((entry) => ({ value: entry.id, label: entry.label })));

	let dialog = $state<HTMLDialogElement | null>(null);

	// `showModal` is what makes it a dialog — focus trapped, backdrop, Escape — and it can only be
	// called from script, so the open state is mirrored into the element here.
	$effect(() => {
		if (!dialog) return;
		if (theme && !dialog.open) {
			written = null;
			error = null;
			dialog.showModal();
		} else if (!theme && dialog.open) {
			dialog.close();
		}
	});

	async function copy(path: string, contents: string): Promise<void> {
		await navigator.clipboard.writeText(contents);
		copied = path;
		setTimeout(() => (copied = null), 1500);
	}

	async function write(): Promise<void> {
		if (!theme) return;
		error = null;
		written = null;
		try {
			const { open } = await import('@tauri-apps/plugin-dialog');
			const directory = await open({
				directory: true,
				defaultPath: settings.exportDirectory ?? undefined
			});
			if (typeof directory !== 'string') return;

			const saved = await call('export_write', {
				directory,
				files: files.map((file) => ({ path: file.path, contents: file.contents }))
			});
			await settings.setExportDirectory(directory);
			written = t.exports.written(saved.length, directory);
		} catch (caught) {
			error = caught instanceof Error ? caught.message : String(caught);
		}
	}
</script>

<dialog
	bind:this={dialog}
	onclose={() => onclose()}
	class="m-auto w-[min(56rem,calc(100vw-2rem))] rounded-lg border bg-background p-0 text-foreground shadow-lg backdrop:bg-black/50"
>
	{#if theme}
		<div class="flex max-h-[85vh] flex-col">
			<header class="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
				<div class="flex min-w-0 flex-col">
					<h2 class="text-base font-semibold">{t.exports.title} — {theme.name}</h2>
					<p class="truncate text-xs text-muted-foreground">{t.exports.body}</p>
				</div>
				<Button size="icon" variant="ghost" onclick={() => onclose()} aria-label={t.common.close}>
					<XIcon class="size-4" />
				</Button>
			</header>

			<div class="flex shrink-0 flex-wrap items-end gap-x-5 gap-y-3 border-b px-4 py-3">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium">{t.exports.format}</span>
					<Select
						value={formatId}
						options={formatOptions}
						onchange={(event: Event) =>
							(viewState.export.formatId = (event.currentTarget as HTMLSelectElement)
								.value as FormatId)}
						class="w-52"
					/>
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium">{t.exports.colorSpace}</span>
					<Select
						value={options.colorSpace}
						options={[
							{ value: 'oklch', label: t.exports.oklch },
							{ value: 'hex', label: t.exports.hex }
						]}
						onchange={(event: Event) =>
							(viewState.export.colorSpace = (event.currentTarget as HTMLSelectElement).value as
								'oklch' | 'hex')}
						class="w-28"
					/>
				</label>

				<label class="flex max-w-xs cursor-pointer items-start gap-2">
					<input
						type="checkbox"
						class="mt-0.5 size-4"
						checked={options.includeExtras}
						onchange={(event) => (viewState.export.includeExtras = event.currentTarget.checked)}
					/>
					<span class="flex flex-col">
						<span class="text-xs font-medium">{t.exports.includeExtras}</span>
						<span class="text-[11px] text-muted-foreground">{t.exports.includeExtrasBody}</span>
					</span>
				</label>

				<label class="flex max-w-xs cursor-pointer items-start gap-2">
					<input
						type="checkbox"
						class="mt-0.5 size-4"
						checked={options.includeReadme}
						onchange={(event) => (viewState.export.includeReadme = event.currentTarget.checked)}
					/>
					<span class="flex flex-col">
						<span class="text-xs font-medium">{t.exports.includeReadme}</span>
						<span class="text-[11px] text-muted-foreground">{t.exports.includeReadmeBody}</span>
					</span>
				</label>

				<Button class="ms-auto" size="sm" onclick={write} disabled={isMockHost()}>
					<FolderIcon class="size-4" />
					{t.exports.writeTo}
				</Button>
			</div>

			<div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
				<div class="flex flex-col gap-1 rounded-md border bg-muted/40 p-3">
					<span class="text-xs font-semibold">{t.exports.usage}</span>
					<p class="text-xs leading-relaxed text-muted-foreground">{format.usage}</p>
				</div>

				{#if written}
					<p class="text-sm text-success">{written}</p>
				{/if}
				{#if error}
					<p class="text-sm text-destructive">{error}</p>
				{/if}

				{#each files as file (file.path)}
					<section class="overflow-hidden rounded-md border">
						<header
							class="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5"
						>
							<span class="font-mono text-xs">{file.path}</span>
							<div class="flex items-center gap-2">
								<Badge>{file.language}</Badge>
								<Button
									size="sm"
									variant="ghost"
									class="h-7 px-2"
									onclick={() => copy(file.path, file.contents)}
								>
									{#if copied === file.path}
										<CheckIcon class="size-3.5" />
										{t.common.copied}
									{:else}
										<CopyIcon class="size-3.5" />
										{t.common.copy}
									{/if}
								</Button>
							</div>
						</header>
						<pre class="max-h-80 overflow-auto p-3 text-[11px] leading-relaxed"><code
								>{file.contents}</code
							></pre>
					</section>
				{/each}
			</div>
		</div>
	{/if}
</dialog>
