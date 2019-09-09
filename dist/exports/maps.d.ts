import { Possible } from "../types/utils";
/**
 * Any iterable of entries, regardless of origin.
 * Note that `Map<K, V>` is in this type.
 */
export declare type MapStream<K, V> = Iterable<[K, V]>;
/**
 * A function for dealing with collisions when an iterable has two entries of the same key to insert into a Map, or the Map already has a value at that key.
 *
 * @param  {Possible<V>} colliding
 * The value that was previously present at `key` in some Map, or `undefined` if there was no such value.
 * @param {T} incoming
 * A value from an iterator that is being pumped into the Map.
 * @param {K} key
 * The `key` at which the value is being inserted.
 * @returns The updated value.
 */
export declare type Reconciler<K, T, V> = (colliding: Possible<V>, incoming: T, key: K) => V;
/**
 * Inserts the entries in the iterable into the provided map.
 * If two values map to the same key and the `reconcileFn` argument is provided, it will be called to combine the colliding values to set the final value; otherwise, the last value to arrive at that key will overwrite the rest.
 *
 * @param {Iterable} iterable The entries to add.
 * @param {Map} seed The Map to add them to.
 * @param {Reconciler} reconcileFn?
 * A function specifying what value to set when two keys map to the same value.
 * If provided, this is called whether there is a collision or not, so it also serves as a mapper.
 * Called with:
 * 1. The value previously set at this key, or `undefined` if no value was set;
 * 2. The new value arriving from the Iterable;
 * 3. The key where the output will be entered.
 * @returns The updated Map.
 */
export declare function mapCollectInto<K, T>(iterable: Iterable<[K, T]>, seed: Map<K, T>): Map<K, T>;
export declare function mapCollectInto<K, T, V>(iterable: Iterable<[K, T]>, seed: Map<K, V>, reconcileFn: Reconciler<K, T, V>): Map<K, V>;
/**
 * Converts an Iterable of Map entries into a brand new map.
 * When called on a map, the result will be a new Map with the same entries as the previous one.
 * If two values map to the same key and the `reconcileFn` argument is provided, it will be called to combine the colliding values to set the final value; otherwise, the last value to arrive at that key will overwrite the rest.
 *
 * @param {Iterable} iterable The entries to add.
 * @param {Reconciler} reconcileFn?
 * A function specifying what value to set when two keys map to the same value.
 * If provided, this is called whether there is a collision or not, so it also serves as a mapper.
 * Called with:
 * 1. The value previously set at this key, or `undefined` if no value was set;
 * 2. The new value arriving from the Iterable;
 * 3. The key where the output will be entered.
 * @returns The newly created Map.
 */
export declare function mapCollect<K, T>(iterable: Iterable<[K, T]>): Map<K, T>;
export declare function mapCollect<K, T, V>(iterable: Iterable<[K, T]>, reconcileFn: Reconciler<K, T, V>): Map<K, V>;
/**
 * Converts an Iterable of Map entries into a brand new BiMap.
 * If two values map to the same key and the `reconcileFn` argument is provided, it will be called to combine the colliding values to set the final value; otherwise, the last value to arrive at that key will overwrite the rest.
 *
 * Note that BiMaps do not allow two values to share a key. The reconciler plays no role in this case.
 *
 * @param {Iterable} iterable The entries to add.
 * @param {Reconciler} reconcileFn?
 * A function specifying what value to set when two keys map to the same value.
 * If provided, this is called whether there is a collision or not, so it also serves as a mapper.
 * Called with:
 * 1. The value previously set at this key, or `undefined` if no value was set;
 * 2. The new value arriving from the Iterable;
 * 3. The key where the output will be entered.
 * @returns The newly created BiMap.
 */
export declare function biMapCollect<K, T>(iterable: Iterable<[K, T]>): Map<K, T>;
export declare function biMapCollect<K, T, V>(iterable: Iterable<[K, T]>, reconcileFn: Reconciler<K, T, V>): Map<K, V>;
/**
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @returns An iterable representing the entries of a Map from value to key.
 */
export declare function reverseMap<K, T>(iterable: Iterable<[K, T]>): Generator<[T, K], void, unknown>;
/**
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @param {Function} fn A function mapping the values of the Map to a transformed value.
 * @returns An iterable representing the entries of a map from key to the transformed value.
 */
export declare function mapValues<K, T, V>(iterable: Iterable<[K, T]>, fn: (value: T, key: K) => V): MapStream<K, V>;
/**
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @returns An iterable representing the keys of the map.
 */
export declare function keysOf<K, T>(iterable: Iterable<[K, T]>): Generator<K, void, unknown>;
/**
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @returns An iterable representing the values of the map.
 */
export declare function valuesOf<K, T>(iterable: Iterable<[K, T]>): Generator<T, void, unknown>;
/**
 * @param {Iterable} iterable An iterable representing the keys of a Map.
 * @param {T} of The fixed value to set all keys to.
 * @returns An iterable representing the entries of a Map from the keys each to the same fixed value.
 */
export declare function uniformMap<K, T>(keys: Iterable<K>, of: T): Generator<[K, T], void, unknown>;
/**
 * @param {Iterable} iterable An iterable representing the entries of a Map.
 * @param {Function} filterFn A function that returns true if the entry is to be included, false otherwise.
 * @returns An iterable representing the entries of a Map without all those entries for which `filterFn` returned `false`.
 */
export declare function selectMap<K, T>(iterable: Iterable<[K, T]>, filterFn: (value: T, key: K) => boolean): Generator<[K, T], void, unknown>;
/**
 *
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {V} substitute The value to return if the key is not present.
 * @returns The value at the key in the map, or the substitute if that key is not present.
 */
