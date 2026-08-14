<script lang="ts">
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import {
		createTable,
		getCoreRowModel,
		getFilteredRowModel,
		getSortedRowModel,
		type ColumnDef,
		type SortingState,
		type TableOptionsResolved
	} from '@tanstack/table-core';

	interface Row {
		name: string;
		owner: string;
		status: string;
		open: number;
	}

	const DATA: Row[] = [
		{ name: 'Payments', owner: 'Ackerman', status: 'Shipped', open: 2 },
		{ name: 'Onboarding', owner: 'Brandt', status: 'In review', open: 7 },
		{ name: 'Billing', owner: 'Castellan', status: 'Open', open: 14 },
		{ name: 'Search', owner: 'Devlin', status: 'Shipped', open: 0 },
		{ name: 'Notifications', owner: 'Ericsson', status: 'Open', open: 9 }
	];

	const columns: ColumnDef<Row>[] = [
		{ accessorKey: 'name', header: 'Project' },
		{ accessorKey: 'owner', header: 'Owner' },
		{ accessorKey: 'status', header: 'Status' },
		{ accessorKey: 'open', header: 'Open' }
	];

	let sorting = $state<SortingState>([{ id: 'open', desc: true }]);
	let filter = $state('');

	/**
	 * table-core is headless and framework-neutral: it hands back a state object and expects the
	 * host to re-render. Rebuilding the instance whenever sorting or the filter changes is what
	 * makes that reactive here, and for five rows it costs nothing.
	 *
	 * `state` replaces the table's state wholesale rather than merging into it, so it has to be
	 * layered over `initialState` — passing only the two fields this component drives leaves
	 * `columnPinning` undefined, and `getHeaderGroups()` reads `columnPinning.left` on every call.
	 */
	const table = $derived.by(() => {
		const options: TableOptionsResolved<Row> = {
			data: DATA,
			columns,
			state: {},
			onStateChange: () => {},
			renderFallbackValue: null,
			getCoreRowModel: getCoreRowModel(),
			getSortedRowModel: getSortedRowModel(),
			getFilteredRowModel: getFilteredRowModel()
		};

		const instance = createTable(options);
		instance.setOptions((previous) => ({
			...previous,
			state: { ...instance.initialState, sorting, globalFilter: filter }
		}));
		return instance;
	});

	function toggleSort(id: string): void {
		const current = sorting[0];
		sorting = current?.id === id && !current.desc ? [{ id, desc: true }] : [{ id, desc: false }];
	}

	const cell = 'calc(var(--spacing-base) * 2) calc(var(--spacing-base) * 3)';
</script>

<div style:display="flex" style:flex-direction="column" style:gap="calc(var(--spacing-base) * 2)">
	<input
		bind:value={filter}
		placeholder="Filter projects…"
		style:height="calc(var(--spacing-base) * 8)"
		style:padding="0 calc(var(--spacing-base) * 3)"
		style:border="var(--border-width) solid var(--input)"
		style:border-radius="calc(var(--radius) - 2px)"
		style:background="var(--background)"
		style:color="var(--foreground)"
		style:font="inherit"
		style:width="14rem"
	/>

	<table style:width="100%" style:border-collapse="collapse" style:text-align="start">
		<thead>
			<tr>
				{#each table.getHeaderGroups()[0]?.headers ?? [] as header (header.id)}
					{@const sorted = sorting[0]?.id === header.column.id ? sorting[0] : null}
					<th
						style:padding={cell}
						style:border-bottom="var(--border-width) solid var(--border)"
						style:text-align={header.column.id === 'open' ? 'end' : 'start'}
						style:color="var(--muted-foreground)"
						style:font-weight="500"
					>
						<button
							type="button"
							onclick={() => toggleSort(header.column.id)}
							style:display="inline-flex"
							style:align-items="center"
							style:gap="calc(var(--spacing-base) * 1)"
							style:border="none"
							style:background="transparent"
							style:color="inherit"
							style:font="inherit"
							style:cursor="pointer"
							style:padding="0"
						>
							{String(header.column.columnDef.header)}
							{#if sorted}
								{#if sorted.desc}
									<ArrowDownIcon style="width: 0.85em; height: 0.85em" />
								{:else}
									<ArrowUpIcon style="width: 0.85em; height: 0.85em" />
								{/if}
							{/if}
						</button>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each table.getRowModel().rows as row (row.id)}
				<tr>
					{#each row.getVisibleCells() as visible (visible.id)}
						<td
							style:padding={cell}
							style:border-bottom="var(--border-width) solid var(--border)"
							style:text-align={visible.column.id === 'open' ? 'end' : 'start'}
							style:font-variant-numeric="tabular-nums"
						>
							{#if visible.column.id === 'status'}
								{@const status = String(visible.getValue())}
								<span
									style:padding="calc(var(--spacing-base) * 0.5) calc(var(--spacing-base) * 2)"
									style:border-radius="999px"
									style:background={status === 'Shipped'
										? 'var(--success)'
										: status === 'Open'
											? 'var(--warning)'
											: 'var(--secondary)'}
									style:color={status === 'Shipped'
										? 'var(--success-foreground)'
										: status === 'Open'
											? 'var(--warning-foreground)'
											: 'var(--secondary-foreground)'}
								>
									{status}
								</span>
							{:else}
								{String(visible.getValue())}
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
			{#if table.getRowModel().rows.length === 0}
				<tr>
					<td style:padding={cell} style:color="var(--muted-foreground)" colspan="4">
						Nothing matches that filter.
					</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>
