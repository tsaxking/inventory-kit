import { boolean, integer, text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import { attemptAsync } from 'ts-utils/check';
import { z } from 'zod';
import terminal from '../utils/terminal';
import pdf from 'html-pdf-node';
import { Client } from './client';
import { cost } from 'ts-utils/text';
import { Pdf } from '../utils/pdfs';
import { dateString } from 'ts-utils/clock';
import { COMPANY_NAME, COMPANY_EMAIL, COMPANY_PHONE, COMPANY_TAX_ID, COMPANY_TITLE } from '$env/static/private';

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
		}
	});

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

	Quote.on('delete', async (q) => {
		QuoteItem.fromProperty('quoteId', q.id, { type: 'stream' }).pipe((qi) => qi.delete());
	});

	export const Invoice = new Struct({
		name: 'invoices',
		structure: {
			projectId: text('project_id').notNull(),
			taxRate: integer('tax_rate').notNull(), // percentage
			discount: integer('discount').notNull(), // percentage
			dueDate: text('due_date').notNull(),
			date: text('date').notNull(),
		}
	});
	export type InvoiceData = typeof Invoice.sample;

	Invoice.on('delete', async (i) => {
		InvoiceItem.fromProperty('invoiceId', i.id, { type: 'stream' }).pipe((ii) => ii.delete());
	});

	Quote.callListen('quote-to-invoice', async (event, data) => {
		const parsed = z
			.object({
				quoteId: z.string()
			})
			.safeParse(data);
		if (!parsed.success) {
			terminal.error('Invalid data for quote-to-invoice', parsed.error);
			return {
				success: false,
				message: 'Invalid data'
			};
		}

		const quote = await Quote.fromId(parsed.data.quoteId).unwrap();
		if (!quote) {
			terminal.error('Quote not found', parsed.data.quoteId);
			return {
				success: false,
				message: 'Quote not found'
			};
		}

		await quoteToInvoice(quote).unwrap();

		return {
			success: true
		};
	});

	export const quoteToInvoice = (quote: QuoteData) => {
		return attemptAsync(async () => {
			const invoice = await Invoice.new(
				{
					...quote.data,
					created: new Date().toISOString(),
					updated: new Date().toISOString()
				},
				{
					overwriteGlobals: true
				}
			).unwrap();

			// Copy all items from quote to invoice
			await QuoteItem.fromProperty('quoteId', quote.id, {
				type: 'stream'
			}).pipe(async (item) => {
				await InvoiceItem.new({
					...item.data,
					invoiceId: invoice.id
				}).unwrap();
			});

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
			// Name, description, and price are all pulled from itemId, or custom
			name: text('name').notNull(),
			description: text('description').notNull(),
			price: integer('price').notNull(), // pennies
			discount: integer('discount').notNull(), // percentage
			quantity: integer('quantity').notNull()
		}
	});

	export const InvoiceItem = new Struct({
		name: 'invoice_items',
		structure: {
			invoiceId: text('invoice_id').notNull(),
			// Can be an item, group, or custom
			itemId: text('item_id').notNull(),
			groupId: text('group_id').notNull(),
			// Name, description, and price are all pulled from itemId, or custom
			name: text('name').notNull(),
			description: text('description').notNull(),
			price: integer('price').notNull(), // pennies
			discount: integer('discount').notNull(), // percentage
			quantity: integer('quantity').notNull()
		}
	});

	export const InvoicePdfs = new Struct({
		name: 'invoice_pdfs',
		structure: {
			invoiceId: text('invoice_id').notNull(),
			name: text('name').notNull(),
			type: text('type').notNull(), // invoice or quote
			status: text('status').notNull(), // pending, paid, cancelled
			opened: boolean('opened').notNull(), // if the pdf has been opened
		},
	});

	export const QuotePdfs = new Struct({
		name: 'quote_pdfs',
		structure: {
			quoteId: text('quote_id').notNull(),
			name: text('name').notNull(),
			type: text('type').notNull(), // invoice or quote
			status: text('status').notNull(), // pending, paid, cancelled
			opened: boolean('opened').notNull(), // if the pdf has been opened
		},
	});

	export const generateInvoicePdf = (invoice: InvoiceData) => {
		return attemptAsync(async () => {
			const numInvoices = (await InvoicePdfs.all({ type: 'count' })).unwrap();
			const project = await Project.fromId(invoice.data.projectId).unwrap();
			if (!project) {
				terminal.error('Project not found', invoice.data.projectId);
				throw new Error('Project not found');
			}

			const client = await Client.Client.fromId(project.data.clientId).unwrap();
			if (!client) {
				terminal.error('Client not found', project.data.clientId);
				throw new Error('Client not found');
			}
			const contact = await Client.ClientContact.fromId(project.data.contactId).unwrap();
			if (!contact) {
				terminal.error('Contact not found', project.data.contactId);
				throw new Error('Contact not found');
			}


			const items = await InvoiceItem.fromProperty('invoiceId', invoice.id, {
				type: 'stream',
			}).await().unwrap();

			const pdfItems = items.map(item => ({
				description: item.data.name,
				unitPrice: cost(item.data.price),
				quantity: item.data.quantity.toString(),
				discount: item.data.discount ? `${item.data.discount}%` : undefined,
				subtotal: cost(item.data.price * item.data.quantity * (1 - (item.data.discount / 100))),
			}));
			const subtotal = items.reduce((acc, item) => acc + item.data.price * item.data.quantity * (1 - (item.data.discount / 100)), 0);
			const discount = invoice.data.discount ? (subtotal * invoice.data.discount) / 100 : 0;
			const subtotalWithDiscount = subtotal - discount;
			const tax = (subtotalWithDiscount * invoice.data.taxRate) / 100;
			const total = subtotalWithDiscount + tax;

			const invoicePdf = await InvoicePdfs.new({
				invoiceId: invoice.id,
				name: `${project.data.name} - Invoice ${numInvoices + 1}`,
				type: 'invoice',
				opened: false,
				status: InvoiceStatus.PENDING,
			}).unwrap();


			const pdf = new Pdf(
				invoicePdf.id, 
				discount || items.filter(i => i.data.discount).length ? 'invoice-with-discount' : 'invoice-no-discount',
				{
					client: client.data.name,
					invoiceOrQuote: 'Invoice',
					invoiceNumber: numInvoices + 1,
					description: project.data.description,
					date: dateString('MM-DD-YYYY')(new Date(invoice.data.date)),
					dueDate: dateString('MM-DD-YYYY')(new Date(invoice.data.dueDate)),
					items: pdfItems,
					subtotalAmount: cost(subtotal),
					taxRate: `${invoice.data.taxRate}%`,
					taxAmount: cost(tax),
					total: cost(total),
					ownerName: COMPANY_NAME,
					ownerEmail: COMPANY_EMAIL,
					ownerPhone: COMPANY_PHONE,
					ownerTaxId: COMPANY_TAX_ID,
					ownerTitle: COMPANY_TITLE,
					clientTitle: contact.data.title,
					totalDiscount: discount ? cost(discount) : undefined,
				}
			);

			await pdf.save().unwrap();
			return pdf.filePath;
		});
	};

	export const generateQuotePdf = (quote: QuoteData) => {
		return attemptAsync(async () => {
			const numQuotes = (await QuotePdfs.all({ type: 'count' })).unwrap();
			const project = await Project.fromId(quote.data.projectId).unwrap();
			if (!project) {
				terminal.error('Project not found', quote.data.projectId);
				throw new Error('Project not found');
			}

			const client = await Client.Client.fromId(project.data.clientId).unwrap();
			if (!client) {
				terminal.error('Client not found', project.data.clientId);
				throw new Error('Client not found');
			}
			const contact = await Client.ClientContact.fromId(project.data.contactId).unwrap();
			if (!contact) {
				terminal.error('Contact not found', project.data.contactId);
				throw new Error('Contact not found');
			}
			const items = await QuoteItem.fromProperty('quoteId', quote.id, {
				type: 'stream',
			}).await().unwrap();
			const pdfItems = items.map(item => ({
				description: item.data.name,
				unitPrice: cost(item.data.price),
				quantity: item.data.quantity.toString(),
				discount: item.data.discount ? `${item.data.discount}%` : undefined,
				subtotal: cost(item.data.price * item.data.quantity * (1 - (item.data.discount / 100))),
			}));
			const subtotal = items.reduce((acc, item) => acc + item.data.price * item.data.quantity * (1 - (item.data.discount / 100)), 0);
			const discount = quote.data.discount ? (subtotal * quote.data.discount) / 100 : 0;
			const subtotalWithDiscount = subtotal - discount;
			const tax = (subtotalWithDiscount * quote.data.taxRate) / 100;
			const total = subtotalWithDiscount + tax;
			const quotePdf = await QuotePdfs.new({
				quoteId: quote.id,
				name: `${project.data.name} - Quote ${numQuotes + 1}`,
				type: 'quote',
				opened: false,
				status: InvoiceStatus.PENDING,
			}).unwrap();
			const pdf = new Pdf(
				quotePdf.id,
				discount || items.filter(i => i.data.discount).length ? 'invoice-with-discount' : 'invoice-no-discount',
				{
					client: client.data.name,
					invoiceOrQuote: 'Quote',
					invoiceNumber: numQuotes + 1,
					description: project.data.description,
					date: dateString('MM-DD-YYYY')(new Date(quote.data.date)),
					dueDate: dateString('MM-DD-YYYY')(new Date(quote.data.dueDate)),
					items: pdfItems,
					subtotalAmount: cost(subtotal),
					taxRate: `${quote.data.taxRate}%`,
					taxAmount: cost(tax),
					total: cost(total),
					ownerName: COMPANY_NAME,
					ownerEmail: COMPANY_EMAIL,
					ownerPhone: COMPANY_PHONE,
					ownerTaxId: COMPANY_TAX_ID,
					ownerTitle: COMPANY_TITLE,
					clientTitle: contact.data.title,	
					totalDiscount: discount ? cost(discount) : undefined,
				}
			);
			await pdf.save().unwrap();
			return pdf.filePath;
		});
	};
}


export const _project = Rental.Project.table;
export const _quote = Rental.Quote.table;
export const _invoice = Rental.Invoice.table;
export const _quoteItem = Rental.QuoteItem.table;
export const _invoiceItem = Rental.InvoiceItem.table;
export const _invoicePdfs = Rental.InvoicePdfs.table;
export const _quotePdfs = Rental.QuotePdfs.table;