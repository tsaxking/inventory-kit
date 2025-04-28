import { attemptAsync } from "ts-utils/check";
import fs from "fs/promises";
import path from "path";
import { render } from "html-constructor";
import puppeteer from 'puppeteer';

export namespace PDF {
    const cache = new Map<string, string>();

    const openHTML = (name: string) => {
        return attemptAsync(async () => {
            if (cache.has(name)) {
                return String(cache.get(name));
            }
            const filePath = path.resolve(process.cwd(), 'pdfs', `${name}.html`);
            console.log(filePath);
            const html = await fs.readFile(filePath, 'utf-8');
            cache.set(name, html);
            return html;
        });
    };

    export class Component {
        render() {
            return attemptAsync(async () => {
                return '';
            });
        }
    }

    export class Container extends Component {
        constructor(public readonly components: (Component | string)[]) {
            super();
        }

        render() {
            return attemptAsync(async () => {
                let str = '';
                for (const component of this.components) {
                    if (typeof component === 'string') {
                        str += component;
                    } else {
                        str += await component.render().unwrap();
                    }
                }
                return str;
            });
        }
    }

    export class Signatories extends Component {
        constructor(public readonly data: {
            ownerName: string;
            ownerTitle: string;
            clientName: string;
            clientTitle: string;
        }) {
            super();
        }


        render() {
            return attemptAsync(async () => {
                const template = await openHTML('components/signatories').unwrap();
                return render(template, this.data);
            });
        }
    }

    export class ItemList extends Component {
        constructor(public readonly data: {
            showDiscount: boolean;
            items: {
                description: string;
                unitPrice: string;
                quantity: string;
                subtotal: string;
                discount?: string;
            }[];
        }) {
            super();
        }

        render() {
            return attemptAsync(async () => {
                const template = await openHTML('components/item-list').unwrap();
                return render(template, {
                    ...this.data,
                    items: this.data.items.map(i => ({
                        ...i,
                        showDiscount: this.data.showDiscount,
                        discount: i.discount || '',
                    })),
                });
            });
        }
    }

    export class InvoiceTerms extends Component {
        constructor(public readonly data: {
            invoiceDate: string;
            ownerName: string;
            ownerTaxId: string;
            invoiceNumber: string | number;
        }) {
            super();
        }

        render() {
            return attemptAsync(async () => {
                const template = await openHTML('components/invoice-terms').unwrap();
                return render(template, this.data);
            });
        }
    }

    export class InvoiceTotals extends Component {
        constructor(public readonly data: {
            subtotalAmount: string;
            showDiscount: boolean;
            discountRate: string;
            discountAmount: string;
            taxRate: string;
            taxAmount: string;
            total: string;
        }) {
            super();
        }

        render() {
            return attemptAsync(async () => {
                const template = await openHTML('components/invoice-totals').unwrap();
                return render(template, this.data);
            });
        }
    }

    export class InvoiceQuoteTitle extends Component {
        constructor(public readonly data: {
            title: string;
            ownerName: string;
            ownerEmail: string;
            ownerPhone: string;
        }) {
            super();
        }

        render() {
            return attemptAsync(async () => {
                const template = await openHTML('components/title').unwrap();
                return render(template, this.data);
            });
        }
    }

    export class InvoiceQuoteDescription extends Component {
        constructor(public readonly data: {
            type: 'Invoice' | 'Quote';
            client: string;
            description: string;
            date: string;
            number: string | number;
        }) {
            super();
        }

        render() {
            return attemptAsync(async () => {
                const template = await openHTML('components/description').unwrap();
                return render(template, this.data);
            });
        }
    }

    export class Page {
        constructor(public readonly content: string | Component) {}
    }

    export class Template {
        constructor(public readonly name: string) {}

        public readonly pages: Page[] = [];

        addPage(content: string | Component) {
            this.pages.push(new Page(content));
            return this;
        }

        render() {
            return attemptAsync(async () => {
                const template = await openHTML('template').unwrap();
                return render(template, {
                    pages: await Promise.all(this.pages.map(async (p, i, a) => ({
                        page: {
                            content: p.content instanceof Component ? await p.content.render().unwrap() : p.content,
                            pageNumber: i + 1,
                            totalPages: a.length,
                        }
                    }))),
                }, {
                    root: path.resolve(process.cwd(), 'pdfs'),
                });
            });
        }

        save() {
            return attemptAsync(async () => {
                const html = await this.render().unwrap();
                const filePath = path.resolve(process.cwd(), 'static', 'uploads', `${this.name}.pdf`);

                const browser = await puppeteer.launch();
                const page = await browser.newPage();
                await page.setContent(html, { waitUntil: 'networkidle2' });
                const pdf = await page.pdf({
                    format: 'A4',
                    printBackground: true,
                });
                await browser.close();

                fs.writeFile(filePath, pdf);
            });
        }
    }


    export const LINE = `<div class="line"></div>`;
}