import { attemptAsync } from "ts-utils/check";
import fs from "fs/promises";
import path from "path";
import { render } from "html-constructor";
import puppeteer from 'puppeteer';
import terminal from "./terminal";

class PdfError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PdfError';
        terminal.error('PdfError:', message);
    }
}

export type PdfConstructors = {
    'invoice-no-discount': {
        invoiceOrQuote: 'Invoice' | 'Quote';
        ownerName: string;
        ownerEmail: string;
        ownerPhone: string;
        client: string;
        invoiceNumber: number;
        description: string;
        date: string;
        dueDate: string;
        items: {
            description?: string;
            unitPrice?: string;
            quantity?: string;
            subtotal?: string;
        }[];
        subtotalAmount: string;
        taxRate: string;
        taxAmount: string;
        total: string;
        ownerTaxId: string;
        clientTitle: string;
        ownerTitle: string;
    };
    'invoice-with-discount': {
        invoiceOrQuote: 'Invoice' | 'Quote';
        ownerName: string;
        ownerEmail: string;
        ownerPhone: string;
        client: string;
        invoiceNumber: number;
        description: string;
        date: string;
        dueDate: string;
        items: {
            description?: string;
            unitPrice?: string;
            quantity?: string;
            subtotal?: string;
            discount?: string;
        }[];
        subtotalAmount: string;
        taxRate: string;
        taxAmount: string;
        total: string;
        ownerTaxId: string;
        clientTitle: string;
        ownerTitle: string;
        totalDiscount: string;
    };
};

const filename = (name: string) => path.resolve(process.cwd(), 'static', 'uploads', `${name}.pdf`);

export class Pdf<T extends keyof PdfConstructors> {
    public static open(name: string) {
        return attemptAsync(() => fs.readFile(filename(name)));
    }

    constructor(public readonly name: string, public readonly doc: T, public readonly data: PdfConstructors[T]) {}

    private __generated: Uint8Array<ArrayBufferLike> | null = null;
    generate() {
        return attemptAsync(async () => {
            if (this.__generated) {
                return this.__generated;
            }
            const html = await fs.readFile(path.resolve(process.cwd(), 'pdfs', `${this.doc}.html`), 'utf-8');
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(render(html, this.data), { waitUntil: 'networkidle2' });
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true
            });
            await browser.close();
            this.__generated = pdf;
            return pdf;
        });
    }

    save() {
        return attemptAsync(async () => {
            const pdf = await this.generate();
            if (pdf.isErr()) throw new PdfError(pdf.error.message);
            await fs.writeFile(this.filePath, pdf.value);
            return pdf;
        });
    }

    get filePath() {
        return filename(this.name);
    }
}