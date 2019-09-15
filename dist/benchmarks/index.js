"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pipeable_1 = require("fp-ts/lib/pipeable");
const fs = require("fs");
const path_1 = require("path");
const iterable_1 = require("../iterable");
function chars(chars, num = 1) {
    return pipeable_1.pipe(iterable_1.repeat(chars), x => iterable_1.take(x, num), iterable_1.collect, x => x.join(""));
}
fs.readdirSync(__dirname).forEach(flatFilename => {
    if (flatFilename !== "index.ts") {
        console.log(`${chars("=", 20)} ${flatFilename.split(".")[0]} ${chars("=", 20)}`);
        require(path_1.join(__dirname, flatFilename));
    }
});
