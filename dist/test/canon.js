"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const should = require("should");
const canon_1 = require("../exports/canon");
const utils_1 = require("../types/utils");
const describe_this_1 = require("./describe-this");
const iterable_1 = require("iterable");
// Have to require should to monkey-patch it onto objects,
// but have to import should to get the types. Yuck!
require('should');
describe_this_1.describeThis(canon_1.CanonMap, subject => {
    it("Should have the capabilities of a normal map", () => {
        const instance = new subject([["a", 1], ["b", 2]]);
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
        iterable_1.collect(instance.keys()).should.deepEqual(["b", "c"]);
        iterable_1.collect(instance.values()).should.deepEqual([2, 3]);
    });
    it("Should collide keys with the same canonical value", () => {
        const a1 = { "a": 1 };
        const a1_ = { "a": 1 };
        const b2 = { "b": 2 };
        const c3 = { "c": 3 };
        const instance = new subject([[a1, 70], [a1_, 702], [b2, 7002]]);
        iterable_1.collect(instance.keys()).should.deepEqual([a1_, b2]);
        utils_1.defined(instance.get(a1)).should.equal(702);
        utils_1.defined(instance.get(a1_)).should.equal(702);
        instance.set(c3, 70002);
        instance.delete(a1);
        instance.has(a1).should.false();
        instance.has(a1_).should.false();
        iterable_1.collect(instance.entries()).should.deepEqual([
            [b2, 7002],
            [c3, 70002]
        ]);
        iterable_1.collect(instance.keys()).should.deepEqual([b2, c3]);
        iterable_1.collect(instance.values()).should.deepEqual([7002, 70002]);
    });
});
describe_this_1.describeThis(canon_1.naiveCanonize, () => {
    it("Should resolve values to canonical keys without collision in most typical cases", () => {
        should.notEqual(canon_1.naiveCanonize("[]"), canon_1.naiveCanonize([]));
        should.notEqual(canon_1.naiveCanonize("[1]"), canon_1.naiveCanonize([1]));
        should.notEqual(canon_1.naiveCanonize(null), canon_1.naiveCanonize(NaN));
        should.notStrictEqual(canon_1.naiveCanonize(undefined), canon_1.naiveCanonize(null));
        should.notEqual(canon_1.naiveCanonize(0), canon_1.naiveCanonize(""));
        should.notEqual(canon_1.naiveCanonize({}), canon_1.naiveCanonize([]));
        should.notEqual(canon_1.naiveCanonize(new Date(0)), canon_1.naiveCanonize(0));
    });
    it("Should conflate objects at level 0", () => {
        should.equal(canon_1.naiveCanonize({ a: 1, c: {} }, 0), canon_1.naiveCanonize({ b: 1 }, 0));
    });
    it("Should distinguish non-nested objects but conflate nested objects at level 1", () => {
        should.notEqual(canon_1.naiveCanonize({ a: 1, c: {} }), canon_1.naiveCanonize({ b: 1 }));
        should.equal(canon_1.naiveCanonize({ a: 1, c: {} }, 1), canon_1.naiveCanonize({ a: 1, c: {
                x: 1
            } }, 1));
    });
    it("Should distinguish one-level-nested objects but conflate nested objects at level 2 and by default", () => {
        should.notEqual(canon_1.naiveCanonize({ a: 1, c: { a: 1 } }, 2), canon_1.naiveCanonize({ a: 1, c: { a: 2 } }, 2));
        should.equal(canon_1.naiveCanonize({ a: 1, c: { a: {} } }, 2), canon_1.naiveCanonize({ a: 1, c: { a: { ww: 70 } } }, 2));
        should.notEqual(canon_1.naiveCanonize({ a: 1, c: { a: 1 } }), canon_1.naiveCanonize({ a: 1, c: { a: 2 } }));
        should.equal(canon_1.naiveCanonize({ a: 1, c: { a: {} } }), canon_1.naiveCanonize({ a: 1, c: { a: { ww: 70 } } }));
    });
});
describe_this_1.describeThis(canon_1.jsonCanonize, (subject) => {
    it("Should canonize using JSON", () => {
        should.equal(canon_1.jsonCanonize({}), JSON.stringify({}));
    });
});
describe_this_1.describeThis(canon_1.JsonCanonMap, (subject) => {
    it("Should create a map that canonizes using JSON", () => {
        const newCanonMap = subject();
        (newCanonMap instanceof canon_1.CanonMap).should.true();
        const getDeepNestedObject = () => ({
            a: { a: { a: { a: { a: { a: {} } } } } }
        });
        newCanonMap.set(getDeepNestedObject(), 700);
        utils_1.defined(newCanonMap.get(getDeepNestedObject())).should.equal(700);
        should.equal(newCanonMap.get({}), undefined);
    });
});
