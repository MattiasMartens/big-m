"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const maps_1 = require("./maps");
const utils_1 = require("types/utils");
async function streamCollectInto(stream, seed, reconcileFn) {
    if (reconcileFn) {
        await stream.forEach(entry => {
            const [key, val] = entry;
            seed.set(key, reconcileFn(seed.get(key), val, key));
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
                    const innerNewKey = bumper(newKey, attempts, maps_1.getOrFail(_underlyingMap, key), value);
                    if (innerNewKey === undefined) {
                        // Failed to set
                        break;
                    }
                    else if (!_underlyingMap.has(newKey)) {
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
                    ? `Map has no entry ${key}`
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
