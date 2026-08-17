<script lang="ts">
	import '../app.css';
	import { onMount, type Snippet } from 'svelte';
	import { afterNavigate, beforeNavigate, preloadCode } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ModeWatcher } from 'mode-watcher';
	import ModeToggle from '$lib/components/mode-toggle.svelte';
	import SidebarShell, { ROUTES } from '$lib/components/sidebar-shell.svelte';
	import { isMockHost } from '$lib/bridge/client';
	import { library } from '$lib/stores/library.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { workshop } from '$lib/stores/workshop.svelte';
	import { applyToApp } from '$lib/theme/apply';

	let { children }: { children?: Snippet } = $props();

	settings.restore();
	// Before the workshop, which looks in the library when it reopens the tab you left behind.
	library.restore();
	workshop.restore();

	// Dressing the app in the theme being edited is the whole point of the switch, so it has to
	// follow every token change rather than only the moment it was turned on.
	$effect(() => {
		applyToApp(settings.applyToApp ? workshop.theme : null);
	});

	// `main` is the scroll container, not the window, so the browser's own restoration never sees
	// it. Remembering the offset per route is what makes leaving a long token list and coming back
	// feel like returning rather than starting over.
	let scroller = $state<HTMLElement | null>(null);
	const offsets: Record<string, number> = {};

	beforeNavigate(({ from }) => {
		if (from && scroller) offsets[from.url.pathname] = scroller.scrollTop;
	});

	afterNavigate(({ to }) => {
		if (!to || !scroller) return;
		const target = offsets[to.url.pathname] ?? 0;
		if (target === 0) {
			scroller.scrollTop = 0;
			return;
		}

		// Not one deferred write but a short retry loop: the previews size themselves from a
		// measured clientWidth, so the page is a few frames short of its final height and an early
		// assignment is clamped back to 0. Retrying until the value sticks survives that; the
		// deadline keeps a page that really is short from being polled forever.
		const deadline = Date.now() + 400;
		const restore = () => {
			if (!scroller) return;
			scroller.scrollTop = target;
			if (scroller.scrollTop < target && Date.now() < deadline) {
				setTimeout(restore, 40);
			}
		};
		restore();
	});

	onMount(() => {
		// Every route's code, fetched in the background right after start. A first click then costs
		// a component swap rather than a network round trip and a module evaluation.
		for (const route of ROUTES) void preloadCode(resolve(route));
	});
</script>

<!-- The open theme is in the title on every page, not only in the studio: a route-local title
     goes stale the moment you navigate away from the route that set it. -->
<svelte:head>
	<title>{workshop.name} · OpenThemeGenerator</title>
</svelte:head>

<!-- Synchronous because the default defers the switch into a `requestAnimationFrame`, and a webview
     that is not compositing never fires one — minimised or occluded, the mode would move in
     `localStorage` and not on screen until the next load. -->
<ModeWatcher synchronousModeChanges />

<div class="flex h-screen w-screen overflow-hidden">
	<SidebarShell />
	<div class="flex min-w-0 flex-1 flex-col">
		<header class="flex h-12 shrink-0 items-center justify-end gap-2 border-b px-3">
			<ModeToggle />
		</header>
		<!-- Not translated and not a token in the dictionary: nobody running the app can ever see it.
		     It is a note to whoever is developing in a browser. `isMockHost` is false in a build, so
		     the branch never runs — its markup still rides along in the chunk, because the compiler
		     hoists every template to module scope and this one is small enough not to chase. -->
		{#if isMockHost()}
			<div class="border-b border-warning/40 bg-warning/10 px-6 py-2 text-xs text-muted-foreground">
				Development browser without the desktop host — anything that touches disk is stubbed.
			</div>
		{/if}
		<main bind:this={scroller} class="min-h-0 flex-1 overflow-y-auto">
			{@render children?.()}
		</main>
	</div>
</div>
