import { Pdf } from '../src/lib/server/utils/pdfs';


export default async () => {
	const pdf = new Pdf('test', 'invoice-no-discount', {
		invoiceOrQuote: 'Invoice',
		invoiceNumber: 123,
		client: 'John Doe',
		description: 'Test Invoice',
		date: '2023-10-01',
		dueDate: '2023-10-15',
		items: [
			{
				description: 'Item 1',
				unitPrice: '$100.00',
				quantity: '2',
				subtotal: '$200.00'
			},
			{
				description: 'Item 2',
				unitPrice: '$50.00',
				quantity: '1',
				subtotal: '$50.00'
			}
		],
		subtotalAmount: '$250.00',
		taxRate: '10%',
		taxAmount: '$25.00',
		total: '$275.00',
		ownerName: 'Your Company',
		ownerEmail: 'taylor@yourcompany.com',
		ownerPhone: '123-456-7890',
		ownerTaxId: '123-45-6789',
		clientTitle: 'Client Title',
		ownerTitle: 'Owner Title'
	});

	await pdf.save().unwrap();
};
