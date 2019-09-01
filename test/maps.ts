import * as should from 'should';

import { BiMap } from '../exports/bidirectional';
import {
  accumulate,
  accumulateInto,
  adderReconciler,
  appenderFlattenReconciler,
  appenderReconciler,
  collect,
  collectBiMap,
  collectInto,
  counterReconciler,
  deepAccumulate,
  deepAccumulateInto,
  deepCollect,
  deepCollectInto,
  deepDictionaryToMap,
  deepFoldingGet,
  deepGet,
  deepGetOrElse,
  deepGetOrFail,
  deepGetOrVal,
  deepHas,
  DeepMap,
  deepMapStream,
  deepMapToDictionary,
  foldingGet,
  foldReconciler,
  mapToDictionary
} from '../exports/maps';
import { defined, isDefined, Possible } from '../types/utils';

// Have to require should to monkey-patch it onto objects,
// but have to import should to get the types. Yuck!
require('should');

describe("accumulate", () => {
  it('Should turn an arbitrary array into a map using a key function', () => {
    const arr = ["cat", "mouse", "giraffe", "hippopotamus"];

    const ret = accumulate(
      arr,
      str => str.length
    );

    defined(ret.get(3)).should.equal("cat");
    defined(ret.get(5)).should.equal("mouse");
    defined(ret.get(7)).should.equal("giraffe");
    defined(ret.get(12)).should.equal("hippopotamus");
  });

  it('Should turn an arbitrary array into a map using a key function and a reconciler', () => {
    const arr = ["cat", "mouse", "giraffe", "dog"];

    const ret = accumulate(
      arr,
      str => str.length,
      (colliding: Possible<string>, incoming) => isDefined(colliding) ? `${colliding} and ${incoming}` : incoming
    );

    defined(ret.get(3)).should.equal("cat and dog");
    defined(ret.get(5)).should.equal("mouse");
    defined(ret.get(7)).should.equal("giraffe");
  });
});

describe("accumulateInto", () => {
  it('Should add an arbitrary array to a map using a key function', () => {
    const map1 = new Map([[5, "horse"]]);
    const arr = ["cat", "mouse", "giraffe", "hippopotamus"];

    const ret = accumulateInto(
      arr,
      map1,
      str => str.length
    );

    defined(ret.get(3)).should.equal("cat");
    defined(ret.get(5)).should.equal("mouse");
    defined(ret.get(7)).should.equal("giraffe");
    defined(ret.get(12)).should.equal("hippopotamus");
  });

  it('Should add an arbitrary array to a map using a key function and a reconciler', () => {
    const map1 = new Map([[5, "horse"]]);
    const arr = ["cat", "mouse", "giraffe", "dog"];

    const ret = accumulateInto(
      arr,
      map1,
      str => str.length,
      (colliding: Possible<string>, incoming) => isDefined(colliding) ? `${colliding} and ${incoming}` : incoming
    );

    defined(ret.get(3)).should.equal("cat and dog");
    defined(ret.get(5)).should.equal("horse and mouse");
    defined(ret.get(7)).should.equal("giraffe");
  });
});

describe('adderReconciler', () => {
  it('Should be useable to compose a map by adding numbers with matching keys', () => {
    const reconciler = adderReconciler();

    reconciler(undefined, 2, "key").should.equal(2);
    reconciler(1, 2, "key").should.equal(3);
  });

  it('Should be useable to compose a map by adding values with matching keys after applying a number function', () => {
    const reconciler = adderReconciler((str: string) => str.length);

    reconciler(undefined, "cat", "key").should.equal(3);
    reconciler(1, "mouse", "key").should.equal(5 + 1);
  });
});

describe("appenderFlattenReconciler", () => {
  it("Should be useable to append arrays of values to arrays stored in a map on collision", () => {
    const map1 = new Map([[5, ["horse"]]]);

    const ret = collectInto(
      [[3, ["cat", "dog"]], [5, ["mouse"]]],
      map1,
      appenderFlattenReconciler()
    );

    defined(ret.get(3)).should.deepEqual(["cat", "dog"]);
    defined(ret.get(5)).should.deepEqual(["horse", "mouse"]);
  });
});

describe("appenderReconciler", () => {
  it("Should be useable to append individual values to arrays stored in a map on collision", () => {
    const map1 = new Map([[5, ["horse"]]]);

    const ret = collectInto(
      [[3, "cat"], [5, "mouse"]],
      map1,
      appenderReconciler()
    );

    defined(ret.get(3)).should.deepEqual(["cat"]);
    defined(ret.get(5)).should.deepEqual(["horse", "mouse"]);
  });
});

