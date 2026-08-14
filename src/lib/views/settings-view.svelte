<script lang="ts">
	import { setMode, userPrefersMode } from 'mode-watcher';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Select } from '$lib/components/ui/select';
	import { call } from '$lib/bridge/client';
	import type { AssistantSource, AssistantStatus } from '$lib/bridge/contract';
	import { i18n, isLocale, LOCALES } from '$lib/i18n/index.svelte';
	import { settings } from '$lib/stores/settings.svelte';

	const t = $derived(i18n.t);

	const ROW = 'flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5';

	const modes = $derived([
		{ id: 'system', label: t.common.system },
		{ id: 'light', label: t.common.light },
		{ id: 'dark', label: t.common.dark }
	] as const);

	const sources = $derived([
		{
			id: 'cli' as AssistantSource,
			label: t.settings.sourceCliLabel,
			detail: t.settings.sourceCliDetail
		},
		{
			id: 'anthropic' as AssistantSource,
			label: t.settings.sourceAnthropicLabel,
			detail: t.settings.sourceAnthropicDetail
		}
	]);

	const localeOptions = LOCALES.map((locale) => ({ value: locale.id, label: locale.label }));

	let status = $state<AssistantStatus | null>(null);
	let key = $state('');
	let notice = $state<string | null>(null);
	let error = $state<string | null>(null);

	$effect(() => {
		const source = settings.source;
		call('assistant_status', { source })
			.then((result) => (status = result))
			.catch(() => (status = null));
	});

	async function storeKey(): Promise<void> {
		error = null;
		notice = null;
		try {
			await call('assistant_set_key', { key });
			// Cleared immediately: the field is a one-way door, and the key cannot be read back.
			key = '';
			notice = t.settings.stored;
			status = await call('assistant_status', { source: settings.source });
		} catch (caught) {
			error = caught instanceof Error ? caught.message : String(caught);
		}
	}
</script>

{#snippet describe(title: string, detail: string)}
	<span class="flex min-w-0 flex-1 flex-col">
		<span class="text-sm font-medium">{title}</span>
		<span class="text-xs text-muted-foreground">{detail}</span>
	</span>
{/snippet}

<div class="flex max-w-2xl flex-col gap-3 p-4 sm:p-6">
	<h1 class="text-xl font-semibold">{t.settings.title}</h1>

	<!-- One row per setting rather than one card per setting: bordered boxes around single controls
	     are mostly chrome, and the row labels say everything the headers did. -->
	<Card>
		<CardContent class="flex flex-col divide-y p-0">
			<div class={ROW}>
				{@render describe(t.settings.appearance, t.settings.appearanceBody)}
				<div class="flex flex-wrap gap-1.5">
					{#each modes as mode (mode.id)}
						<Button
							size="sm"
							variant={userPrefersMode.current === mode.id ? 'default' : 'outline'}
							onclick={() => setMode(mode.id)}
						>
							{mode.label}
						</Button>
					{/each}
				</div>
			</div>

			<div class={ROW}>
				{@render describe(t.settings.language, t.settings.languageBody)}
				<Select
					value={settings.locale}
					options={localeOptions}
					onchange={(event: Event) => {
						const next = (event.currentTarget as HTMLSelectElement).value;
						if (isLocale(next)) settings.setLocale(next);
					}}
					aria-label={t.settings.language}
					class="w-44"
				/>
			</div>

			<label class="{ROW} cursor-pointer select-none">
				{@render describe(t.settings.applyToApp, t.settings.applyToAppBody)}
				<input
					type="checkbox"
					class="size-4"
					checked={settings.applyToApp}
					onchange={(event) => settings.setApplyToApp(event.currentTarget.checked)}
				/>
			</label>

			<label class="{ROW} cursor-pointer select-none">
				{@render describe(t.settings.tabClose, t.settings.tabCloseBody)}
				<input
					type="checkbox"
					class="size-4"
					checked={settings.tabClose}
					onchange={(event) => settings.setTabClose(event.currentTarget.checked)}
				/>
			</label>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>{t.settings.assistant}</CardTitle>
			<CardDescription>{t.settings.assistantBody}</CardDescription>
		</CardHeader>
		<CardContent class="flex flex-col gap-3">
			<div class="flex flex-col gap-1.5">
				{#each sources as source (source.id)}
					<button
						type="button"
						onclick={() => settings.setSource(source.id)}
						class="flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-start text-sm transition-colors {settings.source ===
						source.id
							? 'border-primary bg-primary/5'
							: 'hover:bg-muted/50'}"
					>
						<span class="flex items-center gap-2 font-medium">
							{source.label}
							{#if source.id === 'cli' && status?.cliAvailable}
								<Badge variant="accent">{t.settings.found}</Badge>
							{:else if source.id === 'anthropic' && status?.hasKey}
								<Badge variant="accent">{t.settings.keyStored}</Badge>
							{/if}
						</span>
						<span class="text-xs text-muted-foreground">{source.detail}</span>
					</button>
				{/each}
			</div>

			{#if settings.source === 'anthropic'}
				<div class="flex items-end gap-2">
					<label class="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
						{t.settings.apiKey}
						<Input type="password" bind:value={key} placeholder="sk-ant-…" />
					</label>
					<Button onclick={storeKey} disabled={!key.trim()}>{t.settings.store}</Button>
				</div>
				<p class="text-xs text-muted-foreground">{t.settings.keyNote}</p>
			{/if}

			{#if notice}
				<p class="text-sm text-muted-foreground">{notice}</p>
			{/if}
			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}
		</CardContent>
	</Card>
</div>
