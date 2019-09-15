import * as should from 'should';
import {pipe} from "fp-ts/lib/pipeable";

import { BiMap } from '../exports/bidirectional';
import {
  reconcileAdd,
  reconcileConcat,
  reconcileAppend,
  mapCollect,
  biMapCollect,
  mapCollectInto,
  reconcileCount,
  flatMakeEntries,
  foldingGet,
  reconcileFold,
  getOrElse,
  getOrFail,
  getOrVal,
  invertBinMap,
  keysOf,
  makeEntries,
  mapToDictionary,
  mapValues,
  reverseMap,
  selectMap,
  uniformMap,
  valuesOf,
  reconcileDefault,
  reconcileFirst,
  zipMapsIntersection,
  zipMapsUnion,
  mapCollectBumping,
  resolutionFailureMessage,
  mapKeys
} from '../exports/maps';
import { defined, isDefined, Possible } from '../types/utils';
import { describeThis } from './describe-this';
import { collect, filter } from 'iterable';

// Have to require should to monkey-patch it onto objects,
// but have to import should to get the types. Yuck!
require('should');

describeThis(reconcileAdd, (subject) => {
  it('Should be useable to compose a map by adding numbers with matching keys', () => {
    const reconciler = subject();

    reconciler(undefined, 2, "key").should.equal(2);
    reconciler(1, 2, "key").should.equal(3);
  });

  it('Should be useable to compose a map by adding values with matching keys after applying a number function', () => {
    const reconciler = subject((str: string) => str.length);

    reconciler(undefined, "cat", "key").should.equal(3);
    reconciler(1, "mouse", "key").should.equal(5 + 1);
  });
});

describeThis(reconcileConcat, () => {
  const map1 = new Map([[5, ["horse"]]]);

  const ret = mapCollectInto(
    [[3, ["cat", "dog"]], [5, ["mouse"]]],
    map1,
    reconcileConcat()
  );

  defined(ret.get(3)).should.deepEqual(["cat", "dog"]);
  defined(ret.get(5)).should.deepEqual(["horse", "mouse"]);
});

describeThis(reconcileAppend, () => {
  it("Should be useable to append individual values to arrays stored in a map on collision", () => {
    const map1 = new Map([[5, ["horse"]]]);

    const ret = mapCollectInto(
      [[3, "cat"], [5, "mouse"]],
      map1,
      reconcileAppend()
    );

    defined(ret.get(3)).should.deepEqual(["cat"]);
    defined(ret.get(5)).should.deepEqual(["horse", "mouse"]);
  });

  it("Should be useable to append individual values to arrays with a mapper", () => {
    const map1 = new Map([[5, ["horse"]]]);

    const ret = mapCollectInto(
      [[3, "cat"], [5, "mouse"]],
      map1,
      reconcileAppend(
        val => val.split("").reverse().join("")
      )
    );

    defined(ret.get(3)).should.deepEqual(["tac"]);
    defined(ret.get(5)).should.deepEqual(["horse", "esuom"]);
  });
});

describeThis(reconcileDefault, () => {
  it("Should emulate default Map behaviour by overwriting existing values at keys", () => {
    const map1 = new Map([[5, ["horse"]]]);

    const ret = mapCollectInto(
      [[3, "cat"], [5, "mouse"]],
      map1,
      reconcileDefault()
    );

    defined(ret.get(3)).should.deepEqual("cat");
    defined(ret.get(5)).should.deepEqual("mouse");
  });
});

describeThis(reconcileFirst, () => {
  it("Should reverse default Map behaviour by never overwriting existing values at keys", () => {
    const map1 = new Map([[5, "horse"]]);

    const ret = mapCollectInto(
      [[3, "cat"], [5, "mouse"]],
      map1,
      reconcileFirst()
    );

    defined(ret.get(3)).should.deepEqual("cat");
    defined(ret.get(5)).should.deepEqual("horse");
  });
});

