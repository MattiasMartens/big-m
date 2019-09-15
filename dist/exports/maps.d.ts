import { Possible } from "../types/utils";
/**
 * Any iterable of entries, regardless of origin.
 * Note that `Map<K, V>` is in this type.
 */
export declare type mapEnumeration<K, V> = Iterable<[K, V]>;
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
export declare function mapCollectInto<K, T>(iterable: Iterable<[K, T]>, seed: Map<K, T>): Map<K, T>;
export declare function mapCollectInto<K, T, V>(iterable: Iterable<[K, T]>, seed: Map<K, V>, reconcileFn: Reconciler<K, T, V>): Map<K, V>;
export declare function mapCollect<K, T>(iterable: Iterable<[K, T]>): Map<K, T>;
export declare function mapCollect<K, T, V>(iterable: Iterable<[K, T]>, reconcileFn: Reconciler<K, T, V>): Map<K, V>;
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
export declare function mapValues<K, T, V>(iterable: Iterable<[K, T]>, fn: (value: T, key: K) => V): mapEnumeration<K, V>;
/**
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @param {Function} fn A function mapping the keys of the Map to a transformed key.
 * @returns An iterable representing the entries of a map from the transformed key to value.
 */
export declare function mapKeys<K, T, V>(iterable: Iterable<[K, T]>, fn: (key: K, value: T) => V): mapEnumeration<V, T>;
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
export declare function foldingGet<T, V, W>(map: Map<T, V>, key: T, ifPresent: (val: V, key: T) => W): W;
export declare function foldingGet<T, V, W>(map: Map<T, V>, key: T, ifPresent: (val: V, key: T) => W, ifAbsent: (key: T) => W): W;
/**
 *
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {Function} substitute The function to call on `key` if the value is not present.
 * @returns the value at `key` in `map` if that value exists, the result of calling `substitute` otherwise.
 */
export declare function getOrElse<T, V, W>(map: Map<T, V>, key: T, substitute: (key: T) => W): V | W;
/**
 *
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {string | Function} error? The error to generate if the key is not present. Can be a function taking the key as a parameter, or an explicit string.
 * @returns the value at `key` in `map` if that value exists, the result of calling `substitute` otherwise.
 * @throws The specified error if an error string or function is provided, a default error message if not.
 */
export declare function getOrFail<T, V>(map: Map<T, V>, key: T, error?: string | ((key: T) => string)): V;
/**
 *
 * Convert an iterable of values into a list of Map entries with a mapping function.
 *
 * @param {Iterable} arr The input iterable.
 * @param {Function} mapFn The function that turns inputs into entries.
 * @returns An iterable of key-value tuples generated by the output of `mapFn` when called on members of `arr`.
 */
export declare function makeEntries<T, K, V>(arr: Iterable<T>, mapFn: (value: T) => [K, V]): Iterable<[K, V]>;
/**
 *
 * Convert an Iterable into a Map from an attribute defined by `keyFn` to a list of values with the same attribute.
 *
 * @param {Iterable} arr The Iterable to map over.
 * @param keyFn The function to generate keys with.
 */
export declare function binMap<T, K, P extends Map<K, T[]>>(arr: Iterable<T>, keyFn: (val: T) => K, seed?: P): P extends unknown ? Map<K, T[]> : P;
/**
 *
 * Convert an iterable of values into an arbitrary-length iterable of Map entries with a flat-mapping function.
 *
 * @remarks This is a thin wrapper over the flatMap function (as provided by lodash, Ramda, etc.) whose main use is to enfore the correct type for working with Maps.
 *
 * @param {Iterable} arr The input iterable.
 * @param {Function} expandFn The function that turns the input into a (possibly empty) list of entries.
 * @returns An iterable of key-value tuples generated by appending together the output of `expandFn` when called on members of `arr`.
 */
export declare function flatMakeEntries<T, K, V>(arr: Iterable<T>, expandFn: (value: T) => Iterable<[K, V]>): Iterable<[K, V]>;
/**
 * Generate a Reconciler that pushes input values onto an array of previously colliding values, optionally transforming them first with a mapper.
 *
 * @param {Function} mapFn? A function to call on the inputs.
 * @returns {Reconciler} A Reconciler that combines input values into an Array.
 */
