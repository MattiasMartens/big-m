"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfCanonMap = exports.canonizeByPick = exports.JsonCanonMap = exports.CanonMap = exports.jsonCanonize = exports.naiveCanonize = void 0;
const iterable_1 = require("../iterable");
const support_1 = require("../support");
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
function naiveCanonize(lookup, maxDepth = 2) {
    if (typeof lookup === 'object' && lookup !== null) {
        if (maxDepth === 0) {
            return String(lookup);
        }
        else {
            if (Array.isArray(lookup)) {
                return "[" + lookup.map(l => naiveCanonize(l, maxDepth - 1)).join(", ") + "]";
            }
            else if (lookup instanceof Date) {
                return "Date: " + lookup.valueOf();
            }
            else {
                // Non-recursive stringify
                return "{"
                    + iterable_1.collect(iterable_1.entries(lookup)).sort((entry1, entry2) => entry1[0] > entry2[0] ? 1 : -1).map(([key, val]) => key + ": " + naiveCanonize(val, maxDepth - 1)).join(", ")
                    + "}";
            }
        }
    }
    else if (typeof lookup === 'string') {
        return "String: " + lookup;
    }
    else if (Number.isNaN(lookup)) {
        return "Number: NaN";
    }
    else {
        return lookup;
    }
}
exports.naiveCanonize = naiveCanonize;
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
 * @returns A stringified version of the lookup.
 */
function jsonCanonize(lookup) {
    return JSON.stringify(lookup);
}
exports.jsonCanonize = jsonCanonize;
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
class CanonMap extends Map {
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
     */
    constructor(entries, canonizer = naiveCanonize) {
        super();
        if (typeof canonizer === "number") {
            this.canonizer = (k) => naiveCanonize(k, canonizer);
        }
        else {
            this.canonizer = canonizer;
        }
        if (entries) {
            for (let entry of entries) {
                const [key, value] = entry;
                // @ts-ignore
                super.set(canonizer(key), [key, value]);
            }
        }
    }
    /**
     * Get the value at the canonized key in the CanonMap object.
     * Returns the CanonMap object.
     *
     * @param {K} key The key to look up.
     * @returns {T | undefined} The value if found, `undefined` otherwise.
     */
    get(key) {
        const canon = this.canonizer(key);
        return super.has(canon) ? super.get(canon)[1] : undefined;
    }
    /**
     * Get the value at the canonized key in the CanonMap object.
     * Returns the CanonMap object.
     *
     * @param {K} key The key to look up.
     * @returns {boolean} `true` if the canonization of the key is present in the CanonMap, `false` otherwise.
     */
    has(key) {
        return super.has(this.canonizer(key));
    }
    /**
     * Set the value for the canonized key in the CanonMap object.
     * Returns the CanonMap object.
     *
     * @param {K} key The key to set.
     * @param {T} val The value to set at that key.
     */
    set(key, val) {
        // @ts-ignore
        super.set(this.canonizer(key), [key, val]);
        return this;
    }
    /**
     * Delete the key-value pair associated with the canonized `key`.
     * Does nothing if that entry is not present.
     *
     * @param {K} key The key to delete the canonization of.
     * @returns `true` if an element in the CanonMap object existed and has been removed, `false` if the element does not exist.
     */
    delete(key) {
        return super.delete(this.canonizer(key));
    }
    *[Symbol.iterator]() {
        for (let entry of super[Symbol.iterator]()) {
            yield entry[1];
        }
    }
    *entries() {
        for (let entry of this[Symbol.iterator]()) {
            yield entry;
        }
    }
    *keys() {
        for (let entry of this[Symbol.iterator]()) {
            yield entry[0];
        }
    }
    *values() {
        for (let entry of this[Symbol.iterator]()) {
            yield entry[1];
        }
    }
    forEach(callbackfn, thisArg) {
        for (let entry of this[Symbol.iterator]()) {
            callbackfn.call(thisArg, entry[1], entry[0]);
        }
    }
}
exports.CanonMap = CanonMap;
/**
 * Create a CanonMap that canonizes using `JSON.stringify`.
 *
 * @param entries? The entries with which to initialize the map.
 * By default, creates an empty map.
 */
function JsonCanonMap(entries) {
    return new CanonMap(entries, jsonCanonize);
}
exports.JsonCanonMap = JsonCanonMap;
function* mapIterable(iter, mapper) {
    for (const i of iter) {
        yield mapper(i);
    }
}
/**
 *
 * @param _ Example of what will be picked. If necessary, forcefully cast this to the type desired.
 * @param pick An array of the key lookups to perform.
 * @returns Canonizer that produces a canonical string by combining all specified key-value pairs together.
 * @warning This will not maintain distinctness for non-primitive objects.
 */
function canonizeByPick(_, pick) {
    return (o) => pick.map(k => `${String(k)}:${support_1.defined(o[k])}`).join('|');
}
exports.canonizeByPick = canonizeByPick;
/**
 * A version of CanonMap that is specialized for creating indexes: mapping an object's identifying attributes, specified by canonization, to the object itself.
 *
 * @example
 * Take this data type Duck: { name: string, featherCount: number ).
 * Ducks are identified by their name, so we can use a SelfCanonMap both to store the canonical version of a Duck, and to look up a Duck knowing its name only:
 *
 * const duckMap = new SelfCanonMap([{ name: 'Rodney', featherCount: 13217 }, { name: 'Ellis', featherCount: 11992 }], ({name}) => name)
 * duckMap.get({name: 'Ellis'}) // { name: 'Ellis', featherCount: 11992 }
 */
class SelfCanonMap extends CanonMap {
    constructor(pick, entries) {
        const unwrappedEntries = mapIterable(entries || [], i => [i, i]);
        const canonizer = canonizeByPick(null, pick);
        super(unwrappedEntries, canonizer);
    }
    /**
     * Adds the value to the SelfCanonMap.
     * If any value collides with its canonization, that value will be overwritten.
     *
     * @param {T} val The value to set.
     * @returns the SelfCanonMap object.
     */
    add(val) {
        // @ts-ignore
        this.set(val, val);
        return this;
    }
    /**
     * Adds values to the SelfCanonMap.
     * If any value collides with its canonization, that value will be overwritten.
     *
     * @param {T} vals The values to add.
     * @returns the SelfCanonMap object.
     */
    fill(vals) {
        for (const val of vals) {
            // @ts-ignore
            this.add(val);
        }
        return this;
    }
}
exports.SelfCanonMap = SelfCanonMap;
