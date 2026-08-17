<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ColumnsIcon from '@lucide/svelte/icons/columns-2';
	import FileCodeIcon from '@lucide/svelte/icons/file-code';
	import ListIcon from '@lucide/svelte/icons/list';
	import RectangleIcon from '@lucide/svelte/icons/rectangle-horizontal';
	import ExportDialog from '$lib/components/export-dialog.svelte';
	import ThemePreview from '$lib/components/theme-preview.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { i18n } from '$lib/i18n/index.svelte';
	import { viewState } from '$lib/stores/view-state.svelte';
	import { workshop } from '$lib/stores/workshop.svelte';
	import { ADDED_AT, GENERATED_PRESETS, PRESETS, TEMPLATE_PRESETS } from '$lib/theme/presets';
	import { SIDEBAR_SPECS } from '$lib/theme/sidebar';
	import { lowContrastPairs, readabilityScore, type Theme } from '$lib/theme/theme';

	const t = $derived(i18n.t);

	let exporting = $state<Theme | null>(null);

	const madeHere = new Set(GENERATED_PRESETS.map((preset) => preset.id));
	const templates = new Set(TEMPLATE_PRESETS.map((preset) => preset.id));

	/** Precomputed once: the score walks every token pair, and re-running it per sort is wasteful. */
	const scores = new Map(PRESETS.map((preset) => [preset.id, readabilityScore(preset)]));
	const order = new Map(PRESETS.map((preset, index) => [preset.id, index]));

	/** Ninety-odd themes is two hundred scaled previews; the list grows on request. */
	const PAGE = 12;

	const tags = [...new Set(PRESETS.flatMap((preset) => preset.tags))].sort();

	const sourceOf = (theme: Theme) =>
		madeHere.has(theme.id)
			? t.gallery.generated
			: templates.has(theme.id)
				? t.gallery.templates
				: t.gallery.registry;

	function compare(a: Theme, b: Theme, key: string): number {
		switch (key) {
			case 'name':
				return a.name.localeCompare(b.name);
			case 'added':
				return (ADDED_AT.get(b.id) ?? '').localeCompare(ADDED_AT.get(a.id) ?? '');
			default:
				return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
		}
	}

	const filtered = $derived(
		PRESETS.filter((preset) => {
			const source = viewState.gallery.source;
			if (source === 'generated' && !madeHere.has(preset.id)) return false;
			if (source === 'templates' && !templates.has(preset.id)) return false;
			if (source === 'registry' && (madeHere.has(preset.id) || templates.has(preset.id)))
				return false;

			const tag = viewState.gallery.tag;
			if (tag && !preset.tags.includes(tag)) return false;

			const search = viewState.gallery.search.trim().toLowerCase();
			return !search || preset.name.toLowerCase().includes(search);
		})
	);

	/**
	 * Sorted, with the theme in the studio pinned to the front.
	 *
	 * Finding the one you are working on in ninety-four cards is the thing a gallery this size
	 * makes hard, so it never has to be found — whatever the sort says, it is the first row.
	 */
	const shown = $derived.by(() => {
		const sorted = [...filtered].sort((a, b) => {
			for (const { key, desc } of viewState.gallery.sort) {
				const result = compare(a, b, key) * (desc ? -1 : 1);
				if (result !== 0) return result;
			}
			return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
		});

		const current = sorted.findIndex((preset) => preset.id === workshop.id);
		if (current <= 0) return sorted;
		return [sorted[current] as Theme, ...sorted.filter((_, index) => index !== current)];
	});

	const visible = $derived(shown.slice(0, viewState.gallery.page * PAGE));

	$effect(() => {
		void viewState.gallery.source;
		void viewState.gallery.tag;
		void viewState.gallery.search;
		viewState.gallery.page = 1;
	});

	const sources = $derived([
		{ id: 'all' as const, label: t.gallery.all },
		{ id: 'generated' as const, label: t.gallery.generated },
		{ id: 'templates' as const, label: t.gallery.templates },
		{ id: 'registry' as const, label: t.gallery.registry }
	]);

	const layouts = $derived([
		{ id: 'grid' as const, icon: ColumnsIcon, label: t.gallery.layoutGrid },
		{ id: 'single' as const, icon: RectangleIcon, label: t.gallery.layoutSingle },
		{ id: 'list' as const, icon: ListIcon, label: t.gallery.layoutList }
	]);

	const modes = $derived([
		{ id: 'light' as const, label: t.common.light },
		{ id: 'dark' as const, label: t.common.dark }
	]);

	const shownModes = $derived(modes.filter((mode) => viewState.gallery.modes[mode.id]));

	/**
	 * Turning one off gives the other the whole card. Turning the last one off would leave a row of
	 * names with nothing to look at, so it takes the other one's place instead.
	 */
	function toggleMode(id: 'light' | 'dark'): void {
		const other = id === 'light' ? 'dark' : 'light';
		const next = !viewState.gallery.modes[id];

		viewState.gallery.modes = {
			...viewState.gallery.modes,
			[id]: next,
			...(next ? {} : { [other]: true })
		};
	}

	/** The two orders that mean something to someone looking for a theme. Sidebar and readability
	 *  were columns you could sort by and never a reason to. */
	const columns = $derived([
		{ key: 'name' as const, label: t.gallery.columnName },
		{ key: 'added' as const, label: t.gallery.columnAdded }
	]);

	/**
	 * Click to sort by a column; shift-click to keep the previous one as the tie-breaker. Clicking
	 * the current primary column flips it rather than re-adding it.
	 */
	function sortBy(key: (typeof viewState.gallery.sort)[number]['key'], additive: boolean): void {
		const existing = viewState.gallery.sort;
		const primary = existing[0];

		if (primary?.key === key && !additive) {
			viewState.gallery.sort = [{ key, desc: !primary.desc }];
			return;
		}
		viewState.gallery.sort = additive
			? [{ key, desc: false }, ...existing.filter((entry) => entry.key !== key)].slice(0, 3)
			: [{ key, desc: false }];
	}

	function sortState(key: string) {
		const index = viewState.gallery.sort.findIndex((entry) => entry.key === key);
		return index === -1 ? null : { ...viewState.gallery.sort[index], rank: index + 1 };
	}

	async function open(id: string): Promise<void> {
		workshop.loadPreset(id);
		await goto(resolve('/studio'));
	}
