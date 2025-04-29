import { browser } from '$app/environment';
import { sse } from '$lib/utils/sse';
import { Struct } from 'drizzle-struct/front-end';

export namespace Rental {
    export enum ProjectStatus {
        CONCEPT = 'concept',
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

    export const ProjectItem = new Struct({
        name: 'project_items',
        structure: {
            projectId: 'string',
            type: 'string',
            itemId: 'string',
            name: 'string',
            description: 'string',
            rentPrice: 'number',
            status: 'string',
            quantity: 'number',
            discount: 'number',
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
}