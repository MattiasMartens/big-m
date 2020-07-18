"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const maps_1 = require("../exports/maps");
function getReversedBiMap(biMap) {
    return new Proxy(biMap._reverse, {
        get(target, p) {
            if (p === "reversed") {
                return biMap;
            }
            else if (p === "set") {
                return (key, val) => biMap.set(val, key);
            }
            else if (p === "clear") {
                return () => biMap.clear();
            }
            else if (p === "delete") {
                return (key) => maps_1.foldingGet(target, key, (val) => biMap.delete(val));
            }
            else if (p === "hasVal") {
                return (val) => biMap.has(val);
            }
            else if (p === "deleteVal") {
                return (val) => biMap.delete(val);
            }
            else if (p === "getKey") {
                return (val) => biMap.get(val);
            }
            else {
                const field = target[p];
                if (typeof field === "function") {
                    return field.bind(target);
                }
                else {
                    return field;
                }
            }
        }
    });
}
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
class BiMap extends Map {
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
    constructor(entries) {
        super();
        if (entries) {
            for (let entry of entries) {
                const [key, value] = entry;
                super.set(key, value);
            }
        }
        this._reverse = entries instanceof BiMap
            ? new Map(entries._reverse)
            : maps_1.mapCollect(maps_1.reverseMap(entries || []));
    }
    /**
     * Access the reversed map.
     * This makes some operations very simple, like `biMap.reversed.entries()` to get a list of value-to-key tuples for downstream processing.
     *
     * @remarks
     * The implementation of BiMap maintains two maps in tandem, the original map and the reversed map, so accessing this is a cheap operation.
     *
     * @returns BiMap
     */
    get reversed() {
        return this._reversedProxy || (this._reversedProxy = getReversedBiMap(this));
    }
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
    set(key, val) {
        if (this._reverse.has(val)) {
            this.delete(this._reverse.get(val));
        }
        super.set(key, val);
        this._reverse.set(val, key);
        return this;
    }
    /**
     * Removes all key/value pairs from the BiMap object.
     */
    clear() {
        super.clear();
        this._reverse.clear();
    }
    /**
     * Delete the key-value pair associated with `key`.
     * Does nothing if that entry is not present.
     *
     * @param {K} key The key to delete.
     * @returns `true` if an element in the Map object existed and has been removed, `false` if the element does not exist.
     */
    delete(key) {
        if (super.has(key)) {
            const valueAt = super.get(key);
            this._reverse.delete(valueAt);
        }
        return super.delete(key);
    }
    /**
     * Return the key associated to `value`, or `undefined` if there is none.
     *
     * @param {T} val The value to look up.
     */
    getKey(val) {
        return this._reverse.get(val);
    }
    /**
     * Delete the key-value pair associated with `val`.
     * Do nothing if that entry is not present.
     *
     * @param {T} val The value to delete.
     * @returns `true` if an element in the Map object existed and has been removed, `false` if the element does not exist.
     */
    deleteVal(val) {
        return maps_1.foldingGet(this._reverse, val, key => this.delete(key), () => false);
    }
    /**
     * Check for the presence of a value in the Map.
     *
     * @param val The value to look up.
     * @returns A boolean asserting whether a key has been associated to `val` in the Map object or not.
     */
    hasVal(val) {
        return this._reverse.has(val);
    }
}
exports.BiMap = BiMap;
