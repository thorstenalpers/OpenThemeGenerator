<script lang="ts">
	import DicesIcon from '@lucide/svelte/icons/dices';
	import FileCodeIcon from '@lucide/svelte/icons/file-code';
	import InfoIcon from '@lucide/svelte/icons/info';
	import RotateIcon from '@lucide/svelte/icons/rotate-ccw';
	import SaveIcon from '@lucide/svelte/icons/bookmark-plus';
	import ChevronIcon from '@lucide/svelte/icons/chevron-down';
	import XIcon from '@lucide/svelte/icons/x';
	import ColorSpace from '$lib/components/color-space.svelte';
	import ExportDialog from '$lib/components/export-dialog.svelte';
	import ThemePreview from '$lib/components/theme-preview.svelte';
	import TokenGrid from '$lib/components/token-grid.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Select } from '$lib/components/ui/select';
	import { i18n } from '$lib/i18n/index.svelte';
	import { library } from '$lib/stores/library.svelte';
	import { viewState } from '$lib/stores/view-state.svelte';
	import { workshop } from '$lib/stores/workshop.svelte';
	import { hexToOklch, formatOklch, oklchToHex, parseOklch } from '$lib/theme/color';
	import {
		CONTRASTS,
		HARMONIES,
		SIDEBAR_TONES,
		type Contrast,
		type Harmony,
		type SidebarTone
	} from '$lib/theme/generate';
	import { describeChanges } from '$lib/theme/changes';
	import { DENSITIES, ELEVATIONS, type Density, type Elevation } from '$lib/theme/layout';
	import {
		ICON_COLOR_MODES,
		SIDEBAR_SPECS,
		SIDEBAR_STYLES,
		type IconColorMode,
		type SidebarStyle
	} from '$lib/theme/sidebar';
	import type { Theme } from '$lib/theme/theme';

	const t = $derived(i18n.t);

	const surfaces = $derived([
		{ id: 'app' as const, label: t.studio.surfaceApp },
		{ id: 'landing' as const, label: t.studio.surfaceLanding },
		{ id: 'space' as const, label: t.studio.surfaceSpace }
	]);

	let exporting = $state<Theme | null>(null);
	let collapsed = $state(false);
	let showChanges = $state(false);
	let changesDialog = $state<HTMLDialogElement | null>(null);

	const changes = $derived(
		describeChanges(
			{
				recipe: workshop.recipe,
				layout: workshop.layout,
				overrides: workshop.active?.overrides ?? { light: {}, dark: {} }
			},
			workshop.origin
		)
	);

	// The state as it stands, not how it got there: an edit log would grow with every slider drag
	// and answer a question nobody asked. This is what to paste back if the theme is rebuilt.
	const changesJson = $derived(
		JSON.stringify(
			{
				name: workshop.name,
				basedOn: workshop.origin?.name ?? null,
				changes: changes.map(({ kind, scope, label, from, to }) => ({
					kind,
					...(scope ? { mode: scope } : {}),
					token: label,
					from,
					to
				}))
			},
			null,
			2
		)
	);

	$effect(() => {
		if (!changesDialog) return;
		if (showChanges && !changesDialog.open) changesDialog.showModal();
		else if (!showChanges && changesDialog.open) changesDialog.close();
	});

	const seedHex = $derived(
		oklchToHex(
			parseOklch(workshop.recipe.seed) ??
				hexToOklch(workshop.recipe.seed) ?? {
					l: 0.5,
					c: 0,
					h: 0,
					alpha: 1
				}
		)
	);

	const harmonyOptions = $derived(
		HARMONIES.map((harmony) => ({ value: harmony, label: t.studio.harmonies[harmony] }))
	);
	const contrastOptions = $derived(
		CONTRASTS.map((contrast) => ({ value: contrast, label: t.studio.contrasts[contrast] }))
	);
	const toneOptions = $derived(
		SIDEBAR_TONES.map((tone) => ({ value: tone, label: t.studio.sidebarTones[tone] }))
	);
	const densityOptions = $derived(
		DENSITIES.map((density) => ({ value: density, label: t.studio.densities[density] }))
	);
	const elevationOptions = $derived(
		ELEVATIONS.map((elevation) => ({ value: elevation, label: t.studio.elevations[elevation] }))
	);
	// The style names are product names — shadcn, Vercel, Windows 11 — so they are not translated.
	const sidebarStyleOptions = SIDEBAR_STYLES.map((style) => ({
		value: style,
		label: SIDEBAR_SPECS[style].label
	}));
	const iconColorOptions = $derived(
		ICON_COLOR_MODES.map((option) => ({ value: option, label: t.studio.iconColors[option] }))
	);

	let saved = $state(false);
	let savedTimer: ReturnType<typeof setTimeout> | undefined;

	/** Into the gallery under the tab's own name, replacing the entry already there. */
	function saveToGallery(): void {
		// An edited built-in becomes its own entry rather than a second card claiming the same id.
		workshop.adoptId(library.freeId(workshop.id));
		library.save(workshop.toDraft(), new Date().toISOString().slice(0, 10));
		saved = true;
		clearTimeout(savedTimer);
		savedTimer = setTimeout(() => (saved = false), 1600);
	}

	function randomise(): void {
		const hue = Math.floor(Math.random() * 360);
		workshop.setRecipe({
			seed: formatOklch({ l: 0.55, c: 0.16, h: hue, alpha: 1 }),
			neutralHue: hue
		});
	}
