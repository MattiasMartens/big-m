"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterable_1 = require("../iterable");
const utils_1 = require("../types/utils");
/**
 * Insert the entries in the iterable into the provided map.
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
function mapCollectInto(iterable, seed, reconcileFn) {
    if (reconcileFn) {
        const saltedKeys = new Set();
        for (let [key, val] of iterable) {
            if (!saltedKeys.has(key)) {
                const reconciled = reconcileFn(seed.get(key), val, key);
                if (reconciled === undefined) {
                    seed.delete(key);
                    saltedKeys.add(key);
                }
                reconciled !== undefined && seed.set(key, reconciled);
            }
        }
    }
    else {
        for (let entry of iterable) {
            const [key, val] = entry;
            seed.set(key, val);
        }
    }
    return seed;
}
exports.mapCollectInto = mapCollectInto;
/**
 *
 * Combine Iterables of Map entries into a single Iterable, leaving keys unmerged.
 *
 * @param maps The Map Iterables to merge
 * @returns An Iterable consisting of *all* entries of the Iterables in the arguments, even those with duplicate keys.
 */
function concatMap(...maps) {
    return iterable_1.combine(...maps);
}
exports.concatMap = concatMap;
/**
 * Convert an Iterable of Map entries into a brand new map.
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
function mapCollect(iterable, reconcileFn) {
    return mapCollectInto(iterable, new Map(), reconcileFn);
}
exports.mapCollect = mapCollect;
/**
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @returns An iterable representing the entries of a Map from value to key.
 */
function reverseMap(iterable) {
    return iterable_1.map(iterable, ([k, t]) => [t, k]);
}
exports.reverseMap = reverseMap;
/**
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @param {Function} fn A function mapping the values of the Map to a transformed value.
 * @returns An iterable representing the entries of a map from key to the transformed value.
 */
function mapValues(iterable, fn) {
    return iterable_1.map(iterable, ([key, val]) => [key, fn(val, key)]);
}
exports.mapValues = mapValues;
/**
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @param {Function} fn A function mapping the keys of the Map to a transformed key.
 * @returns An iterable representing the entries of a map from the transformed key to value.
 */
function mapKeys(iterable, fn) {
    return iterable_1.map(iterable, ([key, val]) => [fn(key, val), val]);
}
exports.mapKeys = mapKeys;
/**
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @returns An iterable representing the keys of the map.
 */
function keysOf(iterable) {
    return iterable_1.map(iterable, arr => arr[0]);
}
exports.keysOf = keysOf;
/**
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @returns An iterable representing the values of the map.
 */
function valuesOf(iterable) {
    return iterable_1.map(iterable, arr => arr[1]);
}
exports.valuesOf = valuesOf;
/**
 * @param {Iterable} iterable An iterable representing the keys of a Map.
 * @param {T} of The fixed value to set all keys to.
 * @returns An iterable representing the entries of a Map from the keys each to the same fixed value.
 */
function uniformMap(keys, of) {
    return iterable_1.map(keys, key => [key, of]);
}
exports.uniformMap = uniformMap;
/**
 * @param {Iterable} iterable An iterable representing the entries of a Map.
 * @param {Function} filterFn A function that returns true if the entry is to be included, false otherwise.
 * @returns An iterable representing the entries of a Map without all those entries for which `filterFn` returned `false`.
 */
function selectMap(iterable, filterFn) {
    return iterable_1.filter(iterable, ([key, val]) => filterFn(val, key));
}
exports.selectMap = selectMap;
/**
 *
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {V} substitute The value to return if the key is not present.
 * @returns The value at the key in the map, or the substitute if that key is not present.
 */
function getOrVal(map, key, substitute) {
    if (map.has(key)) {
        return map.get(key);
    }
    else {
        return substitute;
    }
}
exports.getOrVal = getOrVal;
/**
 *
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {Function} ifPresent The function to call on the value and `key` if the value is present.
 * @param  {Function} ifAbsent? The function to call on `key` if the value is absent, by default a noop returning `undefined`.
 * @returns the result of calling `ifPresent` on a value if that value is at `key` in `map`, the result of calling `ifAbsent` otherwise.
 */