export declare function reconcileAppend<T, V, K>(mapFn?: (val: T) => unknown extends V ? T : V): Reconciler<K, T, (unknown extends V ? T : V)[]>;
export declare function reconcileAdd<K>(): Reconciler<K, number, number>;
export declare function reconcileAdd<T, K>(mapFn: (val: T) => number): Reconciler<K, T, number>;
/**
 * Generate a Reconciler that bumps up a count on each collision, ultimately yielding the total number of entries that collided on a key.
 *
 * @returns {Reconciler} A Reconciler that counts entries that has the same key.
 */
export declare function reconcileCount<K, T>(): Reconciler<K, T, number>;
export declare function reconcileConcat<T, K>(): Reconciler<K, (Possible<Iterable<T>>), T[]>;
/**
 * Generate a Reconciler by specifying a function to run by default, and a second function to run if a value already exists in the Map at the specified key.
 *
 * @remarks
 * This is an alternate dialect for generating a Reconciler that saves the boilerplate of `if () {} else {}` at the cost of having to define two different functions.
 *
 * @param mapper A function that takes an incoming value and returns the value to set.
 * @param reducer A function that takes the colliding value and an incoming value and returns the value to set.
 *
 * @returns A Reconciler that calls `mapper` if a collidingValue exists (even if it is `undefined`!), calls `reducer` otherwise.
 */
export declare function reconcileFold<K, T, V>(mapper: (val: T) => V, reducer: (colliding: V, val: T) => V): Reconciler<K, T, V>;
/**
 * Generates a reconciler that simulates the default behaviour of setting Maps, overwriting any value that was already at the key on `set`.
 * @returns {Reconciler} A Reconciler that always returns the `incomingValue`.
 */
export declare function reconcileDefault<K, T>(): Reconciler<K, T, T>;
/**
 * Generates a reconciler that reverses the default behaviour of setting Maps: instead of overwriting what's already at a key, the `set` operation is ignored if a value is already present at that key.
 * @returns {Reconciler} A Reconciler that returns the `collidingValue` if it is defined, the `incomingValue` otherwise.
 */
export declare function reconcileFirst<K, T>(): Reconciler<K, T, T>;
/**
 * Convert a map from keys to arrays of values (i.e., of the form Map<K, T[]>) to a map of values from arrays of keys (i.e., of the form Map<T, K[]>).
 *
 * @example
 * const peopleToFlavours = new Map([
 *   ["Alex", ["vanilla"]],
 *   ["Desdemona", ["banana", "chocolate"],
 *   ["Henrietta", ["vanilla", "chocolate", "cherry"]
 * ]);
 *
 * const flavoursToPeople = new Map([
 *   ["vanilla", ["Alex", "Henrietta"]],
 *   ["banana", ["Desdemona"]],
 *   ["chocolate", ["Desdemona", "Henrietta"]],
 *   ["cherry", ["Henrietta"]]
 * ]);
 *
 * assert(deepEquals(
 *   Array.from(flavoursToPeople),
 *   Array.from(invertBinMap(peopleToFlavours))
 * ));
 *
 * @param {Iterable} map An Iterable representing a Map of entries where the values are arrays.
 * @returns {Map} A Map containing, for each member value that appears in any of the arrays, an entry where the key is the value in the array and the value is a list of all the keys in the input Map that included it.
 */
export declare function invertBinMap<K, T>(map: Iterable<[K, T[]]>): Map<T, K[]>;
/**
 * Convert a Map into a dictionary.
 *
 * @remarks This is handy when the contents of map need to be serialized to JSON.
 *
 * @param {Iterable} map An iterable of Map entries.
 * @param {Function} stringifier? A function to convert a Map key into a string key that is suitable for use in a dictionary. If excluded, `mapToDictionary` will use the default String constructor.
 * @returns The new dictionary object.
 */
export declare function mapToDictionary<K, T>(map: Iterable<[K, T]>, stringifier?: (val: K) => string): {
    [key: string]: T;
};
/**
 *
 * Combine two Maps into a stream of entries of the form `[commonKeyType, [valueInFirstMap], [valueInSecondMap]]`.
 * Any key that is not contained in both input Maps will not be represented in the output.
 * To include them, use {@link zipMapsUnion}.
 *
 * @remarks
 * Internally, `zipMapsIntersection` turns `map2` into a Map if it isn't one already.
 * This is because it needs random access into `map2` while looping over `map1` to get the values to zip.
 *
 * @param map1
 * @param map2
 * @returns {Iterable} An iterable of the form `Map<commonKeyType, [valueInFirstMap, valueInSecondMap]>` containing all keys that `map1` and `map2` have in common.
 */
