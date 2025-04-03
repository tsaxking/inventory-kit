import { integer, text } from "drizzle-orm/pg-core";
import { Struct } from "drizzle-struct/back-end";
import { attemptAsync } from "ts-utils/check";

export namespace Rental {
    export const Project = new Struct({
        name: 'projects',
        structure: {
            name: text('name').notNull(),
            description: text('description').notNull(),
            clientId: text('client_id').notNull(),
            contactId: text('contact_id').notNull(),

            startDate: text('start_date').notNull(),
            endDate: text('end_date').notNull(),
            planningStartDate: text('planning_start_date').notNull(),
            planningEndDate: text('planning_end_date').notNull(),
            status: text('status').notNull(), // planning, invoiced, paid, cancelled
            notes: text('notes').notNull(),
        },
    });

    export const Quote = new Struct({
        name: 'quotes',
        structure: {
            projectId: text('project_id').notNull(),
        },
    });
    export type QuoteData = typeof Quote.sample;

    export const Invoice = new Struct({
        name: 'invoices',
        structure: {
            projectId: text('project_id').notNull(),
        },
    });

    Quote.callListen('quote-to-invoice', async (quote) => {
        return {
            success: true,
        }
    });

    export const quoteToInvoice = (quote: QuoteData) => {
        return attemptAsync(async () => {
            const invoice = await Invoice.new({
                ...quote.data,
            }).unwrap();

            return invoice;
        });
    };

    export const QuoteItem = new Struct({
        name: 'quote_items',
        structure: {
            quoteId: text('quote_id').notNull(),
            // Can be an item, group, or custom
            itemId: text('item_id').notNull(),
            groupId: text('group_id').notNull(),
            // Name, description, and price are all pulled from itemId
            name: text('name').notNull(),
            description: text('description').notNull(),
            price: integer('price').notNull(), // pennies
            discount: integer('discount').notNull(), // percentage
            quantity: integer('quantity').notNull(),
        },
    });
};