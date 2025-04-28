import { boolean, integer } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import terminal from '../utils/terminal';

export namespace Inventory {
	// cables, small adapters, etc. Things that don't need to be serialized
	export const BulkItem = new Struct({
		name: 'bulk_items',
		structure: {
			name: text('name').notNull(),
			description: text('description').notNull(),
			newCost: integer('price').notNull(), // pennies
			boughtFor: integer('bought_for').notNull(), // pennies
			image: text('image').notNull(),
			rentable: boolean('rentable').notNull(),
			rentPrice: integer('rent_price').notNull(), // pennies
			quantity: integer('quantity').notNull(),
			stock: integer('stock').notNull() // Current stock, not including anything rented out
		}
	});

	// Consoles, speakers, amplifiers, etc.
	export const SerializedItem = new Struct({
		name: 'serialized_items',
		structure: {
			serial: text('serial').notNull().unique(), // generated serial number
			name: text('name').notNull(),
			description: text('description').notNull(),
			newCost: integer('price').notNull(), // pennies
			boughtFor: integer('bought_for').notNull(), // pennies
			image: text('image').notNull(),
			rentable: boolean('rentable').notNull(),
			rentPrice: integer('rent_price').notNull() // pennies
		}
	});

	SerializedItem.on('create', async (item) => {
		if (item.data.serial) {
			const items = (
				await SerializedItem.fromProperty('serial', item.data.serial, {
					type: 'count'
				})
			).unwrap();
			if (items > 1) {
				item.update({
					serial: `${item.data.serial}-${items}`
				});
				return;
			}
		}
	});

	SerializedItem.on('delete', (item) => {
		ItemGroup.fromProperty('itemId', item.id, {
			type: 'stream'
		}).pipe((ig) => ig.delete());
	});

	export const Group = new Struct({
		name: 'groups',
		structure: {
			name: text('name').notNull(),
			description: text('description').notNull(),
			image: text('image').notNull(),
			price: integer('price').notNull(), // pennies
			rentable: boolean('rentable').notNull(),
			quantity: integer('quantity').notNull(), // TODO: There should be an error state if this exceeds the sum of the items in the group
			rentPrice: integer('rent_price').notNull() // pennies
		}
	});

	export const ItemGroup = new Struct({
		name: 'item_groups',
		structure: {
			itemId: text('item_id').notNull(), // only serialized items
			groupId: text('group_id').notNull()
		}
	});

	ItemGroup.on('create', async (ig) => {
		const group = await Group.fromId(ig.data.groupId).unwrap();
		if (!group) {
			return terminal.error('Group not found');
		}

		const item = await SerializedItem.fromId(ig.data.itemId).unwrap();
		if (!item) {
			return terminal.error('Item not found');
		}

		group.update({
			price: group.data.price + item.data.newCost
		});
	});

	ItemGroup.on('delete', async (ig) => {
		const group = await Group.fromId(ig.data.groupId).unwrap();
		if (!group) {
			return terminal.error('Group not found');
		}

		const item = await SerializedItem.fromId(ig.data.itemId).unwrap();
		if (!item) {
			return terminal.error('Item not found');
		}

		group.update({
			price: group.data.price - item.data.newCost
		});
	});
}

export const _bulkItem = Inventory.BulkItem.table;
export const _serializedItem = Inventory.SerializedItem.table;
export const _group = Inventory.Group.table;
export const _itemGroup = Inventory.ItemGroup.table;