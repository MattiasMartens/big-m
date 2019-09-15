"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const benchmark_1 = require("benchmark");
const exports_1 = require("exports");
const pipeable_1 = require("fp-ts/lib/pipeable");
const iterable_1 = require("../iterable");
const mapFn = ((i) => [Math.round(Math.random() * 10), i]);
const array = pipeable_1.pipe(iterable_1.series(), a => iterable_1.take(a, 100000), a => iterable_1.map(a, v => mapFn(v)), iterable_1.collect);
const map1 = iterable_1.collect(array);
const biMap = new exports_1.BiMap(map1);
const suite = new benchmark_1.Suite;
suite
    .add('New BiMap', () => {
    new exports_1.BiMap(biMap);
})
    .add('New BiMap manual', () => {
    new exports_1.BiMap(map1);
})
    .on('cycle', function (event) {
    console.log(String(event.target));
})
    .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
})
    .run({ 'async': false });
