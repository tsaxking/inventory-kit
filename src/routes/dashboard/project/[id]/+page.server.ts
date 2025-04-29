import { Rental } from '$lib/server/structs/rental.js';
import { fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
    const project = await Rental.Project.fromId(event.params.id).unwrap();
    if (!project) {
        throw fail(ServerCode.notFound, {
            message: 'Project not found',
        });
    }

    return {
        project: project.safe(),
    }
};