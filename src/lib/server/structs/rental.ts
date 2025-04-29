import { integer, text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import { attemptAsync } from 'ts-utils/check';
import { Client } from './client';
import { cost } from 'ts-utils/text';
import { PDF } from '../utils/pdfs';
const { COMPANY_TAX_ID } = process.env;

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

	export enum ProjectItemType {
		SERIALIZED = 'serialized',
		BULK = 'bulk',
		GROUP = 'group',
		CUSTOM = 'custom'
	}

	export enum ProjectItemStatus {
		CONFIRMED = 'confirmed',
		PREPPED = 'prepped',
		ON_LOCATION = 'on_location',
		RETURNED = 'returned',
	}

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
			notes: text('notes').notNull()
		},
		validators: {
			status: (status) => typeof status === 'string' && Object.values(ProjectStatus).includes(status as ProjectStatus),
		}
	});

	export type ProjectData = typeof Project.sample;

	export const Quote = new Struct({
		name: 'quotes',
		structure: {
			projectId: text('project_id').notNull(),
			taxRate: integer('tax_rate').notNull(), // percentage
			discount: integer('discount').notNull(), // percentage
			dueDate: text('due_date').notNull(),
			date: text('date').notNull(),
		}
	});
	export type QuoteData = typeof Quote.sample;

	export const Invoice = new Struct({
		name: 'invoices',
		structure: {
			projectId: text('project_id').notNull(),
			taxRate: integer('tax_rate').notNull(), // percentage
			discount: integer('discount').notNull(), // percentage
			dueDate: text('due_date').notNull(),
			status: text('status').notNull(), // pending, paid, cancelled
		},
		validators: {
			status: (status) => typeof status === 'string' && Object.values(InvoiceStatus).includes(status as InvoiceStatus),
		}
	});
	export type InvoiceData = typeof Invoice.sample;


	export const ProjectItem = new Struct({
		name: 'project_items',
		structure: {
			projectId: text('project_id').notNull(),
			type: text('type').notNull(), // serialized, bulk, group, or custom
			itemId: text('item_id').notNull(), // reference to the item in the inventory, blank if custom
		
			// these will be populated from the item/group if it exists, they can be overridden without changing the original data
			// If overridden, the itemId will still be used to reference the item in the inventory
			// The user will have to manually check "custom" in the UI to remove the itemId reference
			name: text('name').notNull(),
			description: text('description').notNull(),
			rentPrice: integer('rent_price').notNull(),
			status: text('status').notNull(), // ProjectItemStatus
			// rent price is multiplied by quantity
			quantity: integer('quantity').notNull(), // if bulk or custom, otherwise 1
			discount: integer('discount').notNull(), // percentage - multiplies the rent price
		},
		validators: {
			type: (type) => typeof type === 'string' && Object.values(ProjectItemType).includes(type as ProjectItemType),
			status: (status) => typeof status === 'string' && Object.values(ProjectItemStatus).includes(status as ProjectItemStatus),
		}
	});

	export type ProjectItemData = typeof ProjectItem.sample;

	export const generateInvoice = (project: ProjectData, config: {
		showDiscount: boolean;
		ownerName: string;
		ownerTitle: string;
		ownerEmail: string;
		ownerPhone: string;
		taxRate: number;
	}) => {
		return attemptAsync(async () => {
			const invoices = await Invoice.all({ type: 'count' }).unwrap();
			const due = new Date();
			due.setDate(due.getDate() + 30); // 30 days from now
			const invoice = await Invoice.new({
				projectId: project.id,
				taxRate: config.taxRate,
				discount: config.showDiscount ? config.taxRate : 0,
				dueDate: due.toISOString(),
				status: InvoiceStatus.PENDING,
			}).unwrap();
			const client = await Client.Organization.fromId(project.data.clientId).unwrap();
			const contact = await Client.ClientContact.fromId(project.data.contactId).unwrap();
			if (!client || !contact) {
				throw new Error('Client or contact not found');
			}

			const template = new PDF.Template(invoice.id);

			const title = new PDF.InvoiceQuoteTitle({
				title: 'Invoice',
				ownerName: config.ownerName,
				ownerEmail: config.ownerEmail,
				ownerPhone: config.ownerPhone,
			});

			const description = new PDF.InvoiceQuoteDescription({
				type: 'Invoice',
				client: client.data.name,
				description: project.data.description,
				date: new Date().toLocaleDateString('en-US', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit'
				}),
				number: invoices + 1,
			});

			const items = await ProjectItem.fromProperty('projectId', project.id, { type: 'all' }).unwrap();
			const itemList = new PDF.ItemList({
				showDiscount: config.showDiscount,
				items: items.map(i => ({
					description: i.data.name,
					unitPrice: cost(i.data.rentPrice),
					quantity: i.data.quantity.toString(),
					subtotal: cost((i.data.rentPrice * i.data.quantity) * (config.showDiscount ? (1 - i.data.discount / 100) : 1)),
					discount: config.showDiscount ? cost(i.data.rentPrice * i.data.quantity * (i.data.discount / 100)) : '', // only show if discount is applied
				}))
			});
			const terms = new PDF.InvoiceTerms({
				invoiceDate: new Date().toLocaleDateString('en-US', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit'
				}),
				ownerName: config.ownerName,
				ownerTaxId: String(COMPANY_TAX_ID),
				invoiceNumber: invoices + 1,
			});


			const signatories = new PDF.Signatories({
				ownerName: config.ownerName,
				ownerTitle: config.ownerTitle,
				clientName: contact.data.name,
				clientTitle: client.data.name,
			});

			const subtotalAmount = items.reduce((acc, i) => {
				return acc + (i.data.rentPrice * i.data.quantity) * (config.showDiscount ? (1 - i.data.discount / 100) : 1);
			}, 0);
			const taxAmount = subtotalAmount * (config.taxRate / 100);
			const totalAmount = subtotalAmount + taxAmount;

			const totals = new PDF.InvoiceTotals({
				subtotalAmount: cost(subtotalAmount),
				taxRate: config.taxRate + '%',
				taxAmount: cost(taxAmount),
				total: cost(totalAmount),
				showDiscount: config.showDiscount,
				discountRate: config.showDiscount ? config.taxRate + '%' : '',
				discountAmount: config.showDiscount ? cost(subtotalAmount * (config.taxRate / 100)) : '',
			});

			template.addPage(new PDF.Container([
				title,
				description,
				itemList,
				totals,
				PDF.LINE,
				terms,
				signatories
			]));
			
			await template.save().unwrap();

			await project.update({
				status: ProjectStatus.INVOICED,
			}).unwrap();

			return invoice;
		});
	};

	export const generateQuote = (project: ProjectData, config: {
		showDiscount: boolean;
		ownerName: string;
		ownerTitle: string;
		ownerEmail: string;
		ownerPhone: string;
		taxRate: number;
	}) => {
		return attemptAsync(async () => {
			const quotes = await Quote.all({ type: 'count' }).unwrap();
			const due = new Date();
			due.setDate(due.getDate() + 30); // 30 days from now
			const quote = await Quote.new({
				projectId: project.id,
				taxRate: config.taxRate,
				discount: config.showDiscount ? config.taxRate : 0,
				dueDate: due.toISOString(),
				date: new Date().toLocaleDateString('en-US', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit'
				}),
			}).unwrap();
			const client = await Client.Organization.fromId(project.data.clientId).unwrap();
			const contact = await Client.ClientContact.fromId(project.data.contactId).unwrap();
			if (!client || !contact) {
				throw new Error('Client or contact not found');
			}

			const template = new PDF.Template(quote.id);

			const title = new PDF.InvoiceQuoteTitle({
				title: 'Quote',
				ownerName: config.ownerName,
				ownerEmail: config.ownerEmail,
				ownerPhone: config.ownerPhone,
			});

			const description = new PDF.InvoiceQuoteDescription({
				type: 'Quote',
				client: client.data.name,
				description: project.data.description,
				date: new Date().toLocaleDateString('en-US', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit'
				}),
				number: quotes + 1,
			});

			const items = await ProjectItem.fromProperty('projectId', project.id, { type: 'all' }).unwrap();
			const itemList = new PDF.ItemList({
				showDiscount: config.showDiscount,
				items: items.map(i => ({
					description: i.data.name,
					unitPrice: cost(i.data.rentPrice),
					quantity: i.data.quantity.toString(),
					subtotal: cost((i.data.rentPrice * i.data.quantity) * (config.showDiscount ? (1 - i.data.discount / 100) : 1)),
					discount: config.showDiscount ? cost(i.data.rentPrice * i.data.quantity * (i.data.discount / 100)) : '', // only show if discount
				}))
			});
			const subtotalAmount = items.reduce((acc, i) => {
				return acc + (i.data.rentPrice * i.data.quantity) * (config.showDiscount ? (1 - i.data.discount / 100) : 1);
			}
			, 0);	
			const taxAmount = subtotalAmount * (config.taxRate / 100);
			const totalAmount = subtotalAmount + taxAmount;
			const totals = new PDF.InvoiceTotals({
				subtotalAmount: cost(subtotalAmount),	
				taxRate: config.taxRate + '%',
				taxAmount: cost(taxAmount),
				total: cost(totalAmount),
				showDiscount: config.showDiscount,
				discountRate: config.showDiscount ? config.taxRate + '%' : '',
				discountAmount: config.showDiscount ? cost(subtotalAmount * (config.taxRate / 100)) : '',
			});
			template.addPage(new PDF.Container([
				title,
				description,
				itemList,
				totals,
				PDF.LINE,
			]));
			await template.save().unwrap();

			return quote;
		});
	};
}

export const _project = Rental.Project.table;
export const _projectItem = Rental.ProjectItem.table;
export const _quote = Rental.Quote.table;
export const _invoice = Rental.Invoice.table;