function foldingGet(map, key, ifPresent, ifAbsent = (() => { })) {
    if (map.has(key)) {
        return ifPresent(map.get(key), key);
    }
    else {
        return ifAbsent(key);
    }
}
exports.foldingGet = foldingGet;
/**
 *
 * Set a value on Map, using a Reconciler to merge the incoming value with any existing value.
 *
 * This simulates the behaviour of merging a value in MapCollect, but for a single value instead of an Iterable.
 *
 * *This includes the behaviour that, if the Reconciler returns `undefined`, the entry at the Map will be deleted.*
 *
 * @param map The Map to set the key-value pair on.
 * @param key The key to set.
 * @param value The value to reconcile with any possible colliding value in Map.
 * @param reconciler The reconciler function.
 * @returns The Map this function was called on.
 */
function reconcileEntryInto(map, key, value, reconciler) {
    const reconciled = reconciler(map.get(key), value, key);
    if (reconciled !== undefined) {
        map.set(key, reconciled);
    }
    else {
        map.delete(key);
    }
    return map;
}
exports.reconcileEntryInto = reconcileEntryInto;
/**
 *
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {Function} substitute The function to call on `key` if the value is not present.
 * @returns the value at `key` in `map` if that value exists, the result of calling `substitute` otherwise.
 */
function getOrElse(map, key, substitute) {
    if (map.has(key)) {
        return map.get(key);
    }
    else {
        return substitute(key);
    }
}
exports.getOrElse = getOrElse;
/**
 *
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {string | Function} error? The error to generate if the key is not present. Can be a function taking the key as a parameter, or an explicit string.
 * @returns the value at `key` in `map` if that value exists, the result of calling `substitute` otherwise.
 * @throws The specified error if an error string or function is provided, a default error message if not.
 */
function getOrFail(map, key, error) {
    return getOrElse(map, key, (key) => {
        throw new Error(typeof error === "function"
            ? error(key)
            : typeof error === "undefined"
                ? `Map has no entry "${key}"`
                : error);
    });
}
exports.getOrFail = getOrFail;
/**
 *
 * Convert an iterable of values into a list of Map entries with a mapping function.
 *
 * @param {Iterable} arr The input iterable.
 * @param {Function} mapFn The function that turns inputs into entries.
 * @returns An iterable of key-value tuples generated by the output of `mapFn` when called on members of `arr`.
 */
function makeEntries(arr, mapFn) {
    return iterable_1.map(arr, mapFn);
}
exports.makeEntries = makeEntries;
/**
 * Produce an Iterable from a list of values and a function to produce a key for each value.
 *
 * Does not check collisions; these can be handled at a later step.
 *
 * @param arr The values to map
 * @param keyFn The function to generate keys.
 * @returns An Iterable representing key-value pairs where the keys are generated by calling `keyFn` on the values.
 */
function* keyBy(arr, keyFn) {
    for (let val of arr) {
        yield [
            keyFn(val),
            val
        ];
    }
}
exports.keyBy = keyBy;
/**
 *
 * Convert an Iterable into a Map from an attribute defined by `keyFn` to a list of values with the same attribute.
 *
 * @param {Iterable} arr The Iterable to map over.
 * @param keyFn The function to generate keys with.
 */
function binMap(arr, keyFn, seed) {
    const ret = seed || new Map();
    iterable_1.forEach(arr, val => {
        const key = keyFn(val);
        const current = getOrVal(ret, key, []);
        current.push(val);
        ret.set(key, current);
    });
    return ret;
}
exports.binMap = binMap;
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
function* flatMakeEntries(arr, expandFn) {
    for (let val of arr) {
        yield* expandFn(val);
    }
}
exports.flatMakeEntries = flatMakeEntries;
/**
 * Generate a Reconciler that pushes input values onto an array of previously colliding values, optionally transforming them first with a mapper.
 *
 * @param {Function} mapFn? A function to call on the inputs.
 * @returns {Reconciler} A Reconciler that combines input values into an Array.
 */
