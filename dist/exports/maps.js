"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bidirectional_1 = require("./bidirectional");
const utils_1 = require("./types/utils");
const iterable_1 = require("./iterable");
function mapStream(map) {
    return map.entries();
}
exports.mapStream = mapStream;
function mapCollectInto(iterable, seed, reconcileFn) {
    if (reconcileFn) {
        for (let entry of iterable) {
            const [key, val] = entry;
            seed.set(key, reconcileFn(seed.get(key), val, key));
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
function mapCollect(iterable, reconcileFn) {
    return mapCollectInto(iterable, new Map(), reconcileFn);
}
exports.mapCollect = mapCollect;
function biMapCollect(iterable, reconcileFn) {
    return mapCollectInto(iterable, new bidirectional_1.BiMap(), reconcileFn);
}
exports.biMapCollect = biMapCollect;
function reverseMap(iterable) {
    return iterable_1.map(iterable, ([k, t]) => [t, k]);
}
exports.reverseMap = reverseMap;
function mapValues(iterable, fn) {
    return iterable_1.map(iterable, ([key, val]) => [key, fn(val, key)]);
}
exports.mapValues = mapValues;
function keysOf(iterable) {
    return iterable_1.map(iterable, arr => arr[0]);
}
exports.keysOf = keysOf;
function valuesOf(iterable) {
    return iterable_1.map(iterable, arr => arr[1]);
}
exports.valuesOf = valuesOf;
function uniformMap(keys, of) {
    return iterable_1.map(keys, key => [key, of]);
}
exports.uniformMap = uniformMap;
function selectMap(iterable, filterFn) {
    return iterable_1.filter(iterable, ([key, val]) => filterFn(val, key));
}
exports.selectMap = selectMap;
function getOrVal(map, key, substitute) {
    if (map.has(key)) {
        return map.get(key);
    }
    else {
        return substitute;
    }
}
exports.getOrVal = getOrVal;
function foldingGet(map, key, ifPresent, ifAbsent = (() => { })) {
    if (map.has(key)) {
        return ifPresent(map.get(key), key);
    }
    else {
        return ifAbsent(key);
    }
}
exports.foldingGet = foldingGet;
function getOrElse(map, key, substitute) {
    if (map.has(key)) {
        return map.get(key);
    }
    else {
        return substitute(key);
    }
}
exports.getOrElse = getOrElse;
function getOrFail(map, key, error) {
    return getOrElse(map, key, (key) => {
        throw new Error(typeof error === "function"
            ? error(key)
            : typeof error === "undefined"
                ? `Map has no entry ${key}`
                : error);
    });
}
exports.getOrFail = getOrFail;
function flatMakeEntries(arr, expandFn) {
    return iterable_1.flatMap(arr, function* (t) {
        for (let entry of expandFn(t)) {
            yield entry;
        }
    });
}
exports.flatMakeEntries = flatMakeEntries;
function makeEntries(arr, mapFn) {
    return iterable_1.map(arr, mapFn);
}
exports.makeEntries = makeEntries;
function* squeezeDeepMap(deepMap) {
    for (let entry of deepMap) {
        const [_, val] = entry;
        if (val instanceof Map) {
            yield* squeezeDeepMap(val);
        }
        else {
            yield val;
        }
    }
}
exports.squeezeDeepMap = squeezeDeepMap;
function* deepMapStream(deepMap) {
    for (let entry of deepMap) {
        const [key, val] = entry;
        if ((val instanceof Map)) {
            yield* (iterable_1.map(deepMapStream(val), ([keys, val]) => utils_1.tuple([[key, ...keys], val])));
        }
        else {
            yield [[key], val];
        }
    }
}
exports.deepMapStream = deepMapStream;
function deepCollectInto(arr, seed, reconcileFn) {
    iterable_1.forEach(arr, ([keys, value]) => {
        if (!!keys && !!keys.length) {
            let deepReferenceTemp = seed;
            const keyFollow = keys.slice(0);
            while (keyFollow.length > 1) {
                const keyToFollow = keyFollow.splice(0, 1)[0];
                const deepReferenceAttempt = deepReferenceTemp.get(keyToFollow);
                if (!deepReferenceAttempt) {
                    const newMap = new Map();
                    deepReferenceTemp.set(keyToFollow, newMap);
                    deepReferenceTemp = newMap;
                }
                else {
                    deepReferenceTemp = deepReferenceAttempt;
                }
            }
            const deepestMap = utils_1.defined(deepReferenceTemp);
            const [lastKey] = keyFollow;
            const toSet = reconcileFn ? reconcileFn(deepestMap.get(lastKey), value, keys)
                : value;
            deepestMap.set(lastKey, toSet);
        }
    });
    return seed;
}
exports.deepCollectInto = deepCollectInto;
function deepCollect(arr, reconcileFn) {
    return deepCollectInto(arr, new Map(), reconcileFn);
}
exports.deepCollect = deepCollect;
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
function reconcileAppendFlat(mapFn = (val) => val) {
    return function (collidingValue, value) {
        const val = mapFn(value);
        if (collidingValue === undefined) {
            return val;
        }
        else {
            return [...collidingValue, ...val];
        }
    };
}
exports.reconcileAppendFlat = reconcileAppendFlat;
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
function reconcileDefault() {
    return function (_, value) {
        return value;
    };
}
exports.reconcileDefault = reconcileDefault;
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
function invertBinMap(map) {
    return mapCollect(iterable_1.flatMap(map, ([key, arr]) => arr.map(t => utils_1.tuple([t, key]))), reconcileAppend());
}
exports.invertBinMap = invertBinMap;
function mapToDictionary(map, stringifier = String) {
    const ret = {};
    for (let entry of map) {
        const [key, val] = entry;
        ret[stringifier(key)] = val;
    }
    return ret;
}
exports.mapToDictionary = mapToDictionary;
function deepFoldingGet(map, lookup, ifPresent, ifAbsent) {
    const follow = lookup.slice();
    const matched = [];
    let innerMap = map;
    while (follow.length) {
        const [key] = follow.splice(0, 1);
        if (innerMap.has(key)) {
            matched.push(key);
            const value = innerMap.get(key);
            if (follow.length) {
                if (value instanceof Map) {
                    innerMap = value;
                }
                else {
                    return ifAbsent(lookup, matched);
                }
            }
            else {
                return ifPresent(value, lookup);
            }
        }
        else {
            return ifAbsent(lookup, matched);
        }
    }
    return ifAbsent(lookup, matched);
}
exports.deepFoldingGet = deepFoldingGet;
function deepGet(map, lookup) {
    const follow = lookup.slice();
    let innerMap = map;
    while (follow.length) {
        const [key] = follow.splice(0, 1);
        if (innerMap.has(key)) {
            const value = innerMap.get(key);
            if (follow.length) {
                if (value instanceof Map) {
                    innerMap = value;
                }
                else {
                    return undefined;
                }
            }
            else {
                return value;
            }
        }
        else {
            return undefined;
        }
    }
    return undefined;
}
exports.deepGet = deepGet;
function deepGetOrVal(map, lookup, substitute) {
    const follow = lookup.slice();
    let innerMap = map;
    while (follow.length) {
        const [key] = follow.splice(0, 1);
        if (innerMap.has(key)) {
            const value = innerMap.get(key);
            if (follow.length) {
                if (value instanceof Map) {
                    innerMap = value;
                }
                else {
                    return substitute;
                }
            }
            else {
                return value;
            }
        }
        else {
            return substitute;
        }
    }
    return substitute;
}
exports.deepGetOrVal = deepGetOrVal;
function deepGetOrElse(map, lookup, substituteFn) {
    const follow = lookup.slice();
    const matched = [];
    let innerMap = map;
    while (follow.length) {
        const [key] = follow.splice(0, 1);
        if (innerMap.has(key)) {
            matched.push(key);
            const value = innerMap.get(key);
            if (follow.length) {
                if (value instanceof Map) {
                    innerMap = value;
                }
                else {
                    return substituteFn(lookup, matched);
                }
            }
            else {
                return value;
            }
        }
        else {
            return substituteFn(lookup, matched);
        }
    }
    return substituteFn(lookup, matched);
}
exports.deepGetOrElse = deepGetOrElse;
function deepGetOrFail(map, lookup, error) {
    return deepGetOrElse(map, lookup, (lookup, matched) => {
        throw new Error(typeof error === "function"
            ? error(lookup, matched)
            : typeof error === "undefined"
                ? `Deep lookup failed on keys [${lookup}], keys matched were [${matched}]`
                : error);
    });
}
exports.deepGetOrFail = deepGetOrFail;
function deepHas(map, lookup, error) {
    const follow = lookup.slice();
    const matched = [];
    let innerMap = map;
    while (follow.length) {
        const [key] = follow.splice(0, 1);
        if (innerMap.has(key)) {
            matched.push(key);
            const value = innerMap.get(key);
            if (follow.length) {
                if (value instanceof Map) {
                    innerMap = value;
                }
                else {
                    return false;
                }
            }
            else {
                return true;
            }
        }
        else {
            return false;
        }
    }
    return false;
}
exports.deepHas = deepHas;
function deepMapToDictionaryRecurse(map, depth, stringifier) {
    const ret = {};
    for (let entry of map) {
        const [key, val] = entry;
        const outVal = val instanceof Map ? deepMapToDictionaryRecurse(val, depth + 1, stringifier)
            : val;
        ret[stringifier(key, depth)] = outVal;
    }
    return ret;
}
function deepMapToDictionary(map, stringifier = String) {
    return deepMapToDictionaryRecurse(map, 0, stringifier);
}
exports.deepMapToDictionary = deepMapToDictionary;
function deepDictionaryToMap(dictionary) {
    return iterable_1.flatMap(iterable_1.entries(dictionary), ([key, object]) => {
        if (object === null || typeof object !== "object" || Array.isArray(object) || object instanceof Date) {
            return [utils_1.tuple([[key], object])];
        }
        else {
            return iterable_1.map(deepDictionaryToMap(object), ([keys, object]) => utils_1.tuple([[key, ...keys], object]));
        }
    });
}
exports.deepDictionaryToMap = deepDictionaryToMap;
