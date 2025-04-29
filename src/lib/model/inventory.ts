import { browser } from "$app/environment";
import { sse } from "$lib/utils/sse";
import { DataArr, Struct } from "drizzle-struct/front-end";

export namespace Inventory {
    export enum ItemStatus {
		READY = 'ready',
		DAMAGED = 'damaged',
		LOST = 'lost',
		SOLD = 'sold',
		RENTED = 'rented',
	}

    export const BulkItem = new Struct({
        name: 'bulk_items',
        structure: {
            customId: 'string',
            manufacturer: 'string',
            model: 'string',
            name: 'string',
            description: 'string',
            price: 'number',
            boughtFor: 'number',
            image: 'string',
            rentable: 'boolean',
            rentPrice: 'number',
            quantity: 'number',
            stock: 'number',
        },
        socket: sse,
        browser: browser,
        // log: true,
    });

    export const SerializedItem = new Struct({
        name: 'serialized_items',
        structure: {
            status: 'string',
            customId: 'string',
            manufacturer: 'string',
            model: 'string',
            serial: 'string',
            name: 'string',
            description: 'string',
            price: 'number',
            boughtFor: 'number',
            image: 'string',
            rentable: 'boolean',
            rentPrice: 'number',
        },
        socket: sse,
        browser: browser,
    });

    export const Group = new Struct({
        name: 'groups',
        structure: {
            customId: 'string',
            name: 'string',
            description: 'string',
            image: 'string',
            price: 'number',
            rentable: 'boolean',
            rentPrice: 'number',
            status: 'string',
        },
        socket: sse,
        browser: browser,
    });

    export const ItemGroup = new Struct({
        name: 'item_groups',
        structure: {
            itemId: 'string',
            groupId: 'string',
        },
        socket: sse,
        browser: browser,
    });

    export const getAllNonGroupItems = () => SerializedItem.query('non-group', {}, {
        asStream: false,
        satisfies: () => false,
    });
}