function reconcileAppend(mapFn) {
    if (mapFn) {
        return function (collidingValue, value) {
            const val = mapFn(value);
            if (collidingValue === undefined) {
                return [val];
            }
            else {
                collidingValue.push(val);
                return collidingValue;
            }
        };
    }
    else {
        return function (collidingValue, value) {
            if (collidingValue === undefined) {
                return [value];
            }
            else {
                collidingValue.push(value);
                return collidingValue;
            }
        };
    }
}
exports.reconcileAppend = reconcileAppend;
/**
 * Generate a Reconciler that either adds a numeric input value to a colliding numeric value, or maps the input value to a number before doing so.
 *
 * @param {Function} mapFn A function that maps incoming values to numbers so they can be reconciled by adding.
 * @returns {Reconciler} A summing Reconciler.
 */
function reconcileAdd(mapFn) {
    return function (collidingValue, value) {
        const val = mapFn ? mapFn(value) : value;
        if (collidingValue === undefined) {
            return val;
        }
        else {
            return val + collidingValue;
        }
    };
}
exports.reconcileAdd = reconcileAdd;
/**
 * Generate a Reconciler that bumps up a count on each collision, ultimately yielding the total number of entries that collided on a key.
 *
 * @returns {Reconciler} A Reconciler that counts entries that has the same key.
 */
function reconcileCount() {
    return function (collidingValue, _) {
        if (collidingValue === undefined) {
            return 1;
        }
        else {
            return 1 + collidingValue;
        }
    };
}
exports.reconcileCount = reconcileCount;
/**
 * Generate a Reconciler that concatenates input values together when they collide, optionally transforming them first with a mapper.
 *
 * @param {Function} mapFn? A function to call on the inputs.
 * Regardless of the input type, the output must be an Iterable.
 * @returns {Reconciler} A Reconciler that concatenates input values together.
 */
function reconcileConcat(mapFn = (val) => val) {
    return function (collidingValue, value) {
        const val = mapFn(value);
        if (collidingValue === undefined) {
            return Array.from(val);
        }
        else {
            return [...collidingValue, ...val];
        }
    };
}
exports.reconcileConcat = reconcileConcat;
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
function reconcileFold(mapper, reducer) {
    return function (collidingValue, value) {
        if (collidingValue === undefined) {
            return mapper(value);
        }
        else {
            return reducer(collidingValue, value);
        }
    };
}
exports.reconcileFold = reconcileFold;
/**
 * Generates a reconciler that simulates the default behaviour of setting Maps, overwriting any value that was already at the key on `set`.
 * @returns {Reconciler} A Reconciler that always returns the `incomingValue`.
 */
function reconcileDefault() {
    return function (_, value) {
        return value;
    };
}
exports.reconcileDefault = reconcileDefault;
/**
 * Generates a reconciler that reverses the default behaviour of setting Maps: instead of overwriting what's already at a key, the `set` operation is ignored if a value is already present at that key.
 * @returns {Reconciler} A Reconciler that returns the `collidingValue` if it is defined, the `incomingValue` otherwise.
 */
function reconcileFirst() {
    return function (collidingValue, incomingValue) {
        if (collidingValue === undefined) {
            return incomingValue;
        }
        else {
            return collidingValue;
        }
    };
}
exports.reconcileFirst = reconcileFirst;
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
function invertBinMap(map) {
    return mapCollect(iterable_1.flatMap(map, ([key, arr]) => arr.map(t => utils_1.tuple([t, key]))), reconcileAppend());
}
exports.invertBinMap = invertBinMap;
/**
 * Convert a Map into a dictionary.
 *
 * @remarks This is handy when the contents of map need to be serialized to JSON.
 *
 * @param {Iterable} map An iterable of Map entries.
 * @param {Function} stringifier? A function to convert a Map key into a string key that is suitable for use in a dictionary. If excluded, `mapToDictionary` will use the default String constructor.
 * @returns The new dictionary object.
 */
