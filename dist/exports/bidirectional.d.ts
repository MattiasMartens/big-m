/**
 * Bidirectional Map.
 * In addition to the functions of a standard Map, BiMap allows lookups from value to key.
 *
 * The {@link BiMap#reversed} field allows access to a value-key counterpart Map with an equivalent interface.
 *
 * @remarks
 * Unlike a normal Map, BiMap must maintain the invariant that no two keys may map to the same value (as that would imply a value mapping to two keys, which is impossible).
 * Therefore, when a key is set to a colliding value, the previous key set to that value is deleted.
 *
 * @extends Map
 */
export declare class BiMap<K, T> extends Map<K, T> {
    _reverse: Map<T, K>;
    _reversedProxy: BiMap<T, K>;
    /**
     * Access the reversed map.
     * This makes some operations very simple, like `biMap.reversed.entries()` to get a list of value-to-key tuples for downstream processing.
     *
     * @remarks
     * The implementation of BiMap maintains two maps in tandem, the original map and the reversed map, so accessing this is a cheap operation.
     *
     * @returns BiMap
     */
    get reversed(): BiMap<T, K>;
    /**
     * Initialize a bidirectional map.
     *
     * @example
     * const biMap1 = new BiMap(existingMap);
     * const biMap2 = new BiMap(existingBiMap);
     * const biMap3 = new BiMap([["a", 1]]);
     * const biMap4 = new BiMap(Object.entries({"a": 1}));
     *
     * @typeparam K Key type
     * @typeparam T Value type
     * @param entries? {Iterable}
     * An iterable yielding all key-value tuples that will be fed into the Map.
     * Without this, the Map is initialized to empty.
     */
    constructor(entries?: Iterable<[K, T]>);
    /**
     * Set the value for the key in the BiMap object.
     * Returns the BiMap object.
     *
     * @remarks
     * Because values and keys have a one-to-one pairing in a bidirectional map, any key that was previously associated with that value will be overwritten as well.
     *
     * @param {K} key The key to set.
     * @param {T} val The value to set at that key.
     */
    set(key: K, val: T): this;
    /**
     * Removes all key/value pairs from the BiMap object.
     */
    clear(): void;
    /**
     * Delete the key-value pair associated with `key`.
     * Does nothing if that entry is not present.
     *
     * @param {K} key The key to delete.
     * @returns `true` if an element in the Map object existed and has been removed, `false` if the element does not exist.
     */
    delete(key: K): boolean;
    /**
     * Return the key associated to `value`, or `undefined` if there is none.
     *
     * @param {T} val The value to look up.
     */
    getKey(val: T): K | undefined;
    /**
     * Delete the key-value pair associated with `val`.
     * Do nothing if that entry is not present.
     *
     * @param {T} val The value to delete.
     * @returns `true` if an element in the Map object existed and has been removed, `false` if the element does not exist.
     */
    deleteVal(val: T): boolean;
    /**
     * Check for the presence of a value in the Map.
     *
     * @param val The value to look up.
     * @returns A boolean asserting whether a key has been associated to `val` in the Map object or not.
     */
    hasVal(val: T): boolean;
}
