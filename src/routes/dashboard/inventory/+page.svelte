<script lang="ts">
	import { goto } from "$app/navigation";
	import Grid from "$lib/components/general/Grid.svelte";
	import InventoryGrid from "$lib/components/inventory/InventoryGrid.svelte";
    import { Inventory } from "$lib/model/inventory";
	import { prompt } from "$lib/utils/prompts";
	import { DataArr } from "drizzle-struct/front-end";
	import { onMount } from "svelte";
    import nav from '$lib/imports/main.js';
    nav();

    let bulkItems = $state(new DataArr(Inventory.BulkItem, []));
    let serializedItems = $state(new DataArr(Inventory.SerializedItem, []));
    let groups = $state(new DataArr(Inventory.Group, []));

    onMount(() => {
        bulkItems = Inventory.BulkItem.all(false);
        serializedItems = Inventory.SerializedItem.all(false);
        groups = Inventory.Group.all(false);
    });
</script>

<div class="container layer-1">
    <div class="row mb-3">
        <div class="col">
            <h1>Inventory</h1>
        </div>
    </div>
    <div class="row mb-3">
        <div class="col">
            <div class="d-flex justify-content-between align-items-center">
            <h3>Bulk Items</h3>
            <button type="button" class="btn btn-secondary" onclick={() => goto('/dashboard/inventory/bulk_items/new')}>
                <i class="material-icons">add</i>
            </button>
        </div>
        </div>
    </div>
    <div class="row mb-3">
        <div class="col">
            <InventoryGrid 
                items={bulkItems as any}
            />
        </div>
    </div>
    <hr>
    <div class="row mb-3">
        <div class="d-flex justify-content-between align-items-center">
            <h3>Serialized Items</h3>
            <button type="button" class="btn btn-secondary" onclick={() => goto('/dashboard/inventory/serialized_items/new')}>
                <i class="material-icons">add</i>
            </button>
        </div>
    </div>
    <div class="row mb-3">
        <div class="col">
            <InventoryGrid 
                items={serializedItems as any}
            />
        </div>
    </div>
    <hr>
    <div class="row mb-3">
        <div class="d-flex justify-content-between align-items-center">
            <h3>Groups</h3>
            <button type="button" class="btn btn-secondary" onclick={() => goto('/dashboard/inventory/groups/new')}>
                <i class="material-icons">add</i>
            </button>
        </div>
    </div>
    <div class="row mb-3">
        <div class="col">
            <InventoryGrid 
                items={groups as any}
            />
        </div>
    </div>
</div>