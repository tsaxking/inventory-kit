<script lang="ts">
	import { Inventory } from "$lib/model/inventory";
	import type { DataArr } from "drizzle-struct/front-end";
	import Grid from "../general/Grid.svelte";
	import { goto } from "$app/navigation";
	import { cost } from "ts-utils/text";

    interface Props {
        items: DataArr<typeof Inventory.BulkItem.data.structure | typeof Inventory.SerializedItem.data.structure | typeof Inventory.Group.data.structure>;
    }

    const { items }: Props = $props();
</script>

<Grid
    layer={1}
    rows={$items}
    columns={[
        {
            field: 'data.name',
            headerName: 'Name',
            editable: true,
            cellEditor: 'agTextCellEditor',
            cellEditorParams: {
                maxLength: 50,
            },
            cellRenderer: (data: any) => {
                return data.data?.data.name;
            },
            valueGetter: (params) => params.data?.data.name,
            valueSetter: (params) => {
                params.data?.update(d => ({
                    name: params.newValue
                }))
                return true;
            }
        },
        {
            field: 'data.description',
            headerName: 'Description',
            editable: true,
            cellEditor: 'agTextCellEditor',
            cellEditorParams: {
                maxLength: 200,
            },
            cellRenderer: (data: any) => {
                return data.data?.data.description;
            },
            valueGetter: (params) => params.data?.data.description,
            valueSetter: (params) => {
                params.data?.update(d => ({
                    description: params.newValue
                }))
                return true;
            }
        },
        {
            field: 'data.price',
            headerName: 'Price',
            editable: true,
            cellDataType: 'number',
            cellRenderer: (data: any) => {
                return cost(data.data?.data.price / 100);
            },
            valueGetter: (params) => Number(params.data?.data.price) / 100,
            valueSetter: (params) => {
                params.data?.update(d => ({
                    price: Math.round(Number(params.newValue) * 100)
                }))
                return true;
            },
            cellEditorParams: {
                step: 0.01,
                precision: 2,
            }
        },
        {
            field: 'data.status',
            headerName: 'Status',
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: Object.values(Inventory.ItemStatus).map(v => v.toUpperCase()),
            },
            cellRenderer: (data: any) => {
                return data.data?.data.status.toUpperCase();
            },
            valueGetter: (params: any) => params.data?.data.status.toUpperCase(),
            valueSetter: (params) => {
                params.data?.update(d => ({
                    status: params.newValue.toLowerCase()
                }))
                return true;
            },
            hide: items.struct.data.name === 'bulk_items',
        },
        {
            field: 'data.rentPrice',
            headerName: 'Rent Price',
            editable: true,
            cellRenderer: (data: any) => {
                return cost(data.data?.data.rentPrice / 100);
            },
            valueGetter: (params) => Number(params.data?.data.rentPrice) / 100,
            valueSetter: (params) => {
                params.data?.update(d => ({
                    rentPrice: Math.round(Number(params.newValue) * 100)
                }))
                return true;
            },
        },
        {
            headerName: 'View',
            cellRenderer: (row: any) => {
                return `<button class="btn btn-secondary" onclick="location.pathname = '/dashboard/inventory/${items.struct.data.name}/${row.data.data.id}'">View</button>`;
            },
        }
    ]}
    onsearch={(value) => $items.filter(i => i.data.name?.includes(value) || i.data.description?.includes(value))}
    style="width: 100%; height: 400px;"
    gridOpts={{
        headerHeight: 50,
        rowHeight: 50,
        pagination: true,
        paginationPageSize: 10,
    }}
    filter={true}
/>