describe('collect', function() {
  it('Should turn an array of entries into a map', function() {
    const ret = mapCollect([["a", 1], ["b", 2]]);

    defined(ret.get("a")).should.equal(1);
    defined(ret.get("b")).should.equal(2);
  });

  it('Should turn a map into a new map', function() {
    const map1 = new Map([["a", 7], ["b", 8]]);
    const ret = mapCollect(map1);

    ret.should.not.equal(map1);
    defined(ret.get("a")).should.equal(7);
    defined(ret.get("b")).should.equal(8);
  });

  it('Should turn an iterator into a map', function() {
    const ret = mapCollect(([["a", 7], ["b", 8]] as [string, number][])[Symbol.iterator]());

    defined(ret.get("a")).should.equal(7);
    defined(ret.get("b")).should.equal(8);
  });

  it('Should turn an array into a map and by default on key collision overwrite earlier entries', function() {
    const ret = mapCollect([["a", 7], ["b", 8], ["a", 65]]);

    defined(ret.get("a")).should.equal(65);
    defined(ret.get("b")).should.equal(8);
  });

  it('Should turn an array into a map and given a reconciler combine entries on key collision', function() {
    const ret = mapCollect(
      [["a", 7], ["b", 8], ["a", 65]],
      (colliding: Possible<number>, incoming) => (colliding || 0) + incoming
    );

    defined(ret.get("a")).should.equal(65 + 7);
    defined(ret.get("b")).should.equal(8);
  });
});

describe('collectBiMap', function() {
  it('Should turn an array of entries into a bidirectional map', function() {
    const ret = biMapCollect([["a", 1], ["b", 2]]);
    
    ret.should.be.instanceOf(BiMap);
    defined(ret.get("a")).should.equal(1);
    defined(ret.get("b")).should.equal(2);
  });

  it('Should turn an array into a bidirectional map and by default on key collision overwrite earlier entries', function() {
    const ret = biMapCollect([["a", 7], ["b", 8], ["a", 65]]);

    ret.should.be.instanceOf(BiMap);
    defined(ret.get("a")).should.equal(65);
    defined(ret.get("b")).should.equal(8);
  });

  it('Should turn an array into a bidirectional map and given a reconciler combine entries on key collision', function() {
    const ret = biMapCollect(
      [["a", 7], ["b", 8], ["a", 65]],
      (colliding: Possible<number>, incoming) => (colliding || 0) + incoming
    );

    ret.should.be.instanceOf(BiMap);
    defined(ret.get("a")).should.equal(65 + 7);
    defined(ret.get("b")).should.equal(8);
  });
});


describe('collectInto', function() {
  it('Should add an array of entries to a map', function() {
    const map1 = new Map();
    const ret = mapCollectInto([["a", 1], ["b", 2]], map1);

    map1.should.equal(ret);
    defined(map1.get("a")).should.equal(1);
    defined(map1.get("b")).should.equal(2);
  });

  it('Should add the entries of a map to a new map', function() {
    const map1 = new Map();
    const map2 = new Map([["a", 7], ["b", 8]]);
    const ret = mapCollectInto(map1, map2);

    ret.should.equal(map2);
    defined(ret.get("a")).should.equal(7);
    defined(ret.get("b")).should.equal(8);
  });

  it('Should add the entries of an iterator into a map', function() {
    const map1 = new Map();
    const ret = mapCollectInto(
      ([["a", 7], ["b", 8]] as [string, number][])[Symbol.iterator](),
      map1
    );

    ret.should.equal(map1);
    defined(ret.get("a")).should.equal(7);
    defined(ret.get("b")).should.equal(8);
  });

  it('Should add an array of entries into a map and given a reconciler combine entries on key collision', function() {
    const map1 = new Map([["b", 1]]);
    const ret = mapCollectInto(
      [["a", 7], ["b", 8], ["a", 65]],
      map1,
      (colliding: Possible<number>, incoming) => (colliding || 0) + incoming
    );

    ret.should.equal(map1);
    defined(ret.get("a")).should.equal(65 + 7);
    defined(ret.get("b")).should.equal(8 + 1);
  });
});

describe("counterReconciler", () => {
  it("Should be useable to count entries with matching keys", () => {
    const map1 = new Map([[5, 1]]);

    const ret = mapCollectInto(
      [[3, "cat"], [5, "mouse"]],
      map1,
      reconcileCount()
    );

    defined(ret.get(3)).should.equal(1);
    defined(ret.get(5)).should.equal(2);
  });
});

describe('flatMakeEntries', () => {
  it ('Should transform a stream of inputs into a sequence of arbitrary length using a key-list function', () => {
    const ret = flatMakeEntries(
      [
        "cat",
        "dog",
        "squirrel",
        "alpaca"
      ],
      str => str.slice(0, str.length % 3).split("").map((c, i) => [c, str.length])
    );

    collect(ret).should.deepEqual(
      [
        ["s", 8],
        ["q", 8]
      ]
    )
  });
});

