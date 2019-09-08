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
class BiMap extends Map {
    constructor(forward, reverse) {
        super();
        if (forward) {
            for (let entry of forward) {
                const [key, value] = entry;
                super.set(key, value);
            }
        }
        this._reverse = reverse
            ? new Map(reverse)
            : maps_1.mapCollect(maps_1.reverseMap(forward || []));
    }
    get reversed() {
        return this._reversedProxy || (this._reversedProxy = getReversedBiMap(this));
    }
    set(key, val) {
        if (this._reverse.has(val)) {
            this.delete(this._reverse.get(val));
        }
        super.set(key, val);
        this._reverse.set(val, key);
        return this;
    }
    clear() {
        super.clear();
        this._reverse.clear();
    }
    delete(key) {
        if (super.has(key)) {
            const valueAt = super.get(key);
            this._reverse.delete(valueAt);
        }
        return super.delete(key);
    }
    getKey(val) {
        return this._reverse.get(val);
    }
    deleteVal(val) {
        return maps_1.foldingGet(this._reverse, val, key => this.delete(key), () => false);
    }
    hasVal(val) {
        return this._reverse.has(val);
    }
}
exports.BiMap = BiMap;
