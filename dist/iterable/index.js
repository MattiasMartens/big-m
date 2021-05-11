"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectInto = exports.collect = exports.slice = exports.repeat = exports.take = exports.series = exports.entries = exports.filter = exports.flatMap = exports.forEach = exports.combine = exports.map = void 0;
const utils_1 = require("../types/utils");
function* map(arr, fn) {
    for (let val of arr) {
        yield fn(val);
    }
}
exports.map = map;
function* combine(...arrs) {
    for (let arr of arrs) {
        yield* arr;
    }
}
exports.combine = combine;
function forEach(arr, fn) {
    for (let val of arr) {
        fn(val);
    }
}
exports.forEach = forEach;
function* flatMap(arr, fn) {
    for (let val of arr) {
        yield* fn(val);
    }
}
exports.flatMap = flatMap;
function* filter(arr, fn) {
    for (let val of arr) {
        if (fn(val)) {
            yield val;
        }
    }
}
exports.filter = filter;
function* entries(obj) {
    for (let key in obj) {
        yield utils_1.tuple([key, obj[key]]);
    }
}
exports.entries = entries;
function* series(start = 0, step = 1) {
    let i = start;
    while (true) {
        yield i;
        i += step;
    }
}
exports.series = series;
function* take(arr, num = 1) {
    let i = 0;
    for (let val of arr) {
        if (i++ < num) {
            yield val;
        }
        else {
            return;
        }
    }
}
exports.take = take;
function* repeat(arr) {
    while (true) {
        yield* arr;
    }
}
exports.repeat = repeat;
function* slice(arr, start = 0, end = Infinity) {
    let i = 0;
    for (let val of arr) {
        if (i >= start && i < end) {
            i++;
            yield val;
        }
        else {
            return;
        }
    }
}
exports.slice = slice;
function collect(arr) {
    return collectInto(arr, []);
}
exports.collect = collect;
function collectInto(arr, into) {
    for (let val of arr) {
        into.push(val);
    }
    return into;
}
exports.collectInto = collectInto;