describe('collect', function() {
  it('Should turn an array of entries into a map', function() {
    const ret = collect([["a", 1], ["b", 2]]);

    defined(ret.get("a")).should.equal(1);
    defined(ret.get("b")).should.equal(2);
  });

  it('Should turn a map into a new map', function() {
    const map1 = new Map([["a", 7], ["b", 8]]);
    const ret = collect(map1);

    ret.should.not.equal(map1);
    defined(ret.get("a")).should.equal(7);
    defined(ret.get("b")).should.equal(8);
  });

  it('Should turn an iterator into a map', function() {
    const ret = collect(([["a", 7], ["b", 8]] as [string, number][])[Symbol.iterator]());

    defined(ret.get("a")).should.equal(7);
    defined(ret.get("b")).should.equal(8);
  });

  it('Should turn an array into a map and by default on key collision overwrite earlier entries', function() {
    const ret = collect([["a", 7], ["b", 8], ["a", 65]]);

    defined(ret.get("a")).should.equal(65);
    defined(ret.get("b")).should.equal(8);
  });

  it('Should turn an array into a map and given a reconciler combine entries on key collision', function() {
    const ret = collect(
      [["a", 7], ["b", 8], ["a", 65]],
      (colliding: Possible<number>, incoming) => (colliding || 0) + incoming
    );

    defined(ret.get("a")).should.equal(65 + 7);
    defined(ret.get("b")).should.equal(8);
  });
});

