<script lang="ts">
	import { goto } from "$app/navigation";
    import { Inventory } from "$lib/model/inventory";
	import { alert, prompt } from "$lib/utils/prompts";
    import nav from '$lib/imports/main.js';
    nav();

    const { data } = $props();
    let another = $state(data.another);

    let name = $state('');
    let description = $state('');
    let manufacturer = $state('');
    let model = $state('');
    let price = $state(0);
    let boughtFor = $state(0);
    let rentable = $state(true);
    let rentPrice = $state(0);
    let quantity = $state(1);


    const save = async () => {
        if (!name) {
            alert('Please enter a name for this item.', {
                title: 'Error: Name Required',
            });
            return;
        }
        await Inventory.BulkItem.new({
            name,
            description,
            manufacturer,
            model,
            price: Math.round(price * 100), // Convert to cents
            boughtFor: Math.round(boughtFor * 100),
            rentable,
            rentPrice: Math.round(rentPrice * 100),
            image: '',
            customId: '',
            quantity,
            stock: quantity, // Number of items available to rent out
        });

        if (another) {
            goto('/dashboard/inventory/bulk_items/new?another=true');
        } else {
            goto('/dashboard/inventory');
        }
    };
</script>

<div class="container layer-1 pb-2">
    <div class="row mb-3">
        <div class="col">
            <h1>New Bulk Item</h1>
            <p class="text-muted">
                A Bulk Item is a type of inventory item that is sold in bulk or in large quantities. Unlike serialized items, bulk items do not have unique serial numbers or identifiers for each individual item. Instead, they are tracked as a single unit or group. This makes them ideal for items that are sold in large quantities, such as cables, connectors, or other consumables.
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
            <h3>Manufacturing Details</h3>
        </div>
        <div class="col-md-6 mb-3">
            <label for="manufacturer" class="form-label">Manufacturer</label>
            <input type="text" id="manufacturer" class="form-control" bind:value={manufacturer}>
        </div>
        <div class="col-md-6 mb-3">
            <label for="model" class="form-label">Model</label>
            <input type="text" id="model" class="form-control" bind:value={model}>
        </div>
        <div class="col-md-6 mb-3">
            <label for="quantity" class="form-label">Quantity</label>
            <input type="number" step={1} id="quantity" class="form-control" bind:value={quantity}>
        </div>
    </div>
    <hr>
    <div class="row mb-3">
        <div class="col-12">
            <h3>Purchase & Rental Info</h3>
        </div>
        <div class="col-md-6 mb-3">
            <label for="newCost" class="form-label">New Cost ($)</label>
            <input type="number" id="newCost" class="form-control" bind:value={price} min="0">
        </div>
        <div class="col-md-6 mb-3">
            <label for="boughtFor" class="form-label">Bought For ($)</label>
            <input type="number" id="boughtFor" class="form-control" bind:value={boughtFor} min="0">
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
            <button class="btn btn-primary w-100" onclick={save}>Save Item</button>
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
