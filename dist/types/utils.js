"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function defined(t, errorMessage) {
    if (t === undefined) {
        throw new Error(errorMessage || "Value was undefined but asserted to be defined.");
    }
    else {
        return t;
    }
}
exports.defined = defined;
function isDefined(t) {
    return t !== undefined;
}
exports.isDefined = isDefined;
function notNullOrUndefined(t, errorMessage) {
    if (t === undefined || t === null) {
        throw new Error(errorMessage || "Value was null or undefined.");
    }
    else {
        return t;
    }
}
exports.notNullOrUndefined = notNullOrUndefined;
function tuple(arr) {
    return arr;
}
exports.tuple = tuple;