describe('collectBiMap', function() {
  it('Should turn an array of entries into a bidirectional map', function() {
    const ret = collectBiMap([["a", 1], ["b", 2]]);
    
    ret.should.be.instanceOf(BiMap);
    defined(ret.get("a")).should.equal(1);
    defined(ret.get("b")).should.equal(2);
  });

  it('Should turn an array into a bidirectional map and by default on key collision overwrite earlier entries', function() {
    const ret = collectBiMap([["a", 7], ["b", 8], ["a", 65]]);

    ret.should.be.instanceOf(BiMap);
    defined(ret.get("a")).should.equal(65);
    defined(ret.get("b")).should.equal(8);
  });

  it('Should turn an array into a bidirectional map and given a reconciler combine entries on key collision', function() {
    const ret = collectBiMap(
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
    const ret = collectInto([["a", 1], ["b", 2]], map1);

    map1.should.equal(ret);
    defined(map1.get("a")).should.equal(1);
    defined(map1.get("b")).should.equal(2);
  });

  it('Should add the entries of a map to a new map', function() {
    const map1 = new Map();
    const map2 = new Map([["a", 7], ["b", 8]]);
    const ret = collectInto(map1, map2);

    ret.should.equal(map2);
    defined(ret.get("a")).should.equal(7);
    defined(ret.get("b")).should.equal(8);
  });

  it('Should add the entries of an iterator into a map', function() {
    const map1 = new Map();
    const ret = collectInto(
      ([["a", 7], ["b", 8]] as [string, number][])[Symbol.iterator](),
      map1
    );

    ret.should.equal(map1);
    defined(ret.get("a")).should.equal(7);
    defined(ret.get("b")).should.equal(8);
  });

  it('Should add an array of entries into a map and given a reconciler combine entries on key collision', function() {
    const map1 = new Map([["b", 1]]);
    const ret = collectInto(
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

    const ret = collectInto(
      [[3, "cat"], [5, "mouse"]],
      map1,
      counterReconciler()
    );

    defined(ret.get(3)).should.equal(1);
    defined(ret.get(5)).should.equal(2);
  });
});

describe('deepFoldingGet', () => {
  it ('Should run one function if the deep key is present', () => {
    const map1 = new Map([[5, new Map([[8, 13]])]]);

    const ret = deepFoldingGet(
      map1,
      [5, 8],
      () => 99,
      () => 996
    );

    ret.should.equal(99);
  });

  it ('Should run another function if the deep key is absent', () => {
    const map1 = new Map([[5, new Map([[9, 13]])]]);

    const ret = deepFoldingGet(
      map1,
      [5, 8],
      () => 99,
      () => 996
    );

    ret.should.equal(996);
  });
});

describe("deepGet", () => {
  it("Should return the deeply matched value", () => {
    const map1 = new Map([[5, new Map([[8, 13]])]]);

    const ret = deepGet(map1, [5, 8]);

    defined(ret).should.equal(13);
  });

  it("Should return undefined if the deeply matched value is not present", () => {
    const map1 = new Map([[5, new Map([[9, 13]])]]);

    const ret = deepGet(map1, [5, 8]);

    should.equal(ret, undefined);
  });
});

describe("deepGetOrElse", () => {
  it("Should return the deeply matched value", () => {
    const map1 = new Map([[5, new Map([[8, 13]])]]);

    const ret = deepGetOrElse(map1, [5, 8], () => 99);

    ret.should.equal(13);
  });

  it("Should call the substitute function if the deeply matched value is not present", () => {
    const map1 = new Map([[5, new Map([[9, 13]])]]);

    const ret = deepGetOrElse(map1, [5, 8], () => 99);

    ret.should.equal(99);
  });
});

describe("deepGetOrFail", () => {
  it("Should return the deeply matched value", () => {
    const map1 = new Map([[5, new Map([[8, 13]])]]);

    const ret = deepGetOrElse(map1, [5, 8], () => 99);

    ret.should.equal(13);
  });

  it("Should throw an error if the deeply matched value is not present", () => {
    const map1 = new Map([[5, new Map([[9, 13]])]]);

    try {
      deepGetOrFail(map1, [5, 8]);
      false.should.be.true("Test should have failed by now");
    } catch (e) {
      (e as Object).should.have.key("message").equal("Deep lookup failed on keys [5,8], keys matched were [5]");
    }
  });

  it("Should throw an error if the deeply matched value is not present with a custom error", () => {
    const map1 = new Map([[5, new Map([[9, 13]])]]);

    try {
      deepGetOrFail(map1, [5, 8], "Dag nabbit");
      false.should.be.true("Test should have failed by now");
    } catch (e) {
      (e as Object).should.have.key("message").equal("Dag nabbit");
    }
  });

  it("Should throw an error if the deeply matched value is not present with a custom error function", () => {
    const map1 = new Map([[5, new Map([[9, 13]])]]);

    try {
      deepGetOrFail(map1, [5, 8], (lookup, matched) => JSON.stringify({lookup, matched}));
      false.should.be.true("Test should have failed by now");
    } catch (e) {
      JSON.parse(e.message).should.deepEqual({
        lookup: [5, 8],
        matched: [5]
      });
    }
  });
});

describe("deepGetOrElse", () => {
  it("Should return the deeply matched value", () => {
    const map1: DeepMap<number, Map<number, number>> = new Map([[5, new Map([[8, 13]])]]);

    const ret = deepGetOrVal<number, Map<number, number>>(map1, [5], new Map([[99, 999]]));

    defined(ret.get(8)).should.equal(13);
  });

  it("Should return a default value if the deeply matched value is not present", () => {
    const map1: DeepMap<number, Map<number, number>> = new Map([[5, new Map([[8, 13]])]]);

    const ret = deepGetOrVal<number, Map<number, number>>(map1, [7], new Map([[99, 999]]));

    should.equal(ret.get(8), undefined);
    defined(ret.get(99)).should.equal(999);
  });
});

describe("deepGet", () => {
  it("Should return true if lookup succeeds", () => {
    const map1 = new Map([[5, new Map([[8, 13]])]]);

    const ret = deepHas(map1, [5, 8]);

    ret.should.true();
  });

  it("Should return true if deeper lookup succeeds", () => {
    const map2 = new Map([
      [
        5,
        new Map([
          [
            8,
            new Map([[12, 13]])
          ]
        ])
      ]
    ]);

    const ret2 = deepHas(map2, [5, 8, 12]);

    ret2.should.true();
  });

  it("Should return false if lookup fails", () => {
    const map1 = new Map([[5, new Map([[9, 13]])]]);

    const ret = deepHas(map1, [5, 8]);

    ret.should.false();
  });
});

describe('deepMapToDictionary', () => {
  it('Should convert a deeply nested map to a nested dictionary object', () => {
    const doublyNestedMap = new Map([["a", 1], ["b", 2]]);
    const singlyNestedMap = new Map<string, any>([["I", doublyNestedMap], ["II", {"xX": 972}]]);
    const map1 = new Map([["myMap", singlyNestedMap]]);

    const ret = deepMapToDictionary(map1);

    ret.should.deepEqual({
      myMap: {
        I: {
          a: 1,
          b: 2
        },
        II: {
          xX: 972
        }
      }
    });
  });

  it('Should convert a deeply nested map to a nested dictionary object with a custom key stringifier', () => {
    const doublyNestedMap = new Map([["a", 1], ["b", 2]]);
    const singlyNestedMap = new Map<string, any>([["I", doublyNestedMap], ["II", {"xX": 972}]]);
    const map1 = new Map([["myMap", singlyNestedMap]]);

    const ret = deepMapToDictionary(map1, (val, depth) => `${val}_${depth}`);

    ret.should.deepEqual({
      myMap_0: {
        I_1: {
          a_2: 1,
          b_2: 2
        },
        II_1: {
          xX: 972
        }
      }
    });
  });
});

describe('deepAccumulate', () => {
  it('Should turn an array of arbitrary values into a deeply nested map using a key tuple function', () => {
    const ret = deepAccumulate(
      [
        "I am a horse",
        "I am a house",
        "I like coffee",
        "You are in my way",
        "We stand",
        "Wait"
      ],
      (str) => str.split(" ")
    );

    const obj = deepMapToDictionary(ret);

    obj.should.deepEqual(
      {
        I: {
          am: {
            a: {
              horse: "I am a horse",
              house: "I am a house"
            }
          },
          like: {
            coffee: "I like coffee"
          }
        },
        You: {
          are: {
            in: {
              my: {
                way: "You are in my way"
              }
            }
          }
        },
        We: {
          stand: "We stand"
        },
        Wait: "Wait"
      }
    );
  });

  it('Should turn an array of arbitrary values into a deeply nested map using a key tuple function and reconciler', () => {
    const ret = deepAccumulate(
      [
        "I am a horse",
        "I am a house",
        "I like coffee",
        "You are in my way"
      ],
      (str: string) => str.split(" ").slice(0, 2),
      counterReconciler()
    );

    const obj = deepMapToDictionary(ret);

    obj.should.deepEqual(
      {
        I: {
          am: 2,
          like: 1
        },
        You: {
          are: 1
        }
      }
    );
  });
});

describe('deepAccumulateInto', () => {
  it('Should add an array of arbitrary values to an existing deeply nested map using a key tuple function', () => {
    const map1 = new Map();
    const ret = deepAccumulateInto(
      [
        "I am a horse",
        "I am a house",
        "I like coffee",
        "You are in my way",
        "We stand",
        "Wait"
      ],
      map1,
      (str) => str.split(" ")
    );

    ret.should.equal(map1);
  });
});

describe('deepCollect', () => {
  it('Should turn an array of entries into a deeply nested map', function() {
    const ret = deepCollect([[["a", "c"], 1], [["b"], 2]]);

    deepMapToDictionary(ret).should.deepEqual({
      a: {
        c: 1
      },
      b: 2
    })
  });

  it('Should turn an iterator into a map', function() {
    const ret = deepCollect(([[["a"], 7], [["b"], 8]] as [string[], number][])[Symbol.iterator]());

    defined(ret.get("a")).should.equal(7);
    defined(ret.get("b")).should.equal(8);
  });

  it('Should turn an array into a map and by default on key collision overwrite earlier entries', function() {
    const ret = deepCollect([[["x", "a"], 7], [["b"], 8], [["x", "a"], 65]]);

    deepMapToDictionary(ret).should.deepEqual({
      x: {
        a: 65
      },
      b: 8
    });
  });

  it('Should turn an array into a map and given a reconciler combine entries on key collision', function() {
    const ret = deepCollect(
      [[["x", "a"], 7], [["b"], 8], [["x", "a"], 65]],
      adderReconciler()
    );

    deepMapToDictionary(ret).should.deepEqual({
      x: {
        a: 65 + 7
      },
      b: 8
    });
  });
});

describe('deepCollectInto', () => {
  it('Should add an array of entries to a deeply nested map', function() {
    const map1 = new Map();
    const ret = deepCollectInto([[["a", "c"], 1], [["b"], 2]], map1);

    ret.should.equal(map1);
    deepMapToDictionary(ret).should.deepEqual({
      a: {
        c: 1
      },
      b: 2
    })
  });

  it('Should turn an array into a map and given a reconciler combine entries on key collision', function() {
    const map1 = new Map();
    const ret = deepCollectInto(
      [[["x", "a"], 7], [["b"], 8], [["x", "a"], 65]],
      map1,
      adderReconciler()
    );

    ret.should.equal(map1);
    deepMapToDictionary(ret).should.deepEqual({
      x: {
        a: 65 + 7
      },
      b: 8
    });
  });
});

describe('deepDictionaryToMap', () => {
  it ('Should transform a deeply nested object into a stream of key-lists and values', () => {
    const ret = deepDictionaryToMap({
      a: 1,
      b: {
        a: 2
      }
    });

    ret.toArray().should.deepEqual([[["a"], 1], [["b", "a"], 2]]);
  });
});

describe('deepMapStream', () => {
  it ('Should transform a deeply nested map into a stream of key-lists and values', () => {
    const ret = deepMapStream(new Map<string, any>([
      ["a", 1],
      ["b", new Map<number, any>([[1, "_a"], [99, new Map([["_b", {}]])]])]
    ]));

    ret.toArray().should.deepEqual([
      [["a"], 1],
      [["b", 1], "_a"],
      [["b", 99, "_b"], {}]
    ]);
  });
});

describe('foldReconciler', () => {
  it ('Should allow construction of a map using one function for each case of colliding value, no colliding value', () => {
    const reconciler = foldReconciler(
      (val: number) => 2 * val,
      (colliding: number, val: number) => colliding + val
    );

    const ret = mapToDictionary(
      collect(
        [
          ["a", 1],
          ["b", 2],
          ["b", 3]
        ],
        reconciler
      )
    );

    ret.should.deepEqual({
      a: 2,
      b: 7
    });
  });
});

