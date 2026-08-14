<script lang="ts">
	import PreviewCharts from '$lib/components/preview-charts.svelte';
	import PreviewLanding from '$lib/components/preview-landing.svelte';
	import { SAMPLE_ENTRIES } from '$lib/components/preview-nav';
	import PreviewSidebar from '$lib/components/preview-sidebar.svelte';
	import PreviewTable from '$lib/components/preview-table.svelte';
	import { inlineStyle } from '$lib/theme/apply';
	import type { Theme } from '$lib/theme/theme';
	import { cn } from '$lib/utils';

	interface Props {
		theme: Theme;
		mode: 'light' | 'dark';
		/**
		 * `full` adds the sortable table, the heatmap and the dialog. The gallery stays on `compact`
		 * on purpose: ninety cards times a live table is a second of layout for rows nobody has
		 * scrolled to, and the structure is legible from the chart and the sidebar alone.
		 */
		detail?: 'full' | 'compact';
		/**
		 * Which of the two things a theme has to carry. An app is a sidebar and dense surfaces; a
		 * landing page is display type, a glow and a product shot — the same tokens under a load
		 * that finds different weaknesses in them.
		 */
		surface?: 'app' | 'landing';
		/** Bound by the studio so the collapse toggle is real rather than decorative. */
		collapsed?: boolean;
		class?: string;
	}

	let {
		theme,
		mode,
		detail = 'compact',
		surface = 'app',
		collapsed = $bindable(false),
		class: className
	}: Props = $props();

	/** Gradient ids have to be unique per instance or the last one on the page wins everywhere. */
	const uid = $props.id();

	let dialogOpen = $state(false);

	/** Which sample page the preview is on. Projects, because it is the busiest one. */
	let page = $state(1);
	/** And which of that page's children, when the navigation went one level down. */
	let child = $state<number | null>(null);

	const heading = $derived(
		(child === null ? SAMPLE_ENTRIES[page]?.label : SAMPLE_ENTRIES[page]?.children?.[child]) ?? ''
	);

	const people = [
		{ name: 'Ackerman', role: 'Owner' },
		{ name: 'Brandt', role: 'Editor' },
		{ name: 'Castellan', role: 'Viewer' }
	];

	/**
	 * The page is drawn at desktop size and scaled down, rather than drawn small.
	 *
	 * A sidebar is 16rem wide whatever the window is; shrinking the numbers to fit a card would
	 * show a layout nobody will ever see. Scaling the whole canvas keeps every proportion — the
	 * sidebar against the content, the spacing against the type — exactly as it will ship.
	 */
	const CANVAS = { width: 1120, height: 700 };

	let available = $state(0);
	const scale = $derived(available > 0 ? available / CANVAS.width : 0);

	// `dark` on the container rather than on <html>: the custom variant is `&:is(.dark *)`, so the
	// app's own mode stays untouched while this subtree paints in the theme being previewed.
	const style = $derived(inlineStyle(theme, mode));

	/** Spacing is expressed in steps of the theme's own scale, the way `p-4` would be. */
	const sp = (steps: number) => `calc(var(--spacing-base) * ${steps})`;

	const rows = ['Ackerman', 'Brandt', 'Castellan'];
</script>

<div
	bind:clientWidth={available}
	class={cn('overflow-hidden rounded-md border', className)}
	style="height: {Math.round(CANVAS.height * scale)}px"
