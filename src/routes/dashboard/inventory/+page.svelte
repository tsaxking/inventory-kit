<script lang="ts">
    import { Inventory } from "$lib/model/inventory";
	import { prompt } from "$lib/utils/prompts";
	import { DataArr } from "drizzle-struct/front-end";
	import { onMount } from "svelte";

    let items = $state(new DataArr(Inventory.BulkItem, []));

    onMount(() => {
        items = Inventory.BulkItem.all(false);
    });
</script>