describe('foldingGet', () => {
  it ('Should run one function if the key is present', () => {
    const map1 = new Map([[5, 9]]);

    const ret = foldingGet(
      map1,
      5,
      (val) => val + 99,
      () => 996
    );

    ret.should.equal(9 + 99);
  });

  it ('Should run another function if the key is absent', () => {
    const map1 = new Map([[5, 9]]);

    const ret = foldingGet(
      map1,
      7,
      () => 99,
      () => 996
    );

    ret.should.equal(996);
  });
});

describe('foldReconciler', () => {
  it ('Should allow construction of a map using one function for each case of colliding value, no colliding value', () => {
    const reconciler = reconcileFold(
      (val: number) => 2 * val,
      (colliding: number, val: number) => colliding + val
    );

    const ret = mapCollect(
      [
        ["a", 1],
        ["b", 2],
        ["b", 3]
      ],
      reconciler
    );

    defined(ret.get("a")).should.equal(2);
    defined(ret.get("b")).should.equal(7);
  });
});

describe('getOrElse', () => {
  it ('Should return value if the key is present', () => {
    const map1 = new Map([[5, 9]]);

    const ret = getOrElse(
      map1,
      5,
      () => 99
    );

    ret.should.equal(9);
  });

  it ('Should run a function if the key is absent', () => {
    const map1 = new Map([[5, 9]]);

    const ret = getOrElse(
      map1,
      7,
      () => 99
    );

    ret.should.equal(99);
  });
});

describe('getOrFail', () => {
  it ('Should return value if the key is present', () => {
    const map1 = new Map([[5, 9]]);

    const ret = getOrFail(
      map1,
      5
    );

    ret.should.equal(9);
  });

  it ('Should throw error if key is absent', () => {
    const map1 = new Map([[5, 9]]);

    try {
      getOrFail(
        map1,
        6
      );
      should.fail(false, false, "Should have failed by now");
    } catch (e) {
      (e as Object).should.key("message").equal("Map has no entry \"6\"");
    }
  });

  it ('Should throw custom function error if key is absent', () => {
    const map1 = new Map([[5, 9]]);

    try {
      getOrFail(
        map1,
        6,
        key => JSON.stringify({key})
      );
      should.fail(false, false, "Should have failed by now");
    } catch (e) {
      JSON.parse(e.message).should.deepEqual({
        key: 6
      });
    }
  });

  it ('Should throw custom error if key is absent', () => {
    const map1 = new Map([[5, 9]]);

    try {
      getOrFail(
        map1,
        6,
        "Dag nabbit"
      );
      should.fail(false, false, "Should have failed by now");
    } catch (e) {
      (e as Object).should.have.key("message").equal("Dag nabbit");
    }
  });
});

describe('getOrVal', () => {
  it ('Should return value if the key is present', () => {
    const map1 = new Map([[5, 9]]);

    const ret = getOrVal(
      map1,
      5,
      777
    );

    ret.should.equal(9);
  });

  it ('Should return substitute if the key is absent', () => {
    const map1 = new Map([[5, 9]]);

    const ret = getOrVal(
      map1,
      7,
      777
    );

    ret.should.equal(777);
  });
});

describe('invertBinMap', () => {
  it ('Should convert map of arrays Map<A, B[]> to map of arrays Map<B, A[]>', () => {
    const map1 = new Map([[5, [9, 10]], [22, [9]]]);

    const ret = invertBinMap(map1);

    getOrFail(ret, 9).should.deepEqual([5, 22]);
    getOrFail(ret, 10).should.deepEqual([5]);
    ret.has(5).should.false();
    ret.has(22).should.false();
  });
});

describe('keysOf', () => {
  it ('Should convert stream of entries to stream of keys', () => {
    const map1 = new Map([[9, "blueberry"], [6, "almond"], [4, "plum"]]);

    collect(keysOf(map1)).should.deepEqual([9, 6, 4]);
  });
});

