/**
 * Helper function to take an async generator of page arrays and return a single array.
 * @param generatorFunction The async generator function that yields pages of items that you wish to combine.
 * @param args The arguments to pass to the generator function.
 * @returns A promise that resolves to a single array containing all items from all pages.
 */
export async function asyncPageGeneratorToArray<T, Args extends unknown[]>(
    generatorFunction: (...args: Args) => AsyncGenerator<T[]>,
    ...args: Args
): Promise<T[]> {
    const pages: T[][] = [];
    for await (const page of generatorFunction(...args)) {
        pages.push(page);
    }
    return pages.flat();
}
