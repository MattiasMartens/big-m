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
    readonly reversed: BiMap<T, K>;
    /**
     *
     * @example
     * const biMap1 = new BiMap(existingMap);
     * const biMap2 = new BiMap([["a", 1]]);
     * const biMap3 = new BiMap(Object.entries({"a": 1}))
     *
     * @typeparam K Key type
     * @typeparam T Value type
     * @param forward? {Iterable}
     * An iterable yielding all key-value tuples that will be fed into the Map.
     * Without this, the Map is initialized to empty.
     * @param reverse? {Iterable}
     * An iterable yielding all value-key tuples that will be fed into the reversed Map.
     * If this is provided, it must be the exact reverse of {@link BiMap.constructor.forward}.
     * If it is not provided, BiMap generates it manually.
     */
    constructor(forward?: Iterable<[K, T]>, reverse?: Iterable<[T, K]>);
    set(key: K, val: T): this;
    clear(): void;
    delete(key: K): boolean;
    getKey(val: T): K | undefined;
    deleteVal(val: T): boolean;
    hasVal(val: T): boolean;
}