export declare function getOrVal<T, V>(map: Map<T, V>, key: T, substitute: V): V;
/**
 *
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {Function} ifPresent The function to call on the value and `key` if the value is present.
 * @param  {Function} ifAbsent? The function to call on `key` if the value is absent, by default a noop returning `undefined`.
 * @returns the result of calling `ifPresent` on a value if that value is at `key` in `map`, the result of calling `ifAbsent` otherwise.
 */
export declare function foldingGet<T, V, W>(map: Map<T, V>, key: T, ifPresent: (val: V, key: T) => W): W;
export declare function foldingGet<T, V, W>(map: Map<T, V>, key: T, ifPresent: (val: V, key: T) => W, ifAbsent: (key: T) => W): W;
export declare function getOrElse<T, V>(map: Map<T, V>, key: T, substitute: (key: T) => V): V;
export declare function getOrFail<T, V>(map: Map<T, V>, key: T, error?: string | ((key: T) => string)): V;
export declare function flatMakeEntries<T, K, V>(arr: Iterable<T>, expandFn: (value: T) => Iterable<[K, V]>): Iterable<[K, V]>;
export declare function makeEntries<T, K, V>(arr: Iterable<T>, mapFn: (value: T) => [K, V]): Iterable<[K, V]>;
declare type DeepMap1<K, T> = Map<K, T | Map<K, T>>;
declare type DeepMap2<K, T> = Map<K, T | DeepMap1<K, T>>;
declare type DeepMap3<K, T> = Map<K, T | DeepMap2<K, T>>;
declare type DeepMap4<K, T> = Map<K, T | DeepMap3<K, T>>;
declare type DeepMap5<K, T> = Map<K, T | DeepMap4<K, T>>;
declare type DeepMap6<K, T> = Map<K, T | DeepMap5<K, T>>;
declare type DeepMap7<K, T> = Map<K, T | DeepMap6<K, T>>;
declare type DeepMap8<K, T> = Map<K, T | DeepMap7<K, T>>;
export declare type DeepMap<K, T> = DeepMap8<K, T>;
export declare type DeepMapStream<K, T> = Iterable<[K[], T]>;
export declare function squeezeDeepMap<K, T>(deepMap: DeepMap<K, T>): Iterable<T>;
export declare function deepMapStream<K, V>(deepMap: DeepMap<K, V>): Iterable<[K[], V]>;
export declare function deepCollectInto<T, K>(arr: Iterable<[K[], T]>, seed: DeepMap<K, T>): DeepMap<K, T>;
export declare function deepCollectInto<T, K, V>(arr: Iterable<[K[], T]>, seed: DeepMap<K, V>, reconcileFn: Reconciler<K[], T, V>): DeepMap<K, V>;
export declare function deepCollect<T, K>(arr: Iterable<[K[], T]>): DeepMap<K, T>;
export declare function deepCollect<T, K, V>(arr: Iterable<[K[], T]>, reconcileFn: Reconciler<K[], T, V>): DeepMap<K, V>;
export declare function reconcileAppend<T, V, K>(mapFn?: (val: T) => unknown extends V ? T : V): Reconciler<K, T, (unknown extends V ? T : V)[]>;
export declare function reconcileAdd<K>(): Reconciler<K, number, number>;
export declare function reconcileAdd<T, K>(mapFn: (val: T) => number): Reconciler<K, T, number>;
export declare function reconcileCount<K, T>(): Reconciler<K, T, number>;
export declare function reconcileAppendFlat<T, K>(): Reconciler<K, (Possible<T | Iterable<T>>), T[]>;
export declare function reconcileAppendFlat<T, V, K>(mapFn: (val: T) => Possible<V | Iterable<V>>): Reconciler<K, T, V[]>;
export declare function reconcileFold<K, T, V>(mapper: (val: T) => V, reducer: (colliding: V, val: T) => V): Reconciler<K, T, V>;
export declare function reconcileDefault<K, T>(): Reconciler<K, T, T>;
export declare function reconcileFirst<K, T>(): Reconciler<K, T, T>;
export declare function invertBinMap<K, T>(map: Iterable<[K, T[]]>): Map<T, K[]>;
export declare function mapToDictionary<K, T>(map: Iterable<[K, T]>, stringifier?: (val: K) => string): {
    [key: string]: T;
};
export declare function deepFoldingGet<T, V, W>(map: Map<T, V>, lookup: T[], ifPresent: (val: V, keys: T[]) => W, ifAbsent: (keys: T[], matched: T[]) => W): W;
export declare function deepGet<K, T>(map: DeepMap<K, T>, lookup: K[]): T | Map<K, T | Map<K, T | Map<K, T | Map<K, T | Map<K, T | Map<K, T | Map<K, T | Map<K, T>>>>>>>> | undefined;
export declare function deepGetOrVal<K, T>(map: DeepMap<K, T>, lookup: K[], substitute: T): T;
export declare function deepGetOrElse<K, T>(map: DeepMap<K, T>, lookup: K[], substituteFn: (lookup: K[], matched: K[]) => T): T;
export declare function deepGetOrFail<K, T>(map: DeepMap<K, T>, lookup: K[], error?: string | ((follow: K[], matched: K[]) => string)): T;
export declare function deepHas<K, T>(map: DeepMap<K, T>, lookup: K[], error?: string | ((follow: K[], matched: K[]) => string)): boolean;
export declare function deepMapToDictionary<K, T>(map: Iterable<[K, T]>, stringifier?: (val: K, depth: number) => string): {
    [key: string]: unknown;
};
export declare function deepDictionaryToMap<Y>(dictionary: {
    [key: string]: Object;
}): DeepMapStream<string, Y>;
export {};
