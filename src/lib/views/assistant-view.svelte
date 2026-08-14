<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import FolderIcon from '@lucide/svelte/icons/folder-search';
	import SendIcon from '@lucide/svelte/icons/send-horizontal';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import XIcon from '@lucide/svelte/icons/x';
	import ThemePreview from '$lib/components/theme-preview.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { isMockHost } from '$lib/bridge/client';
	import { i18n } from '$lib/i18n/index.svelte';
	import { chat } from '$lib/stores/chat.svelte';
	import { viewState } from '$lib/stores/view-state.svelte';
	import { workshop } from '$lib/stores/workshop.svelte';
	import type { Theme } from '$lib/theme/theme';

	const t = $derived(i18n.t);

	async function send(): Promise<void> {
		const text = viewState.chatDraft;
		viewState.chatDraft = '';
		await chat.send(text);
	}

	async function attach(): Promise<void> {
		const { open } = await import('@tauri-apps/plugin-dialog');
		const root = await open({ directory: true });
		if (typeof root === 'string') await chat.attach(root);
	}

	async function apply(theme: Theme): Promise<void> {
		workshop.loadTheme(theme);
		await goto(resolve('/studio'));
	}

	// Enter sends, Shift+Enter breaks the line: the field is a prompt, not a document.
	function onkeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			void send();
		}
	}
</script>

<div class="flex h-full flex-col gap-3 p-4 sm:p-6">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div class="flex flex-col gap-1">
			<h1 class="text-xl font-semibold">{t.chat.title}</h1>
			<p class="max-w-2xl text-sm text-muted-foreground">{t.chat.body}</p>
		</div>
		<div class="flex items-center gap-2">
			{#if chat.messages.length > 0}
				<Button size="sm" variant="ghost" onclick={() => chat.clear()}>
					<TrashIcon class="size-4" />
					{t.chat.clear}
				</Button>
			{/if}
			<Button size="sm" variant="outline" onclick={attach} disabled={isMockHost()}>
				<FolderIcon class="size-4" />
				{t.chat.attach}
			</Button>
		</div>
	</header>

	{#if chat.context}
		<div class="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
			<span class="font-mono text-xs">{chat.context.root}</span>
			<Badge variant="accent">{t.chat.attached(chat.context.files.length)}</Badge>
			<span class="min-w-0 flex-1 truncate text-xs text-muted-foreground">
				{chat.context.stack}
			</span>
			<Button size="sm" variant="ghost" class="h-7 px-2" onclick={() => chat.detach()}>
				<XIcon class="size-3.5" />
				{t.chat.detach}
			</Button>
		</div>
	{:else}
		<p class="text-xs text-muted-foreground">{t.chat.attachBody}</p>
	{/if}

	<div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
		{#each chat.messages as message, index (index)}
			<article
				class="flex flex-col gap-2 rounded-md border p-3 {message.role === 'user'
					? 'bg-muted/40'
					: 'bg-card'}"
			>
				<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
					{message.role === 'user' ? t.chat.you : t.chat.assistant}
				</span>
				<p class="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>

				{#if message.theme}
					<div class="grid gap-2 sm:grid-cols-2">
						<ThemePreview theme={message.theme} mode="light" />
						<ThemePreview theme={message.theme} mode="dark" />
					</div>
					<Button size="sm" class="self-start" onclick={() => apply(message.theme as Theme)}>
						{t.chat.apply}
					</Button>
				{:else if message.role === 'assistant'}
					<p class="text-xs text-muted-foreground">
						{message.problem ?? t.chat.noTheme}
					</p>
				{/if}
			</article>
		{/each}

		{#if chat.pending}
			<p class="text-sm text-muted-foreground">{t.chat.thinking}</p>
		{/if}
		{#if chat.error}
			<p class="text-sm text-destructive">{chat.error}</p>
		{/if}
	</div>

	<div class="flex flex-col gap-1.5">
		<div class="flex items-end gap-2">
			<Textarea
				bind:value={viewState.chatDraft}
				{onkeydown}
				placeholder={t.chat.placeholder}
				rows={2}
				class="min-h-16"
			/>
			<Button onclick={send} disabled={chat.pending || viewState.chatDraft.trim() === ''}>
				<SendIcon class="size-4" />
				{t.chat.send}
			</Button>
		</div>
		<p class="text-[11px] text-muted-foreground">{t.chat.basedOn}</p>
	</div>
</div>
