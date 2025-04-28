import { browser } from "$app/environment";
import { sse } from "$lib/utils/sse";
import { Struct } from "drizzle-struct/front-end";

export namespace Client {
    export const Organization = new Struct({
        name: 'organizations',
        structure: {
            name: 'string',
            email: 'string',
            phone: 'string',
            address: 'string',
            city: 'string',
            state: 'string',
            zip: 'number',
            country: 'string',
            notes: 'string',
        },
        socket: sse,
        browser: browser
    });

    export const Contact = new Struct({
        name: 'client_contacts',
        structure: {
            clientId: 'string',
            name: 'string',
            email: 'string',
            phone: 'string',
            address: 'string',
            city: 'string',
            state: 'string',
            zip: 'number',
            country: 'string',
            notes: 'string',
            title: 'string',
        },
        socket: sse,
        browser: browser
    });
}