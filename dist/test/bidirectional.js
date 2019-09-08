"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bidirectional_1 = require("../exports/bidirectional");
const utils_1 = require("../exports/types/utils");
const describe_this_1 = require("./describe-this");
const iterable_1 = require("exports/iterable");
// Have to require should to monkey-patch it onto objects,
// but have to import should to get the types. Yuck!
require('should');
describe_this_1.describeThis(bidirectional_1.BiMap, UnderTest => {
    it("Should have the capabilities of a normal map", () => {
        const instance = new UnderTest([["a", 1], ["b", 2]]);
        instance.has("a").should.true();
        instance.has("c").should.false();
        instance.delete("a");
        instance.set("c", 3);
        instance.has("c").should.true();
        instance.has("a").should.false();
        iterable_1.collect(instance.entries()).should.deepEqual([
            ["b", 2],
            ["c", 3]
        ]);
    });
    describe("reversed", () => {
        it("Should have a reversed version which mirrors it", () => {
            const instance = new UnderTest([["a", 1], ["b", 2], ["?", undefined]]);
            instance.reversed.has(1).should.true();
            instance.reversed.has(3).should.false();
            instance.reversed.delete(1);
            instance.set("c", 3);
            instance.reversed.has(3).should.true();
            instance.reversed.has(1).should.false();
            iterable_1.collect(instance.reversed.entries()).should.deepEqual([
                [2, "b"],
                [undefined, "?"],
                [3, "c"]
            ]);
        });
        it("On collision of values, should retain whichever entry's value was specified last", () => {
            const instance = new UnderTest([["a", 1], ["b", 2], ["?", undefined]]);
            instance.reversed.has(1).should.true();
            instance.reversed.has(3).should.false();
            instance.reversed.delete(1);
            instance.set("d", 2);
            instance.reversed.has(2).should.true();
            instance.has("b").should.false();
            utils_1.defined(instance.reversed.get(2)).should.equal("d");
            instance.reversed.has(1).should.false();
            iterable_1.collect(instance.reversed.entries()).should.deepEqual([
                [undefined, "?"],
                [2, "d"]
            ]);
        });
        it("On reversed, should return the original instance", () => {
            const instance = new UnderTest([["a", 1], ["b", 2], ["?", undefined]]);
            instance.reversed.reversed.should.equal(instance);
        });
    });
    describe("hasVal", () => {
        it("Should return true if map has the value, false otherwise", () => {
            const instance = new UnderTest([["a", 1], ["b", 2], ["?", undefined]]);
            instance.hasVal(1).should.true();
            instance.hasVal(3).should.false();
            instance.reversed.delete(1);
            instance.set("d", 2);
            instance.hasVal(2).should.true();
            instance.hasVal(1).should.false();
            instance.hasVal(undefined).should.true();
        });
        it("Should work even when called from reversed", () => {
            const instance = new UnderTest([["a", 1], ["b", 2], ["?", undefined]]);
            instance.reversed.hasVal("a").should.true();
            instance.reversed.hasVal("c").should.false();
            instance.reversed.delete(1);
            instance.set("d", 2);
            instance.reversed.hasVal("d").should.true();
            instance.reversed.hasVal("b").should.false();
            instance.reversed.hasVal("a").should.false();
            instance.reversed.hasVal("?").should.true();
        });
    });
    describe("hasVal", () => {
        it("Should delete a key-value pair by value, returning true if it was found and false if not", () => {
            const instance = new UnderTest([["a", 1], ["b", 2], ["?", undefined]]);
            instance.deleteVal(1).should.true();
            instance.deleteVal(1).should.false();
            instance.deleteVal(2).should.true();
            instance.deleteVal(undefined).should.true();
            instance.deleteVal(undefined).should.false();
            instance.set("d", 2);
            instance.deleteVal(2).should.true();
            instance.size.should.equal(0);
        });
        it("Should work even when called from reversed", () => {
            const instance = new UnderTest([["a", 1], ["b", 2], ["?", undefined]]);
            instance.reversed.deleteVal("a").should.true();
            instance.reversed.deleteVal("a").should.false();
            instance.reversed.deleteVal("b").should.true();
            instance.reversed.deleteVal("?").should.true();
            instance.reversed.deleteVal("?").should.false();
            instance.set("d", 2);
            instance.reversed.deleteVal("d").should.true();
            instance.reversed.size.should.equal(0);
        });
    });
    describe("getKey", () => {
        it("Should get key of a value", () => {
            const instance = new UnderTest([["a", 1], ["b", 2], ["?", undefined]]);
            utils_1.defined(instance.getKey(1)).should.equal("a");
            utils_1.defined(instance.getKey(2)).should.equal("b");
            instance.set("d", 2);
            utils_1.defined(instance.getKey(2)).should.equal("d");
            utils_1.defined(instance.getKey(undefined)).should.equal("?");
        });
        it("Should work even when called from reversed", () => {
            const instance = new UnderTest([["a", 1], ["b", 2], ["?", undefined]]);
            utils_1.defined(instance.reversed.getKey("b")).should.equal(2);
            utils_1.defined(instance.reversed.getKey("a")).should.equal(1);
            instance.set("d", 2);
            utils_1.defined(instance.reversed.getKey("d")).should.equal(2);
        });
    });
});
