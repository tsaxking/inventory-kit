<script lang="ts">
	import { goto } from "$app/navigation";
    import { Inventory } from "$lib/model/inventory";
	import { alert, prompt } from "$lib/utils/prompts";
	import { DataArr } from "drizzle-struct/front-end";
    import { onMount } from "svelte";
    import nav from '$lib/imports/main.js';
    nav();
    
    const { data } = $props();
    let another = $state(data.another);

    let name = $state('');
    let description = $state('');
    let rentable = $state(true);
    let rentPrice = $state(0);

    let nonGroupItems = $state(new DataArr(Inventory.SerializedItem, []));

    const save = async () => {
        if (!name) {
            alert('Please enter a name for this item.', {
                title: 'Error: Name Required',
            });
            return;
        }
        const res = await Inventory.Group.new({
            name,
            description,
            rentable,
            rentPrice: Math.round(rentPrice * 100),
            status: Inventory.ItemStatus.READY,
            image: '',
            customId: '',
            price: 0,
        });

        if (another) {
            goto('/dashboard/inventory/groups/new?another=true');
        } else {
            goto('/dashboard/inventory');
        }
    };

    onMount(() => {
        nonGroupItems = Inventory.getAllNonGroupItems();
        return nonGroupItems.subscribe(console.log);
    });
</script>

<div class="container layer-1 pb-2">
    <div class="row mb-3">
        <div class="col">
            <h1>New Group</h1>
            <p class="text-muted">
                A Group is a collection of serialized items that are tracked together. When a group is prepped for a project, all its items are also prepped. This is useful for items that are used together, such as a set of cables or a rack of equipment. Groups can also be used to track items that are rented out together, such as a console and its accessories.
            </p>
        </div>
    </div>

    <div class="row mb-3">
        <div class="col-12">
            <h3>Item Details</h3>
        </div>
        <div class="col-md-6 mb-3">
            <label for="name" class="form-label">Item Name</label>
            <input type="text" id="name" class="form-control" bind:value={name}>
        </div>
        <div class="col-md-6 mb-3">
            <label for="description" class="form-label">Description</label>
            <input type="text" id="description" class="form-control" bind:value={description}>
        </div>
    </div>
    <hr>
    <div class="row mb-3">
        <div class="col-12">
            <h3>Purchase & Rental Info</h3>
        </div>
        <div class="col-md-6 mb-3">
            <div class="form-check mb-3">
                <input class="btn-check" type="checkbox" id="rentable" bind:checked={rentable}>
                <label class="btn btn-outline-primary" for="rentable">
                    Rentable
                </label>
            </div>
        </div>
        {#if rentable}
            <div class="col-md-6 mb-3">
                <label for="rentPrice" class="form-label">Rental Price ($)</label>
                <input type="number" id="rentPrice" class="form-control" bind:value={rentPrice} min="0">
            </div>
        {/if}
    </div>

    <div class="row mb-3">
        <div class="col-9">
            <button class="btn btn-primary w-100" onclick={save}>Save Group</button>
        </div>
        <div class="col-3">
            <div class="form-check mb-3">
                <input class="btn-check" type="checkbox" id="another" bind:checked={another}>
                <label class="btn btn-outline-primary" for="another">
                    Add Another
                </label>
            </div>
        </div>
    </div>
</div>