describe('makeEntries', () => {
  it ('Should transform an array of values into a stream of map entries using a key function', () => {
    const ret = pipe(
      makeEntries(
        [
          "cat",
          "dog",
          "squirrel",
          "alpaca"
        ],
        str => [str.length, str]
      ),
      (arr) => filter(arr, ([key]) => key % 2 === 0),
      collect
    )

    ret.should.deepEqual(
      [
        [8, "squirrel"],
        [6, "alpaca"]
      ]
    );
  });
});

describe('mapStream', () => {
  it ('Should transform a map into a stream of values as a thin wrapper over the native function', () => {
    const map1 = new Map([["a", 5], ["b", 6]]);

    const ret = collect(map1);

    ret.should.deepEqual(
      [
        ["a", 5],
        ["b", 6]
      ]
    );
  });
});

describe('mapToDictionary', () => {
  it ('Should transform a map into a dictionary', () => {
    const map1 = new Map([["a", 5], ["b", 6]]);

    const ret = mapToDictionary(map1);

    ret.should.deepEqual(
      {
        a: 5,
        b: 6
      }
    );
  });

  it ('Should transform an array directly into a dictionary', () => {
    const ret = mapToDictionary([["a", 5], ["b", 6]]);

    ret.should.deepEqual(
      {
        a: 5,
        b: 6
      }
    );
  });
});

describe('mapValues', () => {
  it ('Should transform a map into a stream of map entries with a mapper function', () => {
    const map1 = new Map([["a", 5], ["b", 6]]);

    const ret = mapValues(map1, x => Math.sqrt(x).toFixed(1));

    mapToDictionary(ret).should.deepEqual(
      {
        a: "2.2",
        b: "2.4"
      }
    );
  });
});

describe('mapKeys', () => {
  it ('Should transform a map into a stream of map entries with a mapper function', () => {
    const map1 = new Map([["a", 5], ["b", 6]]);

    const ret = mapKeys(map1, x => "_" + x);

    mapToDictionary(ret).should.deepEqual(
      {
        _a: 5,
        _b: 6
      }
    );
  });
});

describe('reverseMap', () => {
  it ('Should transform a map Map<A, B> into its inverse Map<B, A>', () => {
    const map1 = new Map([["a", 5], ["b", 6]]);

    const ret = pipe(
      reverseMap(map1),
      collect
    );

    ret.should.deepEqual([
      [5, "a"],
      [6, "b"]
    ])
  });
});

describe('selectMap', () => {
  it ('Should produce a stream of map entries without those that fail the filter function', () => {
    const map1 = new Map([["a", 5], ["b", 6], ["a!", 9], ["b!", 10]]);

    const ret = pipe(
      selectMap(map1, (val, key) => {
        return key.includes("!") ? val % 2 === 0 : val % 2 === 1;
      }),
      collect
    );

    ret.should.deepEqual([
      ["a", 5],
      ["b!", 10]
    ])
  });
});

describe('uniformMap', () => {
  it ('Should transform an array of keys into a stream of map entries all with the same value', () => {
    const ret = pipe(
      uniformMap(
        [
          "cat",
          "dog",
          "squirrel",
          "alpaca"
        ],
        0
      ),
      collect
    );

    ret.should.deepEqual(
      [
        ["cat", 0],
        ["dog", 0],
        ["squirrel", 0],
        ["alpaca", 0]
      ]
    );
  });
});

describe('keysOf', () => {
  it ('Should convert stream of entries to stream of values', () => {
    const map1 = new Map([[9, "blueberry"], [6, "almond"], [4, "plum"]]);

    collect(valuesOf(map1)).should.deepEqual(["blueberry", "almond", "plum"]);
  });
});

describeThis(zipMapsIntersection, subject => {
  it('Should convert two maps into an iterable of entries including only keys they share and combining their values into tuples', () => {
    const map1 = new Map([[9, "blueberry"], [6, "almond"], [4, "plum"]]);
    const map2 = new Map([[5, "a"], [6, "b"], [9, "a!"], [10, "b!"]]);

    const result = subject(map1, map2);
    const resultAsMap = mapCollect(result);

    should.equal(undefined, resultAsMap.get(4));
    should.equal(undefined, resultAsMap.get(10));
    getOrFail(resultAsMap, 6).should.deepEqual(["almond", "b"]);
    getOrFail(resultAsMap, 9).should.deepEqual(["blueberry", "a!"]);
  });

  it('Should convert two iterables of maps as above', () => {
    const map1: [number, string][] = [[9, "blueberry"], [6, "almond"], [4, "plum"]];
    const map2: [number, string][] = [[5, "a"], [6, "b"], [9, "a!"], [10, "b!"]];

    const result = subject(map1, map2);
    const resultAsMap = mapCollect(result);

    should.equal(undefined, resultAsMap.get(4));
    should.equal(undefined, resultAsMap.get(10));
    getOrFail(resultAsMap, 6).should.deepEqual(["almond", "b"]);
    getOrFail(resultAsMap, 9).should.deepEqual(["blueberry", "a!"]);
  });
});

