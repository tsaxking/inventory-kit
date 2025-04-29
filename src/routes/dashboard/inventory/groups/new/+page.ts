export const load = (event) => {
    return {
        another: event.url.searchParams.get('another') === 'true',
    }
}