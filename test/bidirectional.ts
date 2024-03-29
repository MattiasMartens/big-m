import * as should from 'should';

import { BiMap } from '../exports/bidirectional';
import { defined } from '../support';
import { describeThis } from './describe-this';
import { collect } from 'iterable';

// Have to require should to monkey-patch it onto objects,
// but have to import should to get the types. Yuck!
require('should');

describeThis(BiMap, subject => {
  it ("Should have the capabilities of a normal map", () => {
    const instance = new subject([["a", 1], ["b", 2]]);
    instance.has("a").should.true();
    instance.has("c").should.false();
    instance.delete("a");
    instance.set("c", 3);
    instance.has("c").should.true();
    instance.has("a").should.false();
    collect(instance.entries()).should.deepEqual([
      ["b", 2],
      ["c", 3]
    ]);
    instance.clear();
    collect(instance.entries()).should.deepEqual([]);
  });

  it ("Should be instantiable from another BiMap", () => {
    const instance = new subject([["a", 1], ["b", 2]]);
    const newInstance = new subject(instance);
    instance.should.not.equal(newInstance);
    collect(newInstance).should.deepEqual(collect(instance));
  });

  describe("reversed", () => {
    it ("Should have a reversed version which mirrors it", () => {
      const instance = new subject([["a", 1], ["b", 2], ["?", undefined]]);
      instance.reversed.has(1).should.true();
      instance.reversed.has(3).should.false();
      instance.reversed.delete(1);
      instance.set("c", 3);
      instance.reversed.has(3).should.true();
      instance.reversed.has(1).should.false();
      collect(instance.reversed.entries()).should.deepEqual([
        [2, "b"],
        [undefined, "?"],
        [3, "c"]
      ]);
      instance.reversed.set(1, "xx");
      defined(instance.reversed.get(1)).should.equal("xx")
      defined(instance.get("xx")).should.equal(1)
      instance.reversed.clear();
      collect(instance.entries()).should.deepEqual(collect(instance.reversed.entries()));
    });

    it ("On collision of values, should retain whichever entry's value was specified last", () => {
      const instance = new subject([["a", 1], ["b", 2], ["?", undefined]]);
      instance.reversed.has(1).should.true();
      instance.reversed.has(3).should.false();
      instance.reversed.delete(1);
      instance.set("d", 2);
      instance.reversed.has(2).should.true();
      instance.has("b").should.false();
      defined(instance.reversed.get(2)).should.equal("d");
      instance.reversed.has(1).should.false();
      collect(instance.reversed.entries()).should.deepEqual([
        [undefined, "?"],
        [2, "d"]
      ]);
    });

    it ("On reversed, should return the original instance", () => {
      const instance = new subject([["a", 1], ["b", 2], ["?", undefined]]);
      instance.reversed.reversed.should.equal(instance);
    });
  });

  describe("hasVal", () => {
    it ("Should return true if map has the value, false otherwise", () => {
      const instance = new subject([["a", 1], ["b", 2], ["?", undefined]]);
      instance.hasVal(1).should.true();
      instance.hasVal(3).should.false();
      instance.reversed.delete(1);
      instance.set("d", 2);
      instance.hasVal(2).should.true();
      instance.hasVal(1).should.false();
      instance.hasVal(undefined).should.true();
    });

    it ("Should work even when called from reversed", () => {
      const instance = new subject([["a", 1], ["b", 2], ["?", undefined]]);
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
    it ("Should delete a key-value pair by value, returning true if it was found and false if not", () => {
      const instance = new subject([["a", 1], ["b", 2], ["?", undefined]]);
      instance.deleteVal(1).should.true();
      instance.deleteVal(1).should.false();
      instance.deleteVal(2).should.true();
      instance.deleteVal(undefined).should.true();
      instance.deleteVal(undefined).should.false();
      instance.set("d", 2);
      instance.deleteVal(2).should.true();
      instance.size.should.equal(0);
    });

    it ("Should work even when called from reversed", () => {
      const instance = new subject([["a", 1], ["b", 2], ["?", undefined]]);
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
    it ("Should get key of a value", () => {
      const instance = new subject([["a", 1], ["b", 2], ["?", undefined]]);
      defined(instance.getKey(1)).should.equal("a");
      defined(instance.getKey(2)).should.equal("b");
      instance.set("d", 2);
      defined(instance.getKey(2)).should.equal("d");
      defined(instance.getKey(undefined)).should.equal("?");
    });

    it ("Should work even when called from reversed", () => {
      const instance = new subject([["a", 1], ["b", 2], ["?", undefined]]);
      defined(instance.reversed.getKey("b")).should.equal(2);
      defined(instance.reversed.getKey("a")).should.equal(1);
      instance.set("d", 2);
      defined(instance.reversed.getKey("d")).should.equal(2);
    });
  });
});