</script>

{#snippet slider(
	label: string,
	value: number,
	min: number,
	max: number,
	step: number,
	onchange: (next: number) => void,
	display: string
)}
	<label class="flex flex-col gap-1">
		<span class="flex items-baseline justify-between text-xs">
			<span class="font-medium">{label}</span>
			<span class="font-mono text-[11px] text-muted-foreground">{display}</span>
		</span>
		<input
			type="range"
			{min}
			{max}
			{step}
			{value}
			oninput={(event) => onchange(Number(event.currentTarget.value))}
			class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
		/>
	</label>
{/snippet}

{#snippet choice(
	label: string,
	value: string,
	options: { value: string; label: string }[],
	onchange: (next: string) => void
)}
	<label class="flex flex-col gap-1">
		<span class="text-xs font-medium">{label}</span>
		<Select
			{value}
			{options}
			onchange={(event: Event) => onchange((event.currentTarget as HTMLSelectElement).value)}
		/>
	</label>
{/snippet}

<div class="flex flex-col gap-4 p-4 sm:p-6">
	<!-- Browser-shaped: square-ish tops, a shared baseline, and the active tab joined to the panel
	     below it by a border the tab paints over. -->
	<div class="-mb-px flex flex-wrap items-end gap-0.5 border-b">
		{#each workshop.tabs as tab (tab.id)}
			{@const current = workshop.id === tab.id}
			<div
				class="group flex h-9 min-w-[10ch] items-center gap-1.5 rounded-t-md border border-b-0 px-3 text-sm transition-colors {current
					? 'border-border bg-background font-medium text-foreground'
					: 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'}"
			>
				<button
					type="button"
					class="min-w-0 flex-1 cursor-pointer truncate text-start"
					onclick={() => workshop.activate(tab.id)}
				>
					{tab.name}
				</button>
				{#if workshop.tabs.length > 1}
					<button
						type="button"
						onclick={() => workshop.close(tab.id)}
						aria-label="{t.studio.closeTab} — {tab.name}"
						class="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-70 hover:bg-muted hover:opacity-100"
					>
						<XIcon class="size-3.5" />
					</button>
				{/if}
			</div>
		{/each}
	</div>

	<header class="flex flex-wrap items-end justify-between gap-3">
		<div class="flex flex-col gap-1">
			<h1 class="flex flex-wrap items-baseline gap-2 text-xl font-semibold">
				{t.studio.title} — {workshop.name}
				{#if workshop.origin && workshop.origin.name !== workshop.name}
					<span class="text-xs font-normal text-muted-foreground">
						{t.studio.basedOn(workshop.origin.name)}
					</span>
				{/if}
			</h1>
			<p class="max-w-2xl text-sm text-muted-foreground">{t.studio.body}</p>
		</div>
		<div class="flex items-center gap-2">
			{#if workshop.editedCount > 0}
				<Badge variant="accent">{t.studio.edited} · {workshop.editedCount}</Badge>
			{/if}
			<Button size="sm" variant="outline" onclick={() => workshop.reset()}>
				<RotateIcon class="size-4" />
				{t.studio.reset}
			</Button>
			<Button size="sm" variant="outline" onclick={saveToGallery}>
				<SaveIcon class="size-4" />
				{saved ? t.studio.saved : library.has(workshop.id) ? t.studio.update : t.studio.save}
			</Button>
			<Button
				size="icon"
				variant="outline"
				onclick={() => (showChanges = true)}
				title={t.studio.changes}
				aria-label={t.studio.changes}
			>
				<InfoIcon class="size-4" />
			</Button>
			<Button size="sm" onclick={() => (exporting = workshop.theme)}>
				<FileCodeIcon class="size-4" />
				{t.studio.exportTheme}
			</Button>
		</div>
	</header>

	<div class="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
		<div class="flex flex-col gap-4">
			<Card>
				<CardContent class="flex flex-col gap-3.5 p-3">
					<button
						type="button"
						onclick={() => (viewState.panels.colour = !viewState.panels.colour)}
						aria-expanded={viewState.panels.colour}
						class="flex cursor-pointer items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase hover:text-foreground"
					>
						<ChevronIcon
							class="size-3.5 transition-transform {viewState.panels.colour ? '' : '-rotate-90'}"
						/>
						{t.studio.colour}
					</button>

					{#if viewState.panels.colour}
						<label class="flex flex-col gap-1">
							<span class="text-xs font-medium">{t.studio.name}</span>
							<Input
								value={workshop.name}
								onchange={(event: Event) =>
									workshop.rename((event.currentTarget as HTMLInputElement).value)}
							/>
							<span class="font-mono text-[11px] text-muted-foreground">{workshop.id}</span>
						</label>

						<div class="flex flex-col gap-1">
							<span class="text-xs font-medium">{t.studio.seed}</span>
							<div class="flex items-center gap-2">
								<label
									class="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border"
								>
									<span class="absolute inset-0" style="background: {seedHex}"></span>
									<input
										type="color"
										value={seedHex}
										oninput={(event) => workshop.setRecipe({ seed: event.currentTarget.value })}
										aria-label={t.studio.seed}
										class="absolute inset-0 cursor-pointer opacity-0"
									/>
								</label>
								<Input
									value={workshop.recipe.seed}
									onchange={(event: Event) =>
										workshop.setRecipe({ seed: (event.currentTarget as HTMLInputElement).value })}
									spellcheck="false"
									class="font-mono text-xs"
								/>
								<Button
									size="icon"
									variant="outline"
									onclick={randomise}
									title={t.studio.randomise}
								>
									<DicesIcon class="size-4" />
								</Button>
							</div>
						</div>

						{@render choice(t.studio.harmony, workshop.recipe.harmony, harmonyOptions, (next) =>
							workshop.setRecipe({ harmony: next as Harmony })
						)}
						{@render choice(t.studio.contrast, workshop.recipe.contrast, contrastOptions, (next) =>
							workshop.setRecipe({ contrast: next as Contrast })
						)}
						{@render choice(
							t.studio.sidebarTone,
							workshop.recipe.sidebarTone,
							toneOptions,
							(next) => workshop.setRecipe({ sidebarTone: next as SidebarTone })
						)}

						{@render slider(
							t.studio.neutralChroma,
							workshop.recipe.neutralChroma,
							0,
							0.03,
							0.001,
							(next) => workshop.setRecipe({ neutralChroma: next }),
							workshop.recipe.neutralChroma.toFixed(3)
						)}
						{@render slider(
							t.studio.accentTint,
							workshop.recipe.accentTint,
							0,
							1,
							0.05,
							(next) => workshop.setRecipe({ accentTint: next }),
							workshop.recipe.accentTint.toFixed(2)
						)}
						{@render slider(
							t.studio.lightBackground,
							workshop.recipe.lightBackground,
							0.9,
							1,
							0.005,
							(next) => workshop.setRecipe({ lightBackground: next }),
							workshop.recipe.lightBackground.toFixed(3)
						)}
						{@render slider(
							t.studio.darkBackground,
							workshop.recipe.darkBackground,
							0.08,
							0.28,
							0.005,
							(next) => workshop.setRecipe({ darkBackground: next }),
							workshop.recipe.darkBackground.toFixed(3)
						)}
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardContent class="flex flex-col gap-3.5 p-3">
					<button
						type="button"
						onclick={() => (viewState.panels.layout = !viewState.panels.layout)}
						aria-expanded={viewState.panels.layout}
						class="flex cursor-pointer flex-col gap-0.5 text-start hover:text-foreground"
					>
						<span
							class="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
						>
							<ChevronIcon
								class="size-3.5 transition-transform {viewState.panels.layout ? '' : '-rotate-90'}"
							/>
							{t.studio.layout}
						</span>
						{#if viewState.panels.layout}
							<span class="text-[11px] text-muted-foreground">{t.studio.layoutBody}</span>
						{/if}
					</button>

					{#if viewState.panels.layout}
						{@render choice(
							t.studio.sidebarStyle,
							workshop.layout.sidebarStyle,
							sidebarStyleOptions,
							(next) => workshop.setLayout({ sidebarStyle: next as SidebarStyle })
						)}
						{@render choice(
							t.studio.iconColor,
							workshop.layout.iconColor,
							iconColorOptions,
							(next) => workshop.setLayout({ iconColor: next as IconColorMode })
						)}
						{@render choice(t.studio.density, workshop.layout.density, densityOptions, (next) =>
							workshop.setLayout({ density: next as Density })
						)}
						{@render choice(
							t.studio.elevation,
							workshop.layout.elevation,
							elevationOptions,
							(next) => workshop.setLayout({ elevation: next as Elevation })
						)}

						{@render slider(
							t.studio.radius,
							workshop.layout.radius,
							0,
							1.5,
							0.025,
							(next) => workshop.setLayout({ radius: next }),
							`${workshop.layout.radius}rem`
						)}
						{@render slider(
							t.studio.borderWidth,
							workshop.layout.borderWidth,
							0,
							4,
							1,
							(next) => workshop.setLayout({ borderWidth: next }),
							`${workshop.layout.borderWidth}px`
						)}
						{@render slider(
							t.studio.sidebarWidth,
							workshop.layout.sidebarWidth,
							8,
							28,
							0.5,
							(next) => workshop.setLayout({ sidebarWidth: next }),
							`${workshop.layout.sidebarWidth}rem`
						)}
						{@render slider(
							t.studio.sidebarRail,
							workshop.layout.sidebarRail,
							2,
							8,
							0.25,
							(next) => workshop.setLayout({ sidebarRail: next }),
							`${workshop.layout.sidebarRail}rem`
						)}
						{@render slider(
							t.studio.contentWidth,
							workshop.layout.contentWidth,
							40,
							120,
							2,
							(next) => workshop.setLayout({ contentWidth: next }),
							`${workshop.layout.contentWidth}rem`
						)}
					{/if}
				</CardContent>
			</Card>
		</div>

		<div class="flex flex-col gap-4">
			<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
				<div class="flex items-center gap-1.5">
					{#each ['light', 'dark'] as const as candidate (candidate)}
						<Button
							size="sm"
							variant={viewState.studioMode === candidate ? 'default' : 'outline'}
							onclick={() => (viewState.studioMode = candidate)}
						>
							{candidate === 'light' ? t.common.light : t.common.dark}
						</Button>
					{/each}
				</div>

				<div class="flex items-center gap-1.5">
					{#each surfaces as candidate (candidate.id)}
						<Button
							size="sm"
							variant={viewState.studioSurface === candidate.id ? 'default' : 'outline'}
							onclick={() => (viewState.studioSurface = candidate.id)}
						>
							{candidate.label}
						</Button>
					{/each}
				</div>
			</div>

			{#if viewState.studioSurface === 'space'}
				<ColorSpace
					theme={workshop.theme}
					mode={viewState.studioMode}
					unavailable={t.studio.spaceUnavailable}
					class="aspect-[8/5]"
				/>
				<p class="-mt-2 text-xs text-muted-foreground">{t.studio.spaceHint}</p>
			{:else}
				<ThemePreview
					theme={workshop.theme}
					mode={viewState.studioMode}
					surface={viewState.studioSurface === 'landing' ? 'landing' : 'app'}
					detail="full"
					bind:collapsed
				/>
			{/if}

			<div class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">{t.studio.tokens}</span>
				<TokenGrid mode={viewState.studioMode} />
			</div>
		</div>
	</div>
</div>

<ExportDialog theme={exporting} onclose={() => (exporting = null)} />

<dialog
	bind:this={changesDialog}
	onclose={() => (showChanges = false)}
	class="m-auto w-[min(40rem,calc(100vw-2rem))] rounded-lg border bg-background p-0 text-foreground shadow-lg backdrop:bg-black/50"
>
	<div class="flex max-h-[80vh] flex-col">
		<header class="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
			<div class="flex min-w-0 flex-col">
				<h2 class="text-base font-semibold">{t.studio.changes}</h2>
				{#if workshop.origin}
					<p class="truncate text-xs text-muted-foreground">
						{t.studio.basedOn(workshop.origin.name)}
					</p>
				{/if}
			</div>
			<Button
				size="icon"
				variant="ghost"
				onclick={() => (showChanges = false)}
				aria-label={t.common.close}
			>
				<XIcon class="size-4" />
			</Button>
		</header>

		<div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
			{#if changes.length === 0}
				<p class="text-sm text-muted-foreground">{t.studio.changesNone}</p>
			{:else}
				<pre
					class="overflow-auto rounded-md border bg-muted/40 p-3 text-[11px] leading-relaxed"><code
						>{changesJson}</code
					></pre>
			{/if}
		</div>
	</div>
</dialog>
