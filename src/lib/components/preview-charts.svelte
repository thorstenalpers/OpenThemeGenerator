<script lang="ts">
	interface Props {
		/** A stable id per instance: two gradients with one id and the second one wins everywhere. */
		uid: string;
		/** The heatmap is the expensive half; the gallery cards leave it out. */
		heatmap?: boolean;
	}

	let { uid, heatmap = false }: Props = $props();

	const series = [38, 52, 44, 66, 58, 81, 72, 90, 76, 96, 88, 104];
	const width = 480;
	const height = 130;

	/**
	 * A Catmull-Rom spline written out as cubic béziers.
	 *
	 * Straight line segments read as a sketch rather than a chart, and a smoothing library would be
	 * a dependency for twelve points. This is the arithmetic that turns four neighbours into one
	 * curve segment, which is all such a library would do here anyway.
	 */
	const path = $derived.by(() => {
		const max = Math.max(...series) * 1.12;
		const points = series.map((value, index) => ({
			x: (index / (series.length - 1)) * width,
			y: height - (value / max) * height
		}));

		return points.reduce((drawn, point, index) => {
			if (index === 0) return `M ${point.x} ${point.y}`;
			const previous = points[index - 1] as { x: number; y: number };
			const before = points[index - 2] ?? previous;
			const after = points[index + 1] ?? point;
			const c1 = {
				x: previous.x + (point.x - before.x) / 6,
				y: previous.y + (point.y - before.y) / 6
			};
			const c2 = {
				x: point.x - (after.x - previous.x) / 6,
				y: point.y - (after.y - previous.y) / 6
			};
			return `${drawn} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${point.x} ${point.y}`;
		}, '');
	});

	const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	/** Deterministic rather than random: a preview that reshuffles on every keystroke is noise. */
	const cells = days.map((day, row) =>
		Array.from({ length: 16 }, (_, column) => ({
			key: `${day}-${column}`,
			weight: ((Math.sin(row * 1.7 + column * 0.9) + 1) / 2) * 0.85 + 0.06
		}))
	);
</script>

<svg
	viewBox="0 0 {width} {height}"
	preserveAspectRatio="none"
	style:width="100%"
	style:height="7rem"
	style:display="block"
	role="img"
	aria-label="Throughput over twelve weeks"
>
	<defs>
		<linearGradient id="area-{uid}" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="var(--chart-1)" stop-opacity="0.45" />
			<stop offset="100%" stop-color="var(--chart-1)" stop-opacity="0.02" />
		</linearGradient>
	</defs>

	<path d="{path} L {width} {height} L 0 {height} Z" fill="url(#area-{uid})" />
	<path
		d={path}
		fill="none"
		stroke="var(--chart-1)"
		stroke-width="2"
		stroke-linecap="round"
		vector-effect="non-scaling-stroke"
	/>
</svg>

{#if heatmap}
	<div style:display="flex" style:flex-direction="column" style:gap="2px">
		{#each cells as row, index (days[index])}
			<div style:display="flex" style:gap="2px">
				{#each row as cell (cell.key)}
					<span
						style:flex="1"
						style:height="0.7rem"
						style:border-radius="2px"
						style:background="var(--chart-2)"
						style:opacity={cell.weight}
					></span>
				{/each}
			</div>
		{/each}
	</div>
{/if}
