"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("types/utils");
const none = {
    isSome: false
};
function foldOption(opt, some, none) {
    if (opt.isSome) {
        return some(opt.value);
    }
    else {
        return none();
    }
}
async function queryMapper({ finalized }, switchboard, underlyingMap, some, none, key) {
    if (finalized || underlyingMap.has(key)) {
        return underlyingMap.has(key) ? some(underlyingMap.get(key))
            : none();
    }
    else {
        const resolvers = switchboard.get(key) || [];
        const promise = new Promise(resolve => resolvers.push((opt) => resolve(foldOption(opt, some, none))));
        switchboard.set(key, resolvers);
        return promise;
    }
}
function eventualMap(stream, { reconciler, seed } = {}) {
    const underlyingMap = seed || new Map();
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
        const newValue = reconciler
            ? reconciler(underlyingMap.get(key), value, key)
            : underlyingMap.has(key)
                ? underlyingMap.get(key)
                : value;
        underlyingMap.set(key, newValue);
        if (switchboard.has(key)) {
            utils_1.defined(switchboard.get(key)).map(resolver => resolver({
                isSome: true,
                value: newValue
            }));
        }
    }).then(() => {
        switchboard.forEach((resolvers) => {
            resolvers.map(resolver => resolver(none));
        });
        resolveFinalMapPromise(underlyingMap);
    });
    return {
        get: (key) => queryMapper(finalizedWrapper, switchboard, underlyingMap, some => some, () => undefined, key),
        has: (key) => queryMapper(finalizedWrapper, switchboard, underlyingMap, () => true, () => false, key),
        getOrElse: (key, substitute) => queryMapper(finalizedWrapper, switchboard, underlyingMap, (val) => val, () => substitute(key), key),
        getOrVal: (key, substitute) => queryMapper(finalizedWrapper, switchboard, underlyingMap, (val) => val, () => substitute, key),
        getOrFail: (key, error) => queryMapper(finalizedWrapper, switchboard, underlyingMap, (val) => val, () => {
            throw new Error(typeof error === "function"
                ? error(key)
                : typeof error === "undefined"
                    ? `Map has no entry ${key}`
                    : error);
        }, key),
        foldingGet(key, some, none) {
            return queryMapper(finalizedWrapper, switchboard, underlyingMap, some, none, key);
        },
        getNow(key) {
            return underlyingMap.get(key);
        },
        hasNow(key) {
            return underlyingMap.has(key);
        },
        underlyingMap,
        finalMap: finalMapPromise
    };
}
exports.eventualMap = eventualMap;
