<script lang="ts" generics="T">
    import { onMount } from 'svelte';
	import {
		createGrid,
		ModuleRegistry,
		ClientSideRowModelModule,
		type GridOptions,
		themeQuartz,
		PaginationModule,
		type GridApi,
		QuickFilterModule,
		ValidationModule,
		RowAutoHeightModule,
		ColumnAutoSizeModule,
		TextFilterModule,
		NumberFilterModule,
		ClientSideRowModelApiModule,
		EventApiModule,
		DateFilterModule,
		RowApiModule,
        type ColDef,
        SelectEditorModule,
        TextEditorModule,
        NumberEditorModule,
        DateEditorModule,
	} from 'ag-grid-community';

	ModuleRegistry.registerModules([
		ClientSideRowModelModule,
		PaginationModule,
		QuickFilterModule,
		ValidationModule,
		RowAutoHeightModule,
		ColumnAutoSizeModule,
		TextFilterModule,
		NumberFilterModule,
		ClientSideRowModelApiModule,
		EventApiModule,
		DateFilterModule,
		RowApiModule,
        SelectEditorModule,
        TextEditorModule,
        NumberEditorModule,
        DateEditorModule,
	]);

    interface Props {
        rows: T[];
        columns: ColDef<T>[];
        onfilter?: (data: T[]) => void;
        onsearch?: (search: string) => T[];
        layer?: number;
        gridOpts?: Omit<GridOptions<T>, 'rowData' | 'columnDefs'>;
        style?: string;
        classList?: string;
        filter?: boolean;
    }

    const { rows, columns, onfilter, layer, gridOpts, style, classList, onsearch, filter }: Props = $props();

    const layers = [
        '#18181b', '#1f1f23', '#25252a', '#2d2d33', '#373740', '#43434d'
    ];

    const runFilter = () => {
        if (!grid || !onfilter) return;
        const nodes: T[] = [];
        grid?.forEachNodeAfterFilterAndSort(node => {
            if (node.data) nodes.push(node.data);
        });
        onfilter(nodes);
    };

    export const search = (value: string) => {
        if (grid && onsearch) {
            grid.updateGridOptions({
                rowData: onsearch(value),
            });
        }
    };

	let grid: ReturnType<typeof createGrid<T>>;
    let target: HTMLDivElement;
    const render = () => {
        if (grid) grid.destroy();

        const darkTheme = themeQuartz.withParams({
			backgroundColor: layers[layer || 0],
			browserColorScheme: 'dark',
			chromeBackgroundColor: {
				ref: 'foregroundColor',
				mix: 0.07,
				onto: 'backgroundColor'
			},
			foregroundColor: '#FFF',
			headerFontSize: 14
		});

        grid = createGrid<T>(
            target,
            {
                rowData: rows,
                columnDefs: columns?.map(c => ({
                    ...c,
                    filter: filter ? true : c.filter,
                })),
                theme: darkTheme,
                ...gridOpts,
            }
        );
        grid.removeEventListener('filterChanged', runFilter);
        grid.addEventListener('filterChanged', runFilter);
    };

    $effect(() => {
        if (rows.length > -1) { // always render
            render();
        }
    });

    onMount(() => {
        render();
        return () => {
            grid.removeEventListener('filterChanged', runFilter);
            if (grid) grid.destroy();
        }
    });
</script>

<div class="table-container">
    {#if onsearch}
        <div class="table-search w-100 mb-3">
            <input type="text" name="" id="" placeholder="Search..." class="form-control" oninput={e => search(e.currentTarget.value)}>
        </div>
    {/if}
    <div class="grid-table">
        <div bind:this={target} class={classList} style={style}></div>
    </div>
</div>