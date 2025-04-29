import { boolean, integer } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import terminal from '../utils/terminal';
import { attemptAsync, resolveAll } from 'ts-utils/check';
import { DB } from '../db';
import { eq, not } from 'drizzle-orm';
import { Account } from './account';

export namespace Inventory {
	export enum ItemStatus {
		READY = 'ready',
		DAMAGED = 'damaged',
		LOST = 'lost',
		SOLD = 'sold',
		RENTED = 'rented',
	}

	// cables, small adapters, etc. Things that don't need to be serialized
	export const BulkItem = new Struct({
		name: 'bulk_items',
		structure: {
			customId: text('custom_id').notNull().unique(), // Custom ID for the item
			manufacturer: text('manufacturer').notNull(),
			model: text('model').notNull(),
			name: text('name').notNull(),
			description: text('description').notNull(),
			price: integer('price').notNull(), // pennies
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
			customId: text('custom_id').notNull(), // Custom ID for the item
			manufacturer: text('manufacturer').notNull(),
			model: text('model').notNull(),
			serial: text('serial').notNull(),
			name: text('name').notNull(),
			description: text('description').notNull(),
			price: integer('price').notNull(), // pennies
			boughtFor: integer('bought_for').notNull(), // pennies
			image: text('image').notNull(),
			rentable: boolean('rentable').notNull(),
			rentPrice: integer('rent_price').notNull(), // pennies
			status: text('status').notNull(),
		},
		validators: {
			status: (value) => Object.values(ItemStatus).includes(value as ItemStatus),
		}
	});

	SerializedItem.on('create', async (item) => {
		const rand = () => 'si:' + Math.floor(Math.random() * 1000000).toString();
		const doGet = async (id: string) => {
			const serialCustomId = await SerializedItem.fromProperty('customId', id, {
				type: 'all',
			}).unwrap();
			if (serialCustomId.length) return doGet(rand());
			return id;
		};

		const customId = await doGet(rand());
		await item.update({
			customId,
		}).unwrap();
	});

	SerializedItem.on('delete', (item) => {
		ItemGroup.fromProperty('itemId', item.id, {
			type: 'stream'
		}).pipe((ig) => ig.delete());
	});

	SerializedItem.queryListen('non-group', async (event) => {
		if (!event.locals.account || !await Account.isAdmin(event.locals.account).unwrap()) {
			throw new Error('Unauthorized');
		}
		
		return await getAllNonGroupItems().unwrap();
	});

	export const getAllNonGroupItems = () => {
		return attemptAsync(async () => {
			const groupItems = await ItemGroup.all({ type: 'all' }).unwrap();
			const items = await SerializedItem.all({ type: 'all' }).unwrap();
			return items.filter(i => {
				return !groupItems.some(ig => ig.data.itemId === i.id);
			});
		});
	}

	export const Group = new Struct({
		name: 'groups',
		structure: {
			customId: text('custom_id').notNull(),
			name: text('name').notNull(),
			description: text('description').notNull(),
			image: text('image').notNull(),
			price: integer('price').notNull(), // pennies
			rentable: boolean('rentable').notNull(),
			rentPrice: integer('rent_price').notNull(), // pennies
			status: text('status').notNull(),
		},
		validators: {
			status: (value) => Object.values(ItemStatus).includes(value as ItemStatus),
		}
	});

	export type GroupData = typeof Group.sample;

	Group.on('update', async ({ from , to }) => {
		if (from.status !== to.data.status) {
			const items = await itemsFromGroup(to).unwrap();
			resolveAll(await Promise.all(items.map(item => item.update({
				status: to.data.status,
			})))).unwrap();
		}
	});

	export const itemsFromGroup = (group: GroupData) => {
		return attemptAsync(async () => {
			const res = await DB.select()
				.from(SerializedItem.table)
				.innerJoin(ItemGroup.table, eq(ItemGroup.table.itemId, SerializedItem.table.id))
				.where(eq(ItemGroup.table.groupId, group.id));

			return res.map(i => SerializedItem.Generator(i.serialized_items));
		});
	}


	SerializedItem.on('create', async (item) => {
		const rand = () => 'gr:' + Math.floor(Math.random() * 1000000).toString();
		const doGet = async (id: string) => {
			const group = await Group.fromProperty('customId', id, {
				type: 'all',
			}).unwrap();
			if (group.length) return doGet(rand());
			return id;
		};

		const customId = await doGet(rand());
		await item.update({
			customId,
		}).unwrap();
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
			price: group.data.price + item.data.price
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
			price: group.data.price - item.data.price
		});
	});
}

export const _bulkItem = Inventory.BulkItem.table;
export const _serializedItem = Inventory.SerializedItem.table;
export const _group = Inventory.Group.table;
export const _itemGroup = Inventory.ItemGroup.table;