</script>

{#snippet sortable(key: 'name' | 'added')}
	{@const column = columns.find((candidate) => candidate.key === key)}
	{@const state = sortState(key)}
	<th class="px-3 py-2 text-start font-medium">
		<button
			type="button"
			onclick={(event: MouseEvent) => sortBy(key, event.shiftKey)}
			class="inline-flex cursor-pointer items-center gap-1 hover:text-foreground {state
				? 'text-foreground'
				: 'text-muted-foreground'}"
		>
			{column?.label}
			{#if state}
				{#if state.desc}
					<ArrowDownIcon class="size-3.5" />
				{:else}
					<ArrowUpIcon class="size-3.5" />
				{/if}
				{#if viewState.gallery.sort.length > 1}
					<span class="text-[10px] tabular-nums">{state.rank}</span>
				{/if}
			{/if}
		</button>
	</th>
{/snippet}

{#snippet meta(preset: Theme)}
	{@const failing = lowContrastPairs(preset)}
	<div class="flex items-center gap-2">
		<h2 class="text-sm font-semibold">{preset.name}</h2>
		<Badge>{SIDEBAR_SPECS[preset.layout.sidebarStyle].label}</Badge>
		{#if failing.length > 0}
			<Badge variant="destructive">{t.gallery.belowAA(failing.length)}</Badge>
		{/if}
		{#if workshop.id === preset.id}
			<Badge variant="accent">
				<CheckIcon class="size-3" />
				{t.gallery.current}
			</Badge>
		{/if}
	</div>
	<p class="text-xs leading-relaxed text-muted-foreground">{preset.description}</p>
{/snippet}

{#snippet actions(preset: Theme)}
	<div class="flex items-center gap-1.5">
		<Button size="sm" variant="ghost" onclick={() => (exporting = preset)}>
			<FileCodeIcon class="size-4" />
			{t.studio.exportTheme}
		</Button>
		<Button size="sm" variant="outline" onclick={() => open(preset.id)}>{t.gallery.open}</Button>
	</div>
{/snippet}

<div class="flex flex-col gap-4 p-4 sm:p-6">
	<header class="flex flex-col gap-1">
		<h1 class="text-xl font-semibold">{t.gallery.title}</h1>
		<p class="max-w-2xl text-sm text-muted-foreground">{t.gallery.body}</p>
	</header>

	<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
		<div class="flex items-center gap-1.5">
			{#each sources as source (source.id)}
				<Button
					size="sm"
					variant={viewState.gallery.source === source.id ? 'default' : 'outline'}
					onclick={() => (viewState.gallery.source = source.id)}
				>
					{source.label}
				</Button>
			{/each}
		</div>

		<div class="flex items-center gap-1">
			{#each layouts as layout (layout.id)}
				{@const Icon = layout.icon}
				<Button
					size="icon"
					variant={viewState.gallery.layout === layout.id ? 'default' : 'outline'}
					onclick={() => (viewState.gallery.layout = layout.id)}
					title={layout.label}
					aria-label={layout.label}
				>
					<Icon class="size-4" />
				</Button>
			{/each}
		</div>

		<div class="flex items-center gap-3">
			{#each modes as mode (mode.id)}
				<label class="flex cursor-pointer items-center gap-1.5 text-xs select-none">
					<input
						type="checkbox"
						class="size-3.5"
						checked={viewState.gallery.modes[mode.id]}
						onchange={() => toggleMode(mode.id)}
					/>
					{mode.label}
				</label>
			{/each}
		</div>

		<div class="flex flex-wrap items-center gap-1">
			{#each tags as tag (tag)}
				<button
					type="button"
					onclick={() => (viewState.gallery.tag = viewState.gallery.tag === tag ? null : tag)}
					class="rounded-md border px-1.5 py-0.5 text-[11px] transition-colors {viewState.gallery
						.tag === tag
						? 'border-primary bg-primary/10 text-primary'
						: 'text-muted-foreground hover:bg-muted'}"
				>
					{tag}
				</button>
			{/each}
		</div>

		<Input
			value={viewState.gallery.search}
			oninput={(event: Event) =>
				(viewState.gallery.search = (event.currentTarget as HTMLInputElement).value)}
			placeholder={t.gallery.search}
			class="ms-auto w-44"
		/>
		<span class="text-xs text-muted-foreground">
			{t.gallery.counted(shown.length, PRESETS.length)}
		</span>
	</div>

	{#if viewState.gallery.layout !== 'list'}
		<div class="flex flex-wrap items-center gap-1.5">
			<span class="text-xs text-muted-foreground">{t.gallery.sortedBy}</span>
			{#each columns as column (column.key)}
				{@const state = sortState(column.key)}
				<Button
					size="sm"
					variant={state ? 'default' : 'outline'}
					onclick={(event: MouseEvent) => sortBy(column.key, event.shiftKey)}
				>
					{column.label}
					{#if state}
						{#if state.desc}
							<ArrowDownIcon class="size-3.5" />
						{:else}
							<ArrowUpIcon class="size-3.5" />
						{/if}
					{/if}
				</Button>
			{/each}
			<Button
				size="sm"
				variant={viewState.gallery.sort[0]?.key === 'curated' ? 'default' : 'outline'}
				onclick={() => (viewState.gallery.sort = [{ key: 'curated', desc: false }])}
			>
				{t.gallery.columnCurated}
			</Button>
		</div>
	{/if}

	{#if shown.length === 0}
		<p class="py-8 text-center text-sm text-muted-foreground">{t.gallery.empty}</p>
	{/if}

	{#if viewState.gallery.layout === 'list'}
		<div class="overflow-hidden rounded-lg border">
			<table class="w-full text-sm">
				<thead>
					<!-- Sidebar and readability stay as columns and stop being sort keys: worth reading off a
					     row, never worth ordering a hundred themes by. -->
					<tr class="border-b bg-muted/40">
						{@render sortable('name')}
						<th class="px-3 py-2 text-start font-medium text-muted-foreground">
							{t.gallery.columnSidebar}
						</th>
						<th class="px-3 py-2 text-start font-medium text-muted-foreground">
							{t.gallery.columnReadability}
						</th>
						{@render sortable('added')}
						<th class="px-3 py-2 text-end font-medium text-muted-foreground">
							{t.gallery.columnSource}
						</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each visible as preset (preset.id)}
						<tr class="border-b last:border-0 hover:bg-muted/40">
							<td class="px-3 py-2">
								<div class="flex items-center gap-2">
									<span class="font-medium">{preset.name}</span>
									{#if workshop.id === preset.id}
										<Badge variant="accent">
											<CheckIcon class="size-3" />
											{t.gallery.current}
										</Badge>
									{/if}
								</div>
								<span class="text-xs text-muted-foreground">{preset.description}</span>
							</td>
							<td class="px-3 py-2 text-muted-foreground">
								{SIDEBAR_SPECS[preset.layout.sidebarStyle].label}
							</td>
							<td class="px-3 py-2 tabular-nums">
								{#if lowContrastPairs(preset).length > 0}
									<span class="text-destructive">{scores.get(preset.id)}</span>
								{:else}
									{scores.get(preset.id)}
								{/if}
							</td>
							<td class="px-3 py-2 text-muted-foreground tabular-nums">{ADDED_AT.get(preset.id)}</td
							>
							<td class="px-3 py-2 text-end text-muted-foreground">{sourceOf(preset)}</td>
							<td class="px-3 py-2 text-end">{@render actions(preset)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div
			class={viewState.gallery.layout === 'grid'
				? 'grid gap-4 xl:grid-cols-2'
				: 'flex w-full flex-col gap-4'}
		>
			{#each visible as preset (preset.id)}
				<!-- A landing template is shown as a landing page. Judging one from a screenshot of a
				     sidebar is what would make the whole category pointless. -->
				{@const surface = preset.tags.includes('landing') ? 'landing' : 'app'}
				<article class="flex flex-col gap-3 rounded-lg border bg-card p-3 text-card-foreground">
					<div class="grid gap-2" class:sm:grid-cols-2={shownModes.length === 2}>
						{#each shownModes as mode (mode.id)}
							<ThemePreview theme={preset} mode={mode.id} {surface} />
						{/each}
					</div>

					<div class="flex flex-col gap-1">{@render meta(preset)}</div>

					<div class="mt-auto flex items-center justify-between gap-2">
						<div class="flex flex-wrap gap-1">
							{#each preset.tags as tag (tag)}
								<Badge>{tag}</Badge>
							{/each}
						</div>
						{@render actions(preset)}
					</div>
				</article>
			{/each}
		</div>
	{/if}

	{#if visible.length < shown.length}
		<Button variant="outline" class="self-center" onclick={() => (viewState.gallery.page += 1)}>
			{t.gallery.more(shown.length - visible.length)}
		</Button>
	{/if}
</div>

<ExportDialog theme={exporting} onclose={() => (exporting = null)} />
