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
    let serial = $state('');
    let price = $state(0);
    let boughtFor = $state(0);
    let rentable = $state(true);
    let rentPrice = $state(0);

    const save = async () => {
        if (!name) {
            alert('Please enter a name for this item.', {
                title: 'Error: Name Required',
            });
            return;
        }
        const res = await Inventory.SerializedItem.new({
            name,
            description,
            manufacturer,
            model,
            serial,
            price: Math.round(price * 100), // Convert to cents
            boughtFor: Math.round(boughtFor * 100),
            rentable,
            rentPrice: Math.round(rentPrice * 100),
            status: Inventory.ItemStatus.READY,
            image: '',
            customId: '',
        });

        if (another) {
            goto('/dashboard/inventory/groups/new?another=true');
        } else {
            goto('/dashboard/inventory');
        }
    };
</script>

<div class="container layer-1 pb-2">
    <div class="row mb-3">
        <div class="col">
            <h1>New Serialized Item</h1>
            <p class="text-muted">
                A serialized item is a unique item that is tracked individually. Unlike a bulk item, a serialized item has a unique serial number or identifier. This allows for better tracking and management of individual items in your inventory.
                Serialized items are typically used for high-value items or items that require individual tracking, such as consoles, computers, or rack-items.
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
            <label for="serial" class="form-label">Serial Number</label>
            <input type="text" id="serial" class="form-control" bind:value={serial}>
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
