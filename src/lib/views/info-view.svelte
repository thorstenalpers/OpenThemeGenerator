<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { i18n } from '$lib/i18n/index.svelte';
	import { FORMATS } from '$lib/theme/export';
	import { TOKENS } from '$lib/theme/tokens';

	const t = $derived(i18n.t);
</script>

<div class="flex max-w-3xl flex-col gap-3 p-4 sm:p-6">
	<header class="flex flex-col gap-1">
		<h1 class="text-xl font-semibold">{t.info.title}</h1>
		<p class="text-sm text-muted-foreground">{t.info.body}</p>
	</header>

	<Card>
		<CardHeader>
			<CardTitle>{t.info.formats}</CardTitle>
		</CardHeader>
		<CardContent class="flex flex-col gap-2.5">
			{#each FORMATS as format (format.id)}
				<div class="flex flex-col gap-0.5">
					<span class="text-sm font-medium">{format.label}</span>
					<span class="text-xs leading-relaxed text-muted-foreground">{format.description}</span>
				</div>
			{/each}
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>{t.info.tokens}</CardTitle>
		</CardHeader>
		<CardContent class="flex flex-col gap-2">
			<p class="text-xs leading-relaxed text-muted-foreground">{t.info.tokensBody}</p>
			<div class="flex flex-wrap gap-1">
				{#each TOKENS as token (token.name)}
					<span
						class="rounded border px-1.5 py-0.5 font-mono text-[11px] {token.core
							? 'text-muted-foreground'
							: 'border-primary/40 text-primary'}"
					>
						{token.name}
					</span>
				{/each}
			</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>{t.info.reference}</CardTitle>
		</CardHeader>
		<CardContent>
			<p class="text-xs leading-relaxed text-muted-foreground">{t.info.referenceBody}</p>
		</CardContent>
	</Card>

	<p class="px-1 text-xs text-muted-foreground">
		OpenThemeGenerator · {t.info.licence}
	</p>
</div>
