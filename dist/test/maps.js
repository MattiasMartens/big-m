"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const should = require("should");
const pipeable_1 = require("fp-ts/lib/pipeable");
const bidirectional_1 = require("../exports/bidirectional");
const maps_1 = require("../exports/maps");
const utils_1 = require("../types/utils");
const describe_this_1 = require("./describe-this");
const iterable_1 = require("iterable");
// Have to require should to monkey-patch it onto objects,
// but have to import should to get the types. Yuck!
require('should');
describe_this_1.describeThis(maps_1.reconcileAdd, (subject) => {
    it('Should be useable to compose a map by adding numbers with matching keys', () => {
        const reconciler = subject();
        reconciler(undefined, 2, "key").should.equal(2);
        reconciler(1, 2, "key").should.equal(3);
    });
    it('Should be useable to compose a map by adding values with matching keys after applying a number function', () => {
        const reconciler = subject((str) => str.length);
        reconciler(undefined, "cat", "key").should.equal(3);
        reconciler(1, "mouse", "key").should.equal(5 + 1);
    });
});
describe_this_1.describeThis(maps_1.reconcileConcat, () => {
    const map1 = new Map([[5, ["horse"]]]);
    const ret = maps_1.mapCollectInto([[3, ["cat", "dog"]], [5, ["mouse"]]], map1, maps_1.reconcileConcat());
    utils_1.defined(ret.get(3)).should.deepEqual(["cat", "dog"]);
    utils_1.defined(ret.get(5)).should.deepEqual(["horse", "mouse"]);
});
describe_this_1.describeThis(maps_1.reconcileAppend, () => {
    it("Should be useable to append individual values to arrays stored in a map on collision", () => {
        const map1 = new Map([[5, ["horse"]]]);
        const ret = maps_1.mapCollectInto([[3, "cat"], [5, "mouse"]], map1, maps_1.reconcileAppend());
        utils_1.defined(ret.get(3)).should.deepEqual(["cat"]);
        utils_1.defined(ret.get(5)).should.deepEqual(["horse", "mouse"]);
    });
    it("Should be useable to append individual values to arrays with a mapper", () => {
        const map1 = new Map([[5, ["horse"]]]);
        const ret = maps_1.mapCollectInto([[3, "cat"], [5, "mouse"]], map1, maps_1.reconcileAppend(val => val.split("").reverse().join("")));
        utils_1.defined(ret.get(3)).should.deepEqual(["tac"]);
        utils_1.defined(ret.get(5)).should.deepEqual(["horse", "esuom"]);
    });
});
describe_this_1.describeThis(maps_1.reconcileDefault, () => {
    it("Should emulate default Map behaviour by overwriting existing values at keys", () => {
        const map1 = new Map([[5, ["horse"]]]);
        const ret = maps_1.mapCollectInto([[3, "cat"], [5, "mouse"]], map1, maps_1.reconcileDefault());
        utils_1.defined(ret.get(3)).should.deepEqual("cat");
        utils_1.defined(ret.get(5)).should.deepEqual("mouse");
    });
});
describe_this_1.describeThis(maps_1.reconcileFirst, () => {
    it("Should reverse default Map behaviour by never overwriting existing values at keys", () => {
        const map1 = new Map([[5, "horse"]]);
        const ret = maps_1.mapCollectInto([[3, "cat"], [5, "mouse"]], map1, maps_1.reconcileFirst());
        utils_1.defined(ret.get(3)).should.deepEqual("cat");
        utils_1.defined(ret.get(5)).should.deepEqual("horse");
    });
});
describe('collect', function () {
    it('Should turn an array of entries into a map', function () {
        const ret = maps_1.mapCollect([["a", 1], ["b", 2]]);
        utils_1.defined(ret.get("a")).should.equal(1);
        utils_1.defined(ret.get("b")).should.equal(2);
    });
    it('Should turn a map into a new map', function () {
        const map1 = new Map([["a", 7], ["b", 8]]);
        const ret = maps_1.mapCollect(map1);
        ret.should.not.equal(map1);
        utils_1.defined(ret.get("a")).should.equal(7);
        utils_1.defined(ret.get("b")).should.equal(8);
    });
    it('Should turn an iterator into a map', function () {
        const ret = maps_1.mapCollect([["a", 7], ["b", 8]][Symbol.iterator]());
        utils_1.defined(ret.get("a")).should.equal(7);
        utils_1.defined(ret.get("b")).should.equal(8);
    });
    it('Should turn an array into a map and by default on key collision overwrite earlier entries', function () {
        const ret = maps_1.mapCollect([["a", 7], ["b", 8], ["a", 65]]);
        utils_1.defined(ret.get("a")).should.equal(65);
        utils_1.defined(ret.get("b")).should.equal(8);
    });
    it('Should turn an array into a map and given a reconciler combine entries on key collision', function () {
        const ret = maps_1.mapCollect([["a", 7], ["b", 8], ["a", 65]], (colliding, incoming) => (colliding || 0) + incoming);
        utils_1.defined(ret.get("a")).should.equal(65 + 7);
        utils_1.defined(ret.get("b")).should.equal(8);
    });
});
describe('collectBiMap', function () {
    it('Should turn an array of entries into a bidirectional map', function () {
        const ret = maps_1.biMapCollect([["a", 1], ["b", 2]]);
        ret.should.be.instanceOf(bidirectional_1.BiMap);
        utils_1.defined(ret.get("a")).should.equal(1);
        utils_1.defined(ret.get("b")).should.equal(2);
    });
    it('Should turn an array into a bidirectional map and by default on key collision overwrite earlier entries', function () {
        const ret = maps_1.biMapCollect([["a", 7], ["b", 8], ["a", 65]]);
        ret.should.be.instanceOf(bidirectional_1.BiMap);
        utils_1.defined(ret.get("a")).should.equal(65);
        utils_1.defined(ret.get("b")).should.equal(8);
    });
    it('Should turn an array into a bidirectional map and given a reconciler combine entries on key collision', function () {
        const ret = maps_1.biMapCollect([["a", 7], ["b", 8], ["a", 65]], (colliding, incoming) => (colliding || 0) + incoming);
        ret.should.be.instanceOf(bidirectional_1.BiMap);
        utils_1.defined(ret.get("a")).should.equal(65 + 7);
        utils_1.defined(ret.get("b")).should.equal(8);
    });
});
describe('collectInto', function () {
    it('Should add an array of entries to a map', function () {
        const map1 = new Map();
        const ret = maps_1.mapCollectInto([["a", 1], ["b", 2]], map1);
        map1.should.equal(ret);
        utils_1.defined(map1.get("a")).should.equal(1);
        utils_1.defined(map1.get("b")).should.equal(2);
    });
    it('Should add the entries of a map to a new map', function () {
        const map1 = new Map();
        const map2 = new Map([["a", 7], ["b", 8]]);
        const ret = maps_1.mapCollectInto(map1, map2);
        ret.should.equal(map2);
        utils_1.defined(ret.get("a")).should.equal(7);
        utils_1.defined(ret.get("b")).should.equal(8);
    });
    it('Should add the entries of an iterator into a map', function () {
        const map1 = new Map();
        const ret = maps_1.mapCollectInto([["a", 7], ["b", 8]][Symbol.iterator](), map1);
        ret.should.equal(map1);
        utils_1.defined(ret.get("a")).should.equal(7);
        utils_1.defined(ret.get("b")).should.equal(8);
    });
    it('Should add an array of entries into a map and given a reconciler combine entries on key collision', function () {
        const map1 = new Map([["b", 1]]);
        const ret = maps_1.mapCollectInto([["a", 7], ["b", 8], ["a", 65]], map1, (colliding, incoming) => (colliding || 0) + incoming);
        ret.should.equal(map1);
        utils_1.defined(ret.get("a")).should.equal(65 + 7);
        utils_1.defined(ret.get("b")).should.equal(8 + 1);
    });
});
describe("counterReconciler", () => {
    it("Should be useable to count entries with matching keys", () => {
        const map1 = new Map([[5, 1]]);
        const ret = maps_1.mapCollectInto([[3, "cat"], [5, "mouse"]], map1, maps_1.reconcileCount());
        utils_1.defined(ret.get(3)).should.equal(1);
        utils_1.defined(ret.get(5)).should.equal(2);
    });
});
describe('flatMakeEntries', () => {
    it('Should transform a stream of inputs into a sequence of arbitrary length using a key-list function', () => {
        const ret = maps_1.flatMakeEntries([
            "cat",
            "dog",
            "squirrel",
            "alpaca"
        ], str => str.slice(0, str.length % 3).split("").map((c, i) => [c, str.length]));
        iterable_1.collect(ret).should.deepEqual([
            ["s", 8],
            ["q", 8]
        ]);
    });
});
describe('foldingGet', () => {
    it('Should run one function if the key is present', () => {
        const map1 = new Map([[5, 9]]);
        const ret = maps_1.foldingGet(map1, 5, (val) => val + 99, () => 996);
        ret.should.equal(9 + 99);
    });
    it('Should run another function if the key is absent', () => {
        const map1 = new Map([[5, 9]]);
        const ret = maps_1.foldingGet(map1, 7, () => 99, () => 996);
        ret.should.equal(996);
    });
});
describe('foldReconciler', () => {
    it('Should allow construction of a map using one function for each case of colliding value, no colliding value', () => {
        const reconciler = maps_1.reconcileFold((val) => 2 * val, (colliding, val) => colliding + val);
        const ret = maps_1.mapCollect([
            ["a", 1],
            ["b", 2],
            ["b", 3]
        ], reconciler);
        utils_1.defined(ret.get("a")).should.equal(2);
        utils_1.defined(ret.get("b")).should.equal(7);
    });
});
describe('getOrElse', () => {
    it('Should return value if the key is present', () => {
        const map1 = new Map([[5, 9]]);
        const ret = maps_1.getOrElse(map1, 5, () => 99);
        ret.should.equal(9);
    });
    it('Should run a function if the key is absent', () => {
        const map1 = new Map([[5, 9]]);
        const ret = maps_1.getOrElse(map1, 7, () => 99);
        ret.should.equal(99);
    });
});
describe('getOrFail', () => {
    it('Should return value if the key is present', () => {
        const map1 = new Map([[5, 9]]);
        const ret = maps_1.getOrFail(map1, 5);
        ret.should.equal(9);
    });
    it('Should throw error if key is absent', () => {
        const map1 = new Map([[5, 9]]);
        try {
            maps_1.getOrFail(map1, 6);
            should.fail(false, false, "Should have failed by now");
        }
        catch (e) {
            e.should.key("message").equal("Map has no entry 6");
        }
    });
    it('Should throw custom function error if key is absent', () => {
        const map1 = new Map([[5, 9]]);
        try {
            maps_1.getOrFail(map1, 6, key => JSON.stringify({ key }));
            should.fail(false, false, "Should have failed by now");
        }
        catch (e) {
            JSON.parse(e.message).should.deepEqual({
                key: 6
            });
        }
    });
    it('Should throw custom error if key is absent', () => {
        const map1 = new Map([[5, 9]]);
        try {
            maps_1.getOrFail(map1, 6, "Dag nabbit");
            should.fail(false, false, "Should have failed by now");
        }
        catch (e) {
            e.should.have.key("message").equal("Dag nabbit");
        }
    });
});
describe('getOrVal', () => {
    it('Should return value if the key is present', () => {
        const map1 = new Map([[5, 9]]);
        const ret = maps_1.getOrVal(map1, 5, 777);
        ret.should.equal(9);
    });
    it('Should return substitute if the key is absent', () => {
        const map1 = new Map([[5, 9]]);
        const ret = maps_1.getOrVal(map1, 7, 777);
        ret.should.equal(777);
    });
});
describe('invertBinMap', () => {
    it('Should convert map of arrays Map<A, B[]> to map of arrays Map<B, A[]>', () => {
        const map1 = new Map([[5, [9, 10]], [22, [9]]]);
        const ret = maps_1.invertBinMap(map1);
        maps_1.getOrFail(ret, 9).should.deepEqual([5, 22]);
        maps_1.getOrFail(ret, 10).should.deepEqual([5]);
        ret.has(5).should.false();
        ret.has(22).should.false();
    });
});
describe('keysOf', () => {
    it('Should convert stream of entries to stream of keys', () => {
        const map1 = new Map([[9, "blueberry"], [6, "almond"], [4, "plum"]]);
        iterable_1.collect(maps_1.keysOf(map1)).should.deepEqual([9, 6, 4]);
    });
});
describe('makeEntries', () => {
    it('Should transform an array of values into a stream of map entries using a key function', () => {
        const ret = pipeable_1.pipe(maps_1.makeEntries([
            "cat",
            "dog",
            "squirrel",
            "alpaca"
        ], str => [str.length, str]), (arr) => iterable_1.filter(arr, ([key]) => key % 2 === 0), iterable_1.collect);
        ret.should.deepEqual([
            [8, "squirrel"],
            [6, "alpaca"]
        ]);
    });
});
describe('mapStream', () => {
    it('Should transform a map into a stream of values as a thin wrapper over the native function', () => {
        const map1 = new Map([["a", 5], ["b", 6]]);
        const ret = iterable_1.collect(map1);
        ret.should.deepEqual([
            ["a", 5],
            ["b", 6]
        ]);
    });
});
describe('mapToDictionary', () => {
    it('Should transform a map into a dictionary', () => {
        const map1 = new Map([["a", 5], ["b", 6]]);
        const ret = maps_1.mapToDictionary(map1);
        ret.should.deepEqual({
            a: 5,
            b: 6
        });
    });
    it('Should transform an array directly into a dictionary', () => {
        const ret = maps_1.mapToDictionary([["a", 5], ["b", 6]]);
        ret.should.deepEqual({
            a: 5,
            b: 6
        });
    });
});
describe('mapValues', () => {
    it('Should transform a map into a stream of map entries with a mapper function', () => {
        const map1 = new Map([["a", 5], ["b", 6]]);
        const ret = maps_1.mapValues(map1, x => Math.sqrt(x).toFixed(1));
        maps_1.mapToDictionary(ret).should.deepEqual({
            a: "2.2",
            b: "2.4"
        });
    });
});
describe('reverseMap', () => {
    it('Should transform a map Map<A, B> into its inverse Map<B, A>', () => {
        const map1 = new Map([["a", 5], ["b", 6]]);
        const ret = pipeable_1.pipe(maps_1.reverseMap(map1), iterable_1.collect);
        ret.should.deepEqual([
            [5, "a"],
            [6, "b"]
        ]);
    });
});
describe('selectMap', () => {
    it('Should produce a stream of map entries without those that fail the filter function', () => {
        const map1 = new Map([["a", 5], ["b", 6], ["a!", 9], ["b!", 10]]);
        const ret = pipeable_1.pipe(maps_1.selectMap(map1, (val, key) => {
            return key.includes("!") ? val % 2 === 0 : val % 2 === 1;
        }), iterable_1.collect);
        ret.should.deepEqual([
            ["a", 5],
            ["b!", 10]
        ]);
    });
});
describe('uniformMap', () => {
    it('Should transform an array of keys into a stream of map entries all with the same value', () => {
        const ret = pipeable_1.pipe(maps_1.uniformMap([
            "cat",
            "dog",
            "squirrel",
            "alpaca"
        ], 0), iterable_1.collect);
        ret.should.deepEqual([
            ["cat", 0],
            ["dog", 0],
            ["squirrel", 0],
            ["alpaca", 0]
        ]);
    });
});
describe('keysOf', () => {
    it('Should convert stream of entries to stream of values', () => {
        const map1 = new Map([[9, "blueberry"], [6, "almond"], [4, "plum"]]);
        iterable_1.collect(maps_1.valuesOf(map1)).should.deepEqual(["blueberry", "almond", "plum"]);
    });
});
describe_this_1.describeThis(maps_1.zipMapsIntersection, subject => {
    it('Should convert two maps into an iterable of entries including only keys they share and combining their values into tuples', () => {
        const map1 = new Map([[9, "blueberry"], [6, "almond"], [4, "plum"]]);
        const map2 = [[5, "a"], [6, "b"], [9, "a!"], [10, "b!"]];
        const result = subject(map1, map2);
        const resultAsMap = maps_1.mapCollect(result);
        should.equal(undefined, resultAsMap.get(4));
        should.equal(undefined, resultAsMap.get(10));
        maps_1.getOrFail(resultAsMap, 6).should.deepEqual(["almond", "b"]);
        maps_1.getOrFail(resultAsMap, 9).should.deepEqual(["blueberry", "a!"]);
    });
    it('Should convert two iterables of maps as above', () => {
        const map1 = [[9, "blueberry"], [6, "almond"], [4, "plum"]];
        const map2 = [[5, "a"], [6, "b"], [9, "a!"], [10, "b!"]];
        const result = subject(map1, map2);
        const resultAsMap = maps_1.mapCollect(result);
        should.equal(undefined, resultAsMap.get(4));
        should.equal(undefined, resultAsMap.get(10));
        maps_1.getOrFail(resultAsMap, 6).should.deepEqual(["almond", "b"]);
        maps_1.getOrFail(resultAsMap, 9).should.deepEqual(["blueberry", "a!"]);
    });
});
describe_this_1.describeThis(maps_1.zipMapsUnion, subject => {
    it('Should convert two maps into an iterable of entries including all common keys and combining their values into tuples', () => {
        const map1 = new Map([[9, "blueberry"], [6, "almond"], [4, "plum"]]);
        const map2 = new Map([[5, "a"], [6, "b"], [9, "a!"], [10, "b!"]]);
        const result = subject(map1, map2);
        const resultAsMap = maps_1.mapCollect(result);
        maps_1.getOrFail(resultAsMap, 4).should.deepEqual(["plum", undefined]);
        maps_1.getOrFail(resultAsMap, 6).should.deepEqual(["almond", "b"]);
        maps_1.getOrFail(resultAsMap, 9).should.deepEqual(["blueberry", "a!"]);
        maps_1.getOrFail(resultAsMap, 5).should.deepEqual([undefined, "a"]);
        maps_1.getOrFail(resultAsMap, 10).should.deepEqual([undefined, "b!"]);
    });
    it('Should convert two iterables of maps as above', () => {
        const map1 = [[9, "blueberry"], [6, "almond"], [4, "plum"]];
        const map2 = [[5, "a"], [6, "b"], [9, "a!"], [10, "b!"]];
        const result = subject(map1, map2);
        const resultAsMap = maps_1.mapCollect(result);
        maps_1.getOrFail(resultAsMap, 4).should.deepEqual(["plum", undefined]);
        maps_1.getOrFail(resultAsMap, 6).should.deepEqual(["almond", "b"]);
        maps_1.getOrFail(resultAsMap, 9).should.deepEqual(["blueberry", "a!"]);
        maps_1.getOrFail(resultAsMap, 5).should.deepEqual([undefined, "a"]);
        maps_1.getOrFail(resultAsMap, 10).should.deepEqual([undefined, "b!"]);
    });
});
describe_this_1.describeThis(maps_1.mapCollectBumping, subject => {
    it('Should accumulate a map by bumping colliding keys to new keys', () => {
        debugger;
        const result = maps_1.mapCollectBumping([
            [1, "me"],
            [2, "too"],
            [1, "it"],
            [2, "is"],
            [3, "true"]
        ], colliding => colliding + 1);
        console.log(JSON.stringify(Array.from(result.entries())));
        maps_1.getOrFail(result, 1).should.equal("me");
        maps_1.getOrFail(result, 2).should.equal("too");
        maps_1.getOrFail(result, 3).should.equal("it");
        maps_1.getOrFail(result, 4).should.equal("is");
        maps_1.getOrFail(result, 5).should.equal("true");
    });
});
