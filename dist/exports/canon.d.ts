import { Possible } from "../types/utils";
/**
 * A fallible Canonizer for mapping objects to primitive versions to allow comparison by value.
 * Most primitives are mapped to themselves.
 * Strings are mapped to `"String: " + ` themselves to avoid collisions with the stringifications of other entities.
 * Arrays and objects are mapped to a stringification that digs into objects to a level defined by `maxDepth`, or 2 if `maxDepth` is not provided.
 * Dates are mapped to `"Date: "` plus their numeric value as milliseconds from epoch.
 *
 * @param {K} lookup The key to canonize.
 * @param {number} maxDepth? The maximum number of levels to descend into nested objects and arrays when stringifying.
 * @returns A canonized version of the lookup. Not necessarily a string but guaranteed to be a primitive.
 */
export declare function naiveCanonize<K>(lookup: K, maxDepth?: number): string | null | undefined | number | boolean;
/**
 * Canonize using `JSON.stringify()`.
 *
 * @remarks
 * This canonization algorithm works better than the naïve one for nested objects, but it is subject to all the gotchas of JSON, e.g.:
 * - `undefined` mapped to `null` when it appears in arrays, not mapped at all when it appears in an object
 * - `NaN` mapped to `null`
 * - Fails on circular references
 *
 * @param  {K} lookup The key to canonize.
 * @returns A canonized version of the lookup. Not necessarily a string but guaranteed to be a primitive.
 */
export declare function jsonCanonize<K>(lookup: K): string;
/**
 * Function that converts input keys, which may be complex objects that can usually only be compared by equality of reference, to primitive types that can be compared by equality of value.
 * Depending on user needs, some inputs may remain as reference-comparable objects, hence the lack of restriction on the output type.
 */
declare type Canonizer<C, K> = (lookup: K) => C;
/**
 * Map with canonized keys.
 * By instantiating a Map with a canonizer function, we can execute lookups according to an arbitrary notion of key identity.
 * For example, we can use arrays as Map indices and treat arrays with the same members as equivalent.
 *
 * @remarks
 * In use cases that call for Maps, developers will often want to map by some combination of values instead of a single value.
 * If they use an object or array for this, however, lookups won't work because objects or arrays are compared by reference rather than value.
 * The solution is to initialize the map with a "canonizer" that, for any key, creates a canonical equivalent that other referentially unique objects and arrays can map to.
 *
 * This gives the user total control over the equality algorithm. Under the hood, CanonMap maintains a Map between canonized keys and values. As far as TypeScript's type system is concerned, though, it is a Map from the desired key type to the desired value type that just happens to compare by equality.
 *
 * @extends Map
 */
export declare class CanonMap<K, T> extends Map<K, T> {
    canonizer: Canonizer<any, K>;
    /**
     * Initialize a CanonMap.
     *
     * @typeparam K Key type.
     * @typeparam T Value type.
     * @param entries? {Iterable}
     * An iterable yielding all key-value tuples that will be fed into the Map.
     * Without this, the Map is initialized to empty.
     * @param {Canonizer | number} canonizer? Function to map keys to suitable primitives.
     * If not provided, the CanonMap will use a default canonizer.
     * If a number is provided, that number will be the recursion depth of the default canonizer, overriding the default depth of 2.
     *
     */
    constructor(entries?: Iterable<[K, T]>, canonizer?: number | Canonizer<any, K>);
    /**
     * Gets the value at the canonized key in the CanonMap object.
     * Returns the CanonMap object.
     *
     *
     * @param {K} key The key to look up.
     * @returns {T | undefined} The value if found, `undefined` otherwise.
     */
    get(key: K): Possible<T>;
    /**
     * Gets the value at the canonized key in the CanonMap object.
     * Returns the CanonMap object.
     *
     * @param {K} key The key to look up.
     * @returns {boolean} `true` if the canonization of the key is present in the CanonMap, `false` otherwise.
     */
    has(key: K): boolean;
    /**
     * Sets the value for the canonized key in the CanonMap object.
     * Returns the CanonMap object.
     *
     * @param {K} key The key to set.
     * @param {T} val The value to set at that key.
     */
    set(key: K, val: T): this;
    /**
     *
     * Deletes the key-value pair associated with the canonized `key`.
     * Does nothing if that entry is not present.
     *
     * @param {K} key The key to delete the canonization of.
     * @returns `true` if an element in the CanonMap object existed and has been removed, `false` if the element does not exist.
     */
    delete(key: K): boolean;
    [Symbol.iterator](): Generator<any, void, unknown>;
    entries(): Generator<[K, T], void, unknown>;
    keys(): Generator<K, void, unknown>;
    values(): Generator<T, void, unknown>;
}
/**
 * Create a CanonMap that canonizes using `JSON.stringify`.
 *
 * @param entries? The entries with which to initialize the map.
 * By default, creates an empty map.
 */
export declare function JsonCanonMap<K, T>(entries?: Iterable<[K, T]>): CanonMap<unknown, T>;
export {};
