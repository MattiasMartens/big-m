"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventualMap = exports.streamCollect = exports.streamCollectInto = void 0;
const maps_1 = require("./maps");
const utils_1 = require("../types/utils");
/**
 * Insert the entries of a ReadableStream into `seed` with an optional Reconciler.
 *
 * @param {ReadableStream} stream The input stream.
 * @param {Map} seed The Map to update with the contents of `stream`.
 * @param {Reconciler} reconcileFn Function to call to resolve collisions.
 * @returns A promise of the updated map, to be returned when the ReadableStream closes.
 */
async function streamCollectInto(stream, seed, reconcileFn) {
    if (reconcileFn) {
        await stream.forEach(entry => {
            const [key, val] = entry;
            const reconciled = reconcileFn(seed.get(key), val, key);
            reconciled !== undefined && seed.set(key, reconciled);
        });
    }
    else {
        await stream.forEach(entry => {
            const [key, val] = entry;
            seed.set(key, val);
        });
    }
    return seed;
}
exports.streamCollectInto = streamCollectInto;
/**
 * Generate a new map from the ReadableStream of entries using an optional Reconciler.
 *
 * @param {ReadableStream} stream The input stream.
 * @param {Reconciler} reconcileFn Function to call to resolve collisions.
 * @returns A promise of the generated map, to be returned when the ReadableStream closes.
 */
function streamCollect(stream, reconcileFn) {
    return streamCollectInto(stream, new Map(), reconcileFn);
}
exports.streamCollect = streamCollect;
const none = {
    isSome: false
};
function some(val) {
    return {
        isSome: true,
        value: val
    };
}
function foldOption(opt, some, none) {
    if (opt.isSome) {
        return some(opt.value);
    }
    else {
        return none();
    }
}
async function getGetOrHasPromise({ finalized }, switchboard, underlyingMap, key) {
    if (finalized || underlyingMap.has(key)) {
        return underlyingMap.has(key) ? some(underlyingMap.get(key))
            : none;
    }
    else if (switchboard.has(key)) {
        return maps_1.getOrFail(switchboard, key)[0];
    }
    else {
        let resolver;
        const newPromise = new Promise(resolve => resolver = resolve);
        switchboard.set(key, [newPromise, utils_1.defined(resolver, "Resolver not properly captured from Promise, this might be due to an unexpected implementation of Promises")]);
        return newPromise;
    }
}
async function queryMap({ finalized }, switchboard, underlyingMap, onSome, onNone, key) {
    const ret = await getGetOrHasPromise({ finalized }, switchboard, underlyingMap, key);
    return foldOption(ret, onSome, onNone);
}
/**
 * Initialize an EventualMap from a stream of entries. An EventualMap is a Map-like object that returns Promises which resolve as soon as possible.
 *
 * - If a request comes in for a key that has already been loaded in from the stream, it resolves immediately with that value.
 *
 * - If a request comes in before the corresponding entry arrives, it is added to a queue.
 *
 * - When the entry with the request key comes in, the Promise resolves with that value.
 *
 * - If the stream ends, and the requested key has not arrived in the stream, the Promise resolves with `undefined`.
 *
 * @remarks
 * To ensure the correctness of early `get` calls, the eventualMap does not allow existing values to be overwritten.
 * Instead, collisions can be resolved by modifying the incoming key using the `bumper` option.
 * If the `bumper` returns `undefined`, the second entry to arrive is simply ignored.
 *
 * @param {Stream.ReadableStream} stream The input stream to draw the entries from.
 * @param {object} opts
 * - bumper The function to call on key collisions to get a new key for the colliding entry.
 * By default, after a key arrives, subsequent entries with the same key will be discarded.
 * - seed The Map to load entries into. By default, generates a new Map.
 *
 * @returns A Map that is in the process of being built from a Stream.
 *
 * @method get Return the value that will eventually be at the key.
 * @method has Return `true` if the key is eventually set, `false` if it is not set before the input stream ends.
 * @method getOrElse Return the value that will eventually be at the key, or the result of calling the argument function `substitute` if the key is not set before the input stream ends.
 * @method getOrVal Return the value that will eventually be at the key, or `substitute` if the key is not set before the input stream ends.
 * @method getOrFail Return the value that will eventually be at the key or throw an error if the key is not set before the input stream ends.
 * @method foldingGet Return the result of calling `some` on the input value when the key is set, the result of calling `none` if the result is not set before the input stream ends.
 * @method getNow Immediately return the value that is at the key whether the input stream has ended or not.
 * @method hasNow Return `true` if the key is set now, `false` otherwise.
 * @field _underlyingMap The Map that is being populated with Stream entries.
 * This must be accessed with caution as mutating operations on `_underlyingMap`, like `set` and `delete`, destroy all correctness guarantees for the other methods.
 * @field finalMap A Promise resolving to `underlyingMap` when the input stream ends.
 */
function EventualMap(stream, { bumper, seed } = {}) {
    const _underlyingMap = seed || new Map();
    const switchboard = new Map();
    let resolveFinalMapPromise;
    let finalizedWrapper = {
        finalized: false
    };
    const finalMapPromise = new Promise((resolve, _) => {
        resolveFinalMapPromise = (val) => {
            finalizedWrapper.finalized = true;
            resolve(val);
        };
    });
    stream.forEach(([key, value]) => {
        let keyToUse;
        if (_underlyingMap.has(key)) {
            if (bumper) {
                let newKey = key;
                let attempts = 0;
                do {
                    attempts++;
                    const innerNewKey = bumper(newKey, attempts, key, maps_1.getOrFail(_underlyingMap, key), value);
                    if (innerNewKey === undefined) {
                        // Failed to set
                        break;
                    }
                    else if (!_underlyingMap.has(innerNewKey)) {
                        _underlyingMap.set(innerNewKey, value);
                        break;
                    }
                    else {
                        newKey = innerNewKey;
                    }
                } while (!!newKey);
            }
            else {
                keyToUse = undefined;
            }
        }
        else {
            keyToUse = key;
        }
        if (!!keyToUse) {
            _underlyingMap.set(keyToUse, value);
            maps_1.foldingGet(switchboard, keyToUse, ([_, resolver]) => resolver(some(value)));
        }
    }).then(() => {
        switchboard.forEach(([_, resolver]) => resolver(none));
        resolveFinalMapPromise(_underlyingMap);
    });
    return {
        get: (key) => queryMap(finalizedWrapper, switchboard, _underlyingMap, some => some, () => undefined, key),
        has: (key) => queryMap(finalizedWrapper, switchboard, _underlyingMap, () => true, () => false, key),
        getOrElse: (key, substitute) => queryMap(finalizedWrapper, switchboard, _underlyingMap, (val) => val, () => substitute(key), key),
        getOrVal: (key, substitute) => queryMap(finalizedWrapper, switchboard, _underlyingMap, (val) => val, () => substitute, key),
        getOrFail: (key, error) => queryMap(finalizedWrapper, switchboard, _underlyingMap, (val) => val, () => {
            throw new Error(typeof error === "function"
                ? error(key)
                : typeof error === "undefined"
                    ? `Map has no entry "${key}"`
                    : error);
        }, key),
        foldingGet(key, some, none) {
            return queryMap(finalizedWrapper, switchboard, _underlyingMap, some, none, key);
        },
        getNow(key) {
            return _underlyingMap.get(key);
        },
        hasNow(key) {
            return _underlyingMap.has(key);
        },
        _underlyingMap,
        finalMap: finalMapPromise
    };
}
exports.EventualMap = EventualMap;
