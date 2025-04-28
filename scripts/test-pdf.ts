// import { Pdf } from '../src/lib/server/utils/pdfs';
import { PDF } from '../src/lib/server/utils/pdfs';


export default async () => {
	console.log('Testing PDF generation...');
	// const pdf = new Pdf('test', 'invoice-no-discount', {
	// 	invoiceOrQuote: 'Invoice',
	// 	invoiceNumber: 123,
	// 	client: 'John Doe',
	// 	description: 'Test Invoice',
	// 	date: '2023-10-01',
	// 	dueDate: '2023-10-15',
	// 	items: [
	// 		{
	// 			description: 'Item 1',
	// 			unitPrice: '$100.00',
	// 			quantity: '2',
	// 			subtotal: '$200.00'
	// 		},
	// 		{
	// 			description: 'Item 2',
	// 			unitPrice: '$50.00',
	// 			quantity: '1',
	// 			subtotal: '$50.00'
	// 		}
	// 	],
	// 	subtotalAmount: '$250.00',
	// 	taxRate: '10%',
	// 	taxAmount: '$25.00',
	// 	total: '$275.00',
	// 	ownerName: 'Your Company',
	// 	ownerEmail: 'taylor@yourcompany.com',
	// 	ownerPhone: '123-456-7890',
	// 	ownerTaxId: '123-45-6789',
	// 	clientTitle: 'Client Title',
	// 	ownerTitle: 'Owner Title'
	// });

	// await pdf.save().unwrap();


	const t = new PDF.Template('Hello World');
	t.addPage(new PDF.Container([
		new PDF.InvoiceTerms({
			invoiceDate: '2023-10-01',
			ownerName: 'Taylor King',
			ownerTaxId: '123-45-6789',
			invoiceNumber: 123,
		}),
		new PDF.ItemList({
			showDiscount: false,
			items: [
				{
					description: 'Item 1',
					unitPrice: '$100.00',
					quantity: '2',
					subtotal: '$180.00',
					discount: '$20.00'
				},
				{
					description: 'Item 2',
					unitPrice: '$50.00',
					quantity: '1',
					subtotal: '$50.00'
				}
			]
		}),
		new PDF.Signatories({
			ownerName: 'Taylor King',
			ownerTitle: 'sfzMusic Owner',
			clientName: 'John Doe',
			clientTitle: 'Client'
		}),
	]));
	console.log(await t.save().unwrap());
};