>
	<div
		{style}
		class={mode === 'dark' ? 'dark' : ''}
		style:width="{CANVAS.width}px"
		style:height="{CANVAS.height}px"
		style:transform="scale({scale})"
		style:transform-origin="top left"
		style:background="var(--background)"
		style:color="var(--foreground)"
		style:font-size="var(--font-size-base)"
		style:display="flex"
	>
		{#if surface === 'landing'}
			<PreviewLanding />
		{:else}
			<PreviewSidebar
				style={theme.layout.sidebarStyle}
				{collapsed}
				active={page}
				{child}
				ontoggle={() => (collapsed = !collapsed)}
				onselect={detail === 'full'
					? (index: number, childIndex: number | null) => {
							page = index;
							child = childIndex;
						}
					: undefined}
			/>

			<div
				style:flex="1"
				style:min-width="0"
				style:display="flex"
				style:flex-direction="column"
				style:position="relative"
			>
				<header
					style:height="var(--header-height)"
					style:flex="0 0 auto"
					style:display="flex"
					style:align-items="center"
					style:justify-content="space-between"
					style:gap={sp(3)}
					style:padding="0 {sp(5)}"
					style:border-bottom="var(--border-width) solid var(--border)"
				>
					<span style:font-weight="600">{heading}</span>
					<span style:display="flex" style:gap={sp(2)}>
						<span
							style:padding="{sp(2)}
							{sp(4)}"
							style:border-radius="calc(var(--radius) - 2px)"
							style:border="var(--border-width) solid var(--border)"
						>
							Filter
						</span>
						<button
							type="button"
							onclick={() => (dialogOpen = true)}
							disabled={detail !== 'full'}
							style:padding="{sp(2)}
							{sp(4)}"
							style:border="none"
							style:font="inherit"
							style:cursor={detail === 'full' ? 'pointer' : 'default'}
							style:border-radius="calc(var(--radius) - 2px)"
							style:background="var(--primary)"
							style:color="var(--primary-foreground)"
							style:box-shadow="var(--elevation-low)"
						>
							New project
						</button>
					</span>
				</header>

				<main style:flex="1" style:overflow="hidden" style:padding={sp(5)}>
					<div
						style:max-width="var(--container-max)"
						style:margin="0 auto"
						style:display="flex"
						style:flex-direction="column"
						style:gap={sp(4)}
					>
						{#if child !== null}
							<div
								style:border-radius="var(--radius)"
								style:border="var(--border-width) solid var(--border)"
								style:background="var(--card)"
								style:color="var(--card-foreground)"
								style:box-shadow="var(--elevation-low)"
								style:padding={sp(5)}
								style:display="flex"
								style:flex-direction="column"
								style:gap={sp(3)}
							>
								<span style:display="flex" style:align-items="center" style:gap={sp(3)}>
									<span style:font-size="1.4em" style:font-weight="600">{heading}</span>
									<span
										style:padding="{sp(1)}
										{sp(3)}"
										style:border-radius="999px"
										style:background="var(--success)"
										style:color="var(--success-foreground)"
									>
										Active
									</span>
								</span>
								<span style:color="var(--muted-foreground)">
									One of the sub-pages under Projects. The submenu is real navigation, so a theme
									can be judged on the level below the top one too.
								</span>
								{#each ['Deployments', 'Environments', 'Access'] as field (field)}
									<span
										style:display="flex"
										style:justify-content="space-between"
										style:padding="{sp(2)}
										0"
										style:border-top="var(--border-width) solid var(--border)"
									>
										<span>{field}</span>
										<span style:color="var(--muted-foreground)">Configured</span>
									</span>
								{/each}
							</div>
						{:else if page <= 2}
							<div
								style:display="grid"
								style:grid-template-columns="repeat(3, 1fr)"
								style:gap={sp(4)}
							>
								{#each ['Open', 'In review', 'Shipped'] as label, index (label)}
									<div
										style:padding={sp(4)}
										style:border-radius="var(--radius)"
										style:border="var(--border-width) solid var(--border)"
										style:background="var(--card)"
										style:color="var(--card-foreground)"
										style:box-shadow="var(--elevation-low)"
									>
										<div style:color="var(--muted-foreground)">{label}</div>
										<div style:font-size="1.9em" style:font-weight="600" style:line-height="1.1">
											{[24, 7, 118][index]}
										</div>
									</div>
								{/each}
							</div>

							<div
								style:padding={sp(4)}
								style:border-radius="var(--radius)"
								style:border="var(--border-width) solid var(--border)"
								style:background="var(--card)"
								style:color="var(--card-foreground)"
								style:box-shadow="var(--elevation-mid)"
								style:display="flex"
								style:flex-direction="column"
								style:gap={sp(3)}
							>
								<span style:font-weight="600">Throughput</span>
								<PreviewCharts {uid} heatmap={detail === 'full'} />
							</div>

							{#if detail === 'full'}
								<div
									style:border-radius="var(--radius)"
									style:border="var(--border-width) solid var(--border)"
									style:background="var(--card)"
									style:color="var(--card-foreground)"
									style:box-shadow="var(--elevation-low)"
									style:padding={sp(4)}
								>
									<PreviewTable />
								</div>
							{:else}
								<div
									style:border-radius="var(--radius)"
									style:border="var(--border-width) solid var(--border)"
									style:background="var(--card)"
									style:color="var(--card-foreground)"
									style:box-shadow="var(--elevation-low)"
									style:overflow="hidden"
								>
									{#each rows as row, index (row)}
										<div
											style:display="flex"
											style:align-items="center"
											style:justify-content="space-between"
											style:gap={sp(3)}
											style:padding="{sp(3)}
											{sp(4)}"
											style:background={index === 1 ? 'var(--muted)' : 'transparent'}
											style:border-top={index === 0
												? 'none'
												: 'var(--border-width) solid var(--border)'}
										>
											<span>{row}</span>
											<span style:display="flex" style:gap={sp(2)} style:align-items="center">
												<span
													style:padding="{sp(1)}
													{sp(3)}"
													style:border-radius="999px"
													style:background={index === 2 ? 'var(--success)' : 'var(--warning)'}
													style:color={index === 2
														? 'var(--success-foreground)'
														: 'var(--warning-foreground)'}
												>
													{index === 2 ? 'Done' : 'Pending'}
												</span>
												<span
													style:padding="{sp(1)}
													{sp(3)}"
													style:border-radius="calc(var(--radius) - 4px)"
													style:background="var(--secondary)"
													style:color="var(--secondary-foreground)"
												>
													Edit
												</span>
											</span>
										</div>
									{/each}
								</div>
							{/if}
						{/if}

						{#if page >= 3}
							<div
								style:border-radius="var(--radius)"
								style:border="var(--border-width) solid var(--border)"
								style:background="var(--card)"
								style:color="var(--card-foreground)"
								style:box-shadow="var(--elevation-low)"
								style:padding={sp(5)}
								style:display="flex"
								style:flex-direction="column"
								style:gap={sp(3)}
							>
								{#if page === 3}
									{#each people as person (person.name)}
										<span style:display="flex" style:align-items="center" style:gap={sp(3)}>
											<span
												style:width="2rem"
												style:height="2rem"
												style:border-radius="999px"
												style:background="var(--secondary)"
											></span>
											<span style:flex="1">{person.name}</span>
											<span style:color="var(--muted-foreground)">{person.role}</span>
										</span>
									{/each}
								{:else if page === 4}
									{#each ['Workspace name', 'Billing email'] as field (field)}
										<span style:display="flex" style:flex-direction="column" style:gap={sp(1)}>
											<span style:color="var(--muted-foreground)">{field}</span>
											<span
												style:height="calc(var(--spacing-base) * 9)"
												style:border="var(--border-width) solid var(--input)"
												style:border-radius="calc(var(--radius) - 2px)"
												style:background="var(--background)"
											></span>
										</span>
									{/each}
								{:else}
									<span style:font-weight="600">Acme</span>
									<span style:color="var(--muted-foreground)">
										Every surface, border and shadow on these pages is a token from the theme being
										edited. Click the sidebar to walk through them.
									</span>
								{/if}
							</div>
						{/if}
					</div>
				</main>

				{#if dialogOpen}
					<!-- Drawn inside the canvas rather than with <dialog>: a real modal escapes to the top
				     layer, which sits outside the scaled preview and would render at full size over the
				     whole app. -->
					<div
						style:position="absolute"
						style:inset="0"
						style:display="flex"
						style:align-items="center"
						style:justify-content="center"
						style:background="oklch(0 0 0 / 0.45)"
					>
						<div
							style:width="26rem"
							style:padding={sp(5)}
							style:display="flex"
							style:flex-direction="column"
							style:gap={sp(3)}
							style:border-radius="var(--radius)"
							style:border="var(--border-width) solid var(--border)"
							style:background="var(--popover)"
							style:color="var(--popover-foreground)"
							style:box-shadow="var(--elevation-high)"
						>
							<span style:font-weight="600">New project</span>
							<span style:color="var(--muted-foreground)">
								Everything in this dialog is a token: the surface, the border, the shadow and the
								two buttons below.
							</span>
							<span
								style:height="calc(var(--spacing-base) * 8)"
								style:border="var(--border-width) solid var(--input)"
								style:border-radius="calc(var(--radius) - 2px)"
								style:background="var(--background)"
							></span>
							<span style:display="flex" style:gap={sp(2)} style:justify-content="flex-end">
								<button
									type="button"
									onclick={() => (dialogOpen = false)}
									style:padding="{sp(2)}
									{sp(4)}"
									style:font="inherit"
									style:cursor="pointer"
									style:border="var(--border-width) solid var(--border)"
									style:border-radius="calc(var(--radius) - 2px)"
									style:background="var(--background)"
									style:color="var(--foreground)"
								>
									Cancel
								</button>
								<button
									type="button"
									onclick={() => (dialogOpen = false)}
									style:padding="{sp(2)}
									{sp(4)}"
									style:font="inherit"
									style:cursor="pointer"
									style:border="none"
									style:border-radius="calc(var(--radius) - 2px)"
									style:background="var(--primary)"
									style:color="var(--primary-foreground)"
								>
									Create
								</button>
							</span>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
