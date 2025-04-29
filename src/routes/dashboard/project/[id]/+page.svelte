<script lang="ts">
    import nav from "$lib/imports/main";
    import { Rental } from "$lib/model/rental";
	import { DataArr } from "drizzle-struct/front-end";
	import { onMount } from "svelte";
    import Grid from "$lib/components/general/Grid.svelte";
    nav();

    const { data } = $props();
    const project = Rental.Project.Generator(data.project);
    let projectItems = new DataArr(Rental.ProjectItem, []);

    onMount(() => {
        projectItems = Rental.ProjectItem.fromProperty('projectId',String(project.data.id), false);
    });
</script>

<div class="container layer-1">
    <div class="row mb-3">
        <input 
            type="text" 
            name="" 
            id="" 
            class="h1 form-control" 
            value={$project.name}
            onchange={e => project.update(p => ({...p, name: e.currentTarget.value}))}
        >
        <input type="text" name="" id="" class="h6 form-control" value={$project.description} 
            onchange={e => project.update(p => ({...p, description: e.currentTarget.value}))}
        >
    </div>
    <hr>
    <div class="row mb-3">
        <div class="col">
            <Grid
            rows={$projectItems}
            columns={[
                {
                    field: 'data.name',
                    headerName: 'Item Name',
                },
                {
                    field: 'data.description',
                    headerName: 'Description',
                },
                {
                    field: 'data.discount',
                    headerName: 'Discount',
                },
                {
                    field: 'data.rentPrice',
                    headerName: 'Rent Price',
                },
                {
                    field: 'data.quantity',
                    headerName: 'Quantity',
                },
                {
                    field: 'data.status',
                    headerName: 'Status',
                }
            ]}
            layer={2}
            gridOpts={{
                'rowHeight': 50,
                'headerHeight': 50,
                'paginationPageSize': 10,
                'pagination': true,
            }}
            style="height: 400px; width: 100%;"
            onsearch={(value) => $projectItems.filter((p) => {
                return p.data.name?.toLowerCase().includes(value.toLowerCase()) || 
                    p.data.description?.toLowerCase().includes(value.toLowerCase());
            })}
            filter={true}
        />
        </div>
    </div>
    <div class="row mb-3">
        <div class="col">
            <button type="button" class="btn btn-primary w-100">
                <i class="material-icons">add</i>
                Add Item
            </button>
        </div>
    </div>
</div>