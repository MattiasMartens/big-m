"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const benchmark_1 = require("benchmark");
const pipeable_1 = require("fp-ts/lib/pipeable");
const maps_1 = require("../exports/maps");
const iterable_1 = require("../iterable");
const suite = new benchmark_1.Suite;
const mapFn = ((i) => [Math.round(Math.random() * 10), i]);
const array = pipeable_1.pipe(iterable_1.series(), a => iterable_1.take(a, 100000), a => iterable_1.map(a, v => mapFn(v)), iterable_1.collect);
suite
    .add('Collect map reconciling manual', () => {
    const map = new Map();
    array.forEach(entry => {
        map.has(entry[0])
            ? map.get(entry[0]).push(entry[1])
            : map.set(entry[0], [entry[1]]);
    });
})
    .add('Collect map reconcile', () => {
    maps_1.mapCollect(array, maps_1.reconcileAppend());
})
    .on('cycle', function (event) {
    console.log(String(event.target));
})
    .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
})
    .run({ 'async': false });
