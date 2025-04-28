import { browser } from '$app/environment';
import { sse } from '$lib/utils/sse';
import { Struct } from 'drizzle-struct/front-end';

export namespace Rental {
    export enum ProjectStatus {
		PLANNING = 'planning',
		CONFIRMED = 'confirmed',
		INVOICED = 'invoiced',
		PAID = 'paid',
		CANCELLED = 'cancelled'
	}

	export enum InvoiceStatus {
		PENDING = 'pending',
		PAID = 'paid',
		CANCELLED = 'cancelled'
	}


    export const Project = new Struct({
        name: 'projects',
        structure: {
            name: 'string',
            description: 'string',
            clientId: 'string',
            contactId: 'string',

            startDate: 'string',
            endDate: 'string',
            planningStartDate: 'string',
            planningEndDate: 'string',
            status: 'string', // ProjectStatus
            notes: 'string',
        },
        socket: sse,
        browser: browser,
    });

    export const Quote = new Struct({
        name: 'quotes',
        structure: {
            projectId: 'string',
            taxRate: 'number',
            discount: 'number',
            dueDate: 'string',
            date: 'string',
        },
        socket: sse,
        browser: browser,
    });

    export const Invoice = new Struct({
        name: 'invoices',
        structure: {
            projectId: 'string',
            taxRate: 'number',
            discount: 'number',
            dueDate: 'string',
            date: 'string',
            status: 'string', // InvoiceStatus
        },
        socket: sse,
        browser: browser,
    });

    export const QuoteItem = new Struct({
        name: 'quote_items',
        structure: {
            quoteId: 'string',
            itemId: 'string',
            groupId: 'string',
            name: 'string',
            description: 'string',
            price: 'number',
            discount: 'number',
            quantity: 'number',
        },
        socket: sse,
        browser: browser,
    });

    export const InvoiceItem = new Struct({
        name: 'invoice_items',
        structure: {
            invoiceId: 'string',
            itemId: 'string',
            groupId: 'string',
            name: 'string',
            description: 'string',
            price: 'number',
            discount: 'number',
            quantity: 'number',
        },
        socket: sse,
        browser: browser,
    });

    export const InvoicePdfs = new Struct({
        name: 'invoice_pdfs',
        structure: {
            invoiceId: 'string',
            name: 'string',
            status: 'string', // InvoiceStatus
            opened: 'boolean',
        },
        socket: sse,
        browser: browser,
    });

    export const ProjectPdfs = new Struct({
        name: 'project_pdfs',
        structure: {
            projectId: 'string',
            name: 'string',
            status: 'string', // ProjectStatus
            opened: 'boolean',
        },
        socket: sse,
        browser: browser,
    });
}