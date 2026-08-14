<script lang="ts">
	import RotateIcon from '@lucide/svelte/icons/rotate-ccw';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { contrast, hexToOklch, formatOklch, oklchToHex, parseOklch } from '$lib/theme/color';
	import { TOKEN_GROUPS, TOKENS } from '$lib/theme/tokens';
	import { paletteOf } from '$lib/theme/theme';
	import { workshop } from '$lib/stores/workshop.svelte';
	import { i18n } from '$lib/i18n/index.svelte';

	interface Props {
		mode: 'light' | 'dark';
	}

	let { mode }: Props = $props();

	const t = $derived(i18n.t);
	const palette = $derived(paletteOf(workshop.theme, mode));

	/** The token whose text field is currently unreadable, so the row can say so without a toast. */
	let rejected = $state<string | null>(null);

	function commit(token: string, raw: string): void {
		const parsed = parseOklch(raw) ?? hexToOklch(raw);
		if (!parsed) {
			rejected = token;
			return;
		}
		rejected = null;
		workshop.setToken(mode, token, formatOklch(parsed));
	}

	/** The picker cannot carry alpha, so the token keeps the alpha it already had. */
	function pick(token: string, hex: string): void {
		const next = hexToOklch(hex);
		if (!next) return;
		const alpha = parseOklch(palette[token] ?? '')?.alpha ?? 1;
		workshop.setToken(mode, token, formatOklch({ ...next, alpha }));
	}

	function ratioFor(surface: string, label: string): number {
		return contrast(palette[surface] ?? '', palette[label] ?? '');
	}
</script>

{#each TOKEN_GROUPS as group (group)}
	<section class="flex flex-col">
		<h3
			class="px-1 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
		>
			{group}
		</h3>
		<div class="flex flex-col divide-y rounded-md border">
			{#each TOKENS.filter((token) => token.group === group) as token (token.name)}
				{@const value = palette[token.name] ?? ''}
				{@const edited = workshop.isEdited(mode, token.name)}
				{@const ratio = token.pairedWith ? ratioFor(token.name, token.pairedWith) : null}
				<div class="flex items-center gap-2 px-2 py-1.5">
					<label class="relative size-7 shrink-0 cursor-pointer overflow-hidden rounded border">
						<span class="absolute inset-0" style="background: {value}"></span>
						<input
							type="color"
							value={oklchToHex({
								...(parseOklch(value) ?? { l: 0, c: 0, h: 0, alpha: 1 }),
								alpha: 1
							})}
							oninput={(event) => pick(token.name, event.currentTarget.value)}
							aria-label={token.name}
							class="absolute inset-0 cursor-pointer opacity-0"
						/>
					</label>

					<span class="w-44 shrink-0 truncate font-mono text-xs">--{token.name}</span>

					<input
						{value}
						onchange={(event) => commit(token.name, event.currentTarget.value)}
						spellcheck="false"
						class="h-7 min-w-0 flex-1 rounded border border-input bg-background px-2 font-mono text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none {rejected ===
						token.name
							? 'border-destructive'
							: ''}"
					/>

					{#if ratio !== null && ratio < 4.5}
						<span
							class="flex shrink-0 items-center gap-1 text-[11px] text-warning"
							title={t.studio.lowContrast(ratio.toFixed(1))}
						>
							<TriangleAlertIcon class="size-3.5" />
							{ratio.toFixed(1)}
						</span>
					{/if}

					{#if edited}
						<button
							type="button"
							onclick={() => workshop.clearToken(mode, token.name)}
							title={t.studio.revert}
							aria-label="{t.studio.revert} — {token.name}"
							class="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<RotateIcon class="size-3.5" />
						</button>
					{:else}
						<span class="size-6 shrink-0"></span>
					{/if}
				</div>
			{/each}
		</div>
	</section>
{/each}
