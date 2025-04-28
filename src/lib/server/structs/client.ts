import { integer, text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';

export namespace Client {
	export const Organization = new Struct({
		name: 'organizations',
		structure: {
			name: text('name').notNull(),
			email: text('email').notNull(),
			phone: text('phone').notNull(),
			address: text('address').notNull(),
			city: text('city').notNull(),
			state: text('state').notNull(),
			zip: integer('zip').notNull(),
			country: text('country').notNull(),
			notes: text('notes').notNull()
		}
	});

	export const ClientContact = new Struct({
		name: 'client_contacts',
		structure: {
			clientId: text('client_id').notNull(),
			name: text('name').notNull(),
			email: text('email').notNull(),
			phone: text('phone').notNull(),
			address: text('address').notNull(),
			city: text('city').notNull(),
			state: text('state').notNull(),
			zip: integer('zip').notNull(),
			country: text('country').notNull(),
			notes: text('notes').notNull(),
			title: text('title').notNull(),
		}
	});
}

export const _client = Client.Organization.table;
export const _clientContact = Client.ClientContact.table;