describeThis(zipMapsUnion, subject => {
  it('Should convert two maps into an iterable of entries including all common keys and combining their values into tuples', () => {
    const map1 = new Map([[9, "blueberry"], [6, "almond"], [4, "plum"]]);
    const map2 = new Map([[5, "a"], [6, "b"], [9, "a!"], [10, "b!"]]);

    const result = subject(map1, map2);
    const resultAsMap = mapCollect(result);

    getOrFail(resultAsMap, 4).should.deepEqual(["plum", undefined]);
    getOrFail(resultAsMap, 6).should.deepEqual(["almond", "b"]);
    getOrFail(resultAsMap, 9).should.deepEqual(["blueberry", "a!"]);
    getOrFail(resultAsMap, 5).should.deepEqual([undefined, "a"]);
    getOrFail(resultAsMap, 10).should.deepEqual([undefined, "b!"]);
  });

  it('Should convert two iterables of maps as above', () => {
    const map1: [number, string][] = [[9, "blueberry"], [6, "almond"], [4, "plum"]];
    const map2: [number, string][] = [[5, "a"], [6, "b"], [9, "a!"], [10, "b!"]];

    const result = subject(map1, map2);
    const resultAsMap = mapCollect(result);

    getOrFail(resultAsMap, 4).should.deepEqual(["plum", undefined]);
    getOrFail(resultAsMap, 6).should.deepEqual(["almond", "b"]);
    getOrFail(resultAsMap, 9).should.deepEqual(["blueberry", "a!"]);
    getOrFail(resultAsMap, 5).should.deepEqual([undefined, "a"]);
    getOrFail(resultAsMap, 10).should.deepEqual([undefined, "b!"]);
  });
});

describeThis(mapCollectBumping, subject => {
  it('Should accumulate a map by bumping colliding keys to new keys', () => {
    const result = mapCollectBumping(
      [
        [1, "me"],
        [2, "too"],
        [1, "it"],
        [2, "is"],
        [3, "true"]
      ],
      colliding => colliding + 1
    );

    getOrFail(result, 1).should.equal("me");
    getOrFail(result, 2).should.equal("too");
    getOrFail(result, 3).should.equal("it");
    getOrFail(result, 4).should.equal("is");
    getOrFail(result, 5).should.equal("true");
  });

  it('Should accumulate a map by bumping colliding keys to new keys but giving up if bumper returns undefined', () => {
    const result = mapCollectBumping(
      [
        [1, "me"],
        [2, "too"],
        [1, "it"],
        [2, "is"],
        [3, "true"]
      ],
      colliding => colliding % 2 === 0 ? colliding + 1 : undefined
    );

    getOrFail(result, 1).should.equal("me");
    getOrFail(result, 2).should.equal("too");
    getOrFail(result, 3).should.equal("is");
    result.has(4).should.be.false();
  });

  it('Should accumulate a map by bumping colliding keys and throwing an error if the bumper throws an error', () => {
    try {
      const result = mapCollectBumping(
        [
          [1, "me"],
          [2, "too"],
          [1, "it"],
          [2, "is"],
          [2, "quite"]
        ],
        (colliding, priorBumps, original) => {
          if (priorBumps < 2) {
            return colliding + 1;
          } else {
            throw new Error(resolutionFailureMessage(original, priorBumps))
          }
        }
      );
      true.should.be.false("Should have thrown an error");
    } catch (e) {
      const msg = e.message;
      msg.should.equal("Failed to resolve key \"2\" to a unique value after 2 tries");
    }
  });
});

describeThis(resolutionFailureMessage, subject => {
  it("Should produce a generic error message on key resolution failure", () => {
    subject("B", 1).should.equal("Failed to resolve key \"B\" to a unique value after 1 try");
  });
});