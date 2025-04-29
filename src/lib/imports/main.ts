import { Navbar } from "$lib/model/navbar";

export default () => {
    for (const section of Navbar.getSections().data) {
        Navbar.removeSection(section);
    }

    Navbar.addSection({
        name: 'Main',
        priority: 0,
        links: [
            {
                name: 'Inventory',
                href: '/dashboard/inventory',
                icon: 'inventory_2',
                type: 'material-icons',
            },
            {
                name: 'Projects',
                href: '/dashboard/projects',
                icon: 'folder',
                type: 'material-icons',
            }
        ],
    });
};