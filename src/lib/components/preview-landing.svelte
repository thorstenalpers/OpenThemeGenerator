<script lang="ts">
	import BoltIcon from '@lucide/svelte/icons/zap';
	import LockIcon from '@lucide/svelte/icons/shield-check';
	import PulseIcon from '@lucide/svelte/icons/activity';

	const features = [
		{
			icon: BoltIcon,
			chart: 1,
			title: 'Edge by default',
			body: 'Served from the nearest region. No cold starts.'
		},
		{
			icon: LockIcon,
			chart: 2,
			title: 'Signed end to end',
			body: 'Keys never leave the enclave. Rotation is a field.'
		},
		{
			icon: PulseIcon,
			chart: 3,
			title: 'Traced, not guessed',
			body: 'Every span, browser to database, in one timeline.'
		}
	];

	const stats = [
		['99.99%', 'uptime'],
		['28ms', 'p95 latency'],
		['180+', 'regions'],
		['4.2M', 'deploys / week']
	];

	/** The bars in the product shot: a shape, not data, so it reads at any size. */
	const bars = [38, 52, 44, 68, 58, 82, 71, 92, 76, 100, 88, 96];
</script>

<div class="page">
	<!-- The glow is two radial gradients rather than a blurred element: `filter` would promote the
	     whole hero to its own layer and repaint it on every token change. -->
	<span aria-hidden="true" class="glow"></span>
	<span aria-hidden="true" class="grid-lines"></span>

	<header class="nav">
		<span class="wordmark">
			<span class="mark"></span>
			Northbound
		</span>
		<nav class="links">
			<span>Product</span>
			<span>Pricing</span>
			<span>Docs</span>
			<span>Changelog</span>
		</nav>
		<span class="actions">
			<span class="ghost">Sign in</span>
			<span class="cta">Get started</span>
		</span>
	</header>

	<main class="hero">
		<span class="badge">
			<span class="dot"></span>
			v2 is live — edge functions in 180 regions
		</span>

		<h1>
			Ship the product,
			<span class="gradient">not the pipeline</span>
		</h1>

		<p class="sub">
			One deploy target for the whole stack. Push to main and the build, the migration and the cache
			invalidation are done before the pull request closes.
		</p>

		<span class="buttons">
			<span class="cta large">Start free</span>
			<span class="outline">Read the docs</span>
		</span>

		<div class="shot">
			<span class="shot-bar">
				<span class="dots"><i></i><i></i><i></i></span>
				<span class="url">northbound.app/overview</span>
			</span>
			<div class="shot-body">
				<div class="shot-side">
					{#each ['Overview', 'Deploys', 'Logs', 'Usage'] as item, index (item)}
						<span class="shot-nav" class:on={index === 0}>{item}</span>
					{/each}
				</div>
				<div class="shot-main">
					<span class="shot-title">Requests</span>
					<div class="bars">
						{#each bars as height, index (index)}
							<span style:height="{height}%" style:--bar="var(--chart-{(index % 5) + 1})"></span>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</main>

	<section class="features">
		{#each features as feature (feature.title)}
			{@const Icon = feature.icon}
			<article>
				<span class="tile" style:--tile="var(--chart-{feature.chart})">
					<Icon />
				</span>
				<span class="feature-title">{feature.title}</span>
				<span class="feature-body">{feature.body}</span>
			</article>
		{/each}
	</section>

	<footer class="stats">
		{#each stats as [value, label] (label)}
			<span>
				<b>{value}</b>
				{label}
			</span>
		{/each}
	</footer>
</div>

<style>
	.page {
		position: relative;
		display: flex;
		width: 100%;
		height: 100%;
		flex-direction: column;
		background: var(--background);
		color: var(--foreground);
		isolation: isolate;
		overflow: hidden;
	}

	.glow,
	.grid-lines {
		position: absolute;
		z-index: -1;
		top: 0;
		right: 0;
		left: 0;
		height: 62%;
		pointer-events: none;
	}

	/* Lit from the chart ramp rather than from `primary`: a near-black brand colour washed over the
	   hero reads as dirt, while the ramp is chromatic in every theme — a grey seed falls back to a
	   blue data hue, so even a monochrome theme has something to glow with. */
	.glow {
		background:
			radial-gradient(
				62% 72% at 50% 0%,
				color-mix(in oklch, var(--chart-1) 20%, transparent),
				transparent 70%
			),
			radial-gradient(
				42% 52% at 84% 10%,
				color-mix(in oklch, var(--chart-3) 16%, transparent),
				transparent 70%
			);
	}

	.grid-lines {
		background-image:
			linear-gradient(to right, var(--border) var(--border-width), transparent var(--border-width)),
			linear-gradient(to bottom, var(--border) var(--border-width), transparent var(--border-width));
		background-size: calc(var(--spacing-base) * 14) calc(var(--spacing-base) * 14);
		mask-image: linear-gradient(to bottom, oklch(0 0 0 / 0.5), transparent 75%);
		opacity: 0.5;
	}

	.nav {
		display: flex;
		height: var(--header-height);
		flex: 0 0 auto;
		align-items: center;
		justify-content: space-between;
		padding-inline: calc(var(--spacing-base) * 7);
		border-bottom: var(--border-width) solid var(--border);
	}

	.wordmark {
		display: flex;
		align-items: center;
		font-size: 1.05em;
		font-weight: 700;
		gap: calc(var(--spacing-base) * 2);
		letter-spacing: -0.01em;
	}

	.mark {
		width: 1.15em;
		height: 1.15em;
		border-radius: calc(var(--radius) * 0.6);
		background: linear-gradient(135deg, var(--primary), var(--chart-3));
		box-shadow: var(--elevation-low);
	}

	.links {
		display: flex;
		color: var(--muted-foreground);
		gap: calc(var(--spacing-base) * 6);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: calc(var(--spacing-base) * 3);
	}

	.ghost {
		color: var(--muted-foreground);
	}

	.cta,
	.outline {
		padding: calc(var(--spacing-base) * 2) calc(var(--spacing-base) * 4);
		border-radius: calc(var(--radius) - 2px);
		font-weight: 600;
		white-space: nowrap;
	}

	.cta {
		background: var(--primary);
		box-shadow: var(--elevation-low);
		color: var(--primary-foreground);
	}

	.outline {
		border: var(--border-width) solid var(--border);
		background: var(--card);
		color: var(--foreground);
	}

	.large {
		padding: calc(var(--spacing-base) * 3) calc(var(--spacing-base) * 7);
		font-size: 1.05em;
	}

	.hero {
		display: flex;
		width: 100%;
		min-height: 0;
		flex: 1;
		flex-direction: column;
		align-items: center;
		/* Without the explicit width the auto inline margins cancel the stretch and the section
		   collapses to the widest sentence in it. */
		max-width: var(--container-max);
		padding: calc(var(--spacing-base) * 6) calc(var(--spacing-base) * 7) 0;
		margin-inline: auto;
		gap: calc(var(--spacing-base) * 3);
		text-align: center;
	}

	.badge {
		display: flex;
		align-items: center;
		padding: calc(var(--spacing-base) * 1.5) calc(var(--spacing-base) * 4);
		border: var(--border-width) solid var(--border);
		border-radius: 999px;
		background: color-mix(in oklch, var(--card) 70%, transparent);
		color: var(--muted-foreground);
		font-size: 0.9em;
		gap: calc(var(--spacing-base) * 2);
	}

	.dot {
		width: 0.5em;
		height: 0.5em;
		border-radius: 999px;
		background: var(--success);
	}

	h1 {
		max-width: 18ch;
		margin: 0;
		font-size: 3em;
		font-weight: 800;
		letter-spacing: -0.035em;
		line-height: 1.05;
	}

	.gradient {
		background: linear-gradient(100deg, var(--primary), var(--chart-3) 55%, var(--chart-2));
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	.sub {
		max-width: 56ch;
		margin: 0;
		color: var(--muted-foreground);
		font-size: 1.1em;
		line-height: 1.5;
	}

	.buttons {
		display: flex;
		gap: calc(var(--spacing-base) * 3);
	}

	.shot {
		display: flex;
		width: 100%;
		min-height: 42%;
		flex: 1;
		flex-direction: column;
		margin-top: calc(var(--spacing-base) * 2);
		border: var(--border-width) solid var(--border);
		border-bottom: none;
		border-radius: var(--radius) var(--radius) 0 0;
		background: var(--card);
		box-shadow: var(--elevation-high);
		color: var(--card-foreground);
		overflow: hidden;
		text-align: start;
	}

	.shot-bar {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
		height: calc(var(--spacing-base) * 9);
		padding-inline: calc(var(--spacing-base) * 3);
		border-bottom: var(--border-width) solid var(--border);
		background: var(--muted);
		gap: calc(var(--spacing-base) * 3);
	}

	.dots {
		display: flex;
		gap: calc(var(--spacing-base) * 1.5);
	}

	.dots i {
		width: 0.55em;
		height: 0.55em;
		border-radius: 999px;
		background: var(--border);
	}

	.url {
		color: var(--muted-foreground);
		font-size: 0.85em;
	}

	.shot-body {
		display: flex;
		min-height: 0;
		flex: 1;
	}

	.shot-side {
		display: flex;
		width: calc(var(--sidebar-width) * 0.62);
		flex: 0 0 auto;
		flex-direction: column;
		padding: calc(var(--spacing-base) * 3);
		border-inline-end: var(--border-width) solid var(--border);
		gap: var(--sidebar-item-gap);
	}

	.shot-nav {
		padding: calc(var(--spacing-base) * 1.5) calc(var(--spacing-base) * 2.5);
		border-radius: var(--sidebar-item-radius);
		color: var(--muted-foreground);
		font-size: 0.85em;
	}

	.shot-nav.on {
		background: var(--sidebar-active-surface);
		color: var(--sidebar-active-foreground);
		font-weight: var(--sidebar-weight-active);
	}

	.shot-main {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		padding: calc(var(--spacing-base) * 4);
		gap: calc(var(--spacing-base) * 3);
	}

	.shot-title {
		font-weight: 600;
	}

	.bars {
		display: flex;
		min-height: 0;
		flex: 1;
		align-items: flex-end;
		gap: calc(var(--spacing-base) * 2);
	}

	.bars span {
		flex: 1;
		border-radius: calc(var(--radius) * 0.4) calc(var(--radius) * 0.4) 0 0;
		background: linear-gradient(
			to bottom,
			var(--bar),
			color-mix(in oklch, var(--bar) 35%, transparent)
		);
	}

	.features {
		display: grid;
		width: 100%;
		max-width: var(--container-max);
		flex: 0 0 auto;
		padding: calc(var(--spacing-base) * 4) calc(var(--spacing-base) * 7);
		margin-inline: auto;
		gap: calc(var(--spacing-base) * 4);
		grid-template-columns: repeat(3, 1fr);
	}

	.features article {
		display: flex;
		flex-direction: column;
		padding: calc(var(--spacing-base) * 4);
		border: var(--border-width) solid var(--border);
		border-radius: var(--radius);
		background: var(--card);
		box-shadow: var(--elevation-low);
		color: var(--card-foreground);
		gap: calc(var(--spacing-base) * 2);
	}

	.tile {
		display: flex;
		width: 2.1em;
		height: 2.1em;
		align-items: center;
		justify-content: center;
		border-radius: calc(var(--radius) - 2px);
		background: color-mix(in oklch, var(--tile) 18%, transparent);
		color: var(--tile);
	}

	.tile :global(svg) {
		width: 1.1em;
		height: 1.1em;
	}

	.feature-title {
		font-weight: 600;
	}

	.feature-body {
		color: var(--muted-foreground);
		font-size: 0.92em;
		line-height: 1.45;
	}

	.stats {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
		justify-content: space-around;
		padding: calc(var(--spacing-base) * 4) calc(var(--spacing-base) * 7);
		border-top: var(--border-width) solid var(--border);
		background: var(--muted);
		color: var(--muted-foreground);
	}

	.stats span {
		display: flex;
		align-items: baseline;
		gap: calc(var(--spacing-base) * 2);
	}

	.stats b {
		color: var(--foreground);
		font-size: 1.35em;
		letter-spacing: -0.02em;
	}
</style>