export declare function zipMapsIntersection<K, T1, T2>(map1: Iterable<[K, T1]>, map2: Iterable<[K, T2]>): Iterable<[K, [T1, T2]]>;
/**
 *
 * Combine two Maps into a stream of entries of the form `[commonKeyType, [valueInFirstMap | undefined], [valueInSecondMap | undefined]]`.
 * If a key is in one Map but not the other, the output tuple will contain `undefined` in place of the missing value.
 * To exclude them instead, use {@link zipMapsUnion}.
 *
 * @remarks
 * Internally, `zipMapsUnion` must collect all non-Map Iterables into Maps so it can look up what keys exist in `map2` during the initial pass over `map1`, and then to determine which keys have already been yielded during the second pass over `map2`.
 * This probably makes it slower than {@link zipMapsIntersection} in this case.
 *
 * @param map1
 * @param map2
 * @returns {Iterable} An iterable of the form `Map<commonKeyType, [valueInFirstMap | undefined, valueInSecondMap | undefined]>` containing all keys that exist in either `map1` or `map2`.
 */
export declare function zipMapsUnion<K, T1, T2>(map1: Iterable<[K, T1]>, map2: Iterable<[K, T2]>): Iterable<[K, [Possible<T1>, Possible<T2>]]>;
/**
 * Pipe the entries of a Map iterable into a Map, resolving key collisions by setting the incoming entry to a new key determined by `bumper`.
 * If the new key collides too, keep calling `bumper` until it either resolves to a unique key or returns `undefined` to signal failure.
 *
 * @param  {Iterable} mapEnumeration An entry stream with duplicate keys.
 * @param  {BumperFn} bumper A function to be called each time a key would overwrite a key that has already been set in `seed`.
 * @param  {Map} seed The Map to insert values into.
 * @returns {{Map}} The finalized Map.
 */
export declare function mapCollectBumping<K, T>(mapEnumeration: Iterable<[K, T]>, bumper: BumperFn<K, T>): Map<K, T>;
/**
 *
 * Function to resolve bumping keys.
 * {@link bumpDuplicateKeys} and {@link collectIntoBumpingDuplicateKeys} take one of these as an argument and call it every time they fail to insert an entry into a Map because of a duplicate key.
 * If the BumperFn returns a key, the caller will use that as the new insertion key.
 * If the BumperFn returns `undefined`, the caller will treat this as a failure and skip it.
 *
 * @remarks
 * The `priorBumps` parameter can be used to fail key generation if too many collisions occur, either by returning `undefined` or by throwing an appropriate error (see {@link resolutionFailureMessage}).
 * For complex functions, this is the only guaranteed way to avoid entering an infinite loop.
 *
 * @param  {K} collidingKey The key that would have been set in a Map if it did not already exist in the Map.
 * @param  {number} priorBumps The number of times the caller has already attempted to insert the key.
 * @param  {K} originalKey The key that was initially attempted to be set when the resolution process began.
 * @param  {T} collidingValue The value that is currently set at the key in a Map.
 * @param  {T} incomingValue The value that would have been set at the key in a Map.
 * @returns {K | undefined} The key if a key was successfully generated, `undefined` otherwise.
 */
export declare type BumperFn<K, T> = (collidingKey: K, priorBumps: number, originalKey: K, collidingValue: T, incomingValue: T) => Possible<K>;
/**
 * Pipe the entries of a Map iterable into a Map, resolving key collisions by setting the incoming entry to a new key determined by `bumper`.
 * If the new key collides too, keep calling `bumper` until it either resolves to a unique key or returns `undefined` to signal failure.
 *
 * @param  {Iterable} mapEnumeration An entry stream with duplicate keys.
 * @param  {BumperFn} bumper A function to be called each time a key would overwrite a key that has already been set in `seed`.
 * @param  {Map} seed The Map to insert values into.
 * @returns {{Map}} The finalized Map.
 */
export declare function mapCollectIntoBumping<K, T>(mapEnumeration: Iterable<[K, T]>, bumper: BumperFn<K, T>, seed: Map<K, T>): Map<K, T>;
/**
 * Function that a caller of `bumpDuplicateKeys()` can use to produce a generic error message when a key collision cannot be resolved.
 *
 * @param collidingKey The key that could not be resolved.
 * @param priorBumps The number of attempts made before the bumper gave up.
 * @returns {string} A message describing the error
 */
export declare function resolutionFailureMessage<K, T>(collidingKey: K, priorBumps: number): string;