function mapToDictionary(map, stringifier = String) {
    const ret = {};
    for (let entry of map) {
        const [key, val] = entry;
        ret[stringifier(key)] = val;
    }
    return ret;
}
exports.mapToDictionary = mapToDictionary;
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
function* zipMapsIntersection(map1, map2) {
    const map2Collect = map2 instanceof Map ? map2 : mapCollect(map2);
    for (let [key, value1] of map1) {
        if (map2Collect.has(key)) {
            yield [key, [value1, getOrFail(map2Collect, key)]];
        }
    }
}
exports.zipMapsIntersection = zipMapsIntersection;
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
function* zipMapsUnion(map1, map2) {
    const map1Collect = map1 instanceof Map ? map1 : mapCollect(map1);
    const map2Collect = map2 instanceof Map ? map2 : mapCollect(map2);
    for (let [key, value1] of map1Collect) {
        yield [key, [value1, map2Collect.get(key)]];
    }
    for (let [key, value2] of map2Collect) {
        if (!map1Collect.has(key)) {
            yield [key, [undefined, value2]];
        }
    }
}
exports.zipMapsUnion = zipMapsUnion;
/**
 * Pipe the entries of a Map iterable into a Map, resolving key collisions by setting the incoming entry to a new key determined by `bumper`.
 * If the new key collides too, keep calling `bumper` until it either resolves to a unique key or returns `undefined` to signal failure.
 *
 * @param  {Iterable} mapEnumeration An entry stream with duplicate keys.
 * @param  {BumperFn} bumper A function to be called each time a key would overwrite a key that has already been set in `seed`.
 * @param  {Map} seed The Map to insert values into.
 * @returns {{Map}} The finalized Map.
 */
function mapCollectBumping(mapEnumeration, bumper) {
    return mapCollectIntoBumping(mapEnumeration, bumper, new Map());
}
exports.mapCollectBumping = mapCollectBumping;
/**
 * Pipe the entries of a Map iterable into a Map, resolving key collisions by setting the incoming entry to a new key determined by `bumper`.
 * If the new key collides too, keep calling `bumper` until it either resolves to a unique key or returns `undefined` to signal failure.
 *
 * @param  {Iterable} mapEnumeration An entry stream with duplicate keys.
 * @param  {BumperFn} bumper A function to be called each time a key would overwrite a key that has already been set in `seed`.
 * @param  {Map} seed The Map to insert values into.
 * @returns {{Map}} The finalized Map.
 */
function mapCollectIntoBumping(mapEnumeration, bumper, seed) {
    for (let [key, value] of mapEnumeration) {
        if (seed.has(key)) {
            let newKey = key;
            let attempts = 0;
            while (true) {
                const innerNewKey = bumper(newKey, attempts++, key, getOrFail(seed, key), value);
                if (innerNewKey === undefined) {
                    // Failed to set
                    break;
                }
                else if (!seed.has(innerNewKey)) {
                    seed.set(innerNewKey, value);
                    break;
                }
                else {
                    newKey = innerNewKey;
                }
            }
        }
        else {
            seed.set(key, value);
        }
    }
    return seed;
}
exports.mapCollectIntoBumping = mapCollectIntoBumping;
/**
 * Function that a caller of `bumpDuplicateKeys()` can use to produce a generic error message when a key collision cannot be resolved.
 *
 * @param collidingKey The key that could not be resolved.
 * @param priorBumps The number of attempts made before the bumper gave up.
 * @returns {string} A message describing the error
 */
function resolutionFailureMessage(collidingKey, priorBumps) {
    const pluralize = (n) => n === 1 ? "try" : "tries";
    return `Failed to resolve key "${collidingKey}" to a unique value after ${priorBumps} ${pluralize(priorBumps)}`;
}
exports.resolutionFailureMessage = resolutionFailureMessage;
