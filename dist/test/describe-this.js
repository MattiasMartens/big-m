"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("exports/types/utils");
function describeThis(thing, testFn) {
    const name = utils_1.defined(thing["name"], "Can't call describeThis on something anonymous");
    // @ts-ignore
    describe(name, () => testFn(thing));
}
exports.describeThis = describeThis;
