"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tuple = exports.notNullOrUndefined = exports.isDefined = exports.defined = exports.buildError = exports.some = exports.none = exports.identity = void 0;
exports.identity = (t) => t;
exports.none = { _tag: 'None' };
exports.some = (value) => ({ _tag: 'Some', value });
function buildError(errorBuilder, ...input) {
    if (typeof errorBuilder === 'string') {
        return new Error(errorBuilder);
    }
    else if (errorBuilder instanceof Error) {
        return errorBuilder;
    }
    else {
        const yielded = errorBuilder(...input);
        if (typeof yielded === 'string') {
            return new Error(yielded);
        }
        else {
            return yielded;
        }
    }
}
exports.buildError = buildError;
function defined(t, errorBuilder = "Value was undefined but asserted to be defined.") {
    if (t === undefined) {
        throw buildError(errorBuilder);
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
function notNullOrUndefined(t, errorBuilder = t => `Value was unexpectedly ${t}.`) {
    if (t === undefined || t === null) {
        throw buildError(errorBuilder, t);
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
