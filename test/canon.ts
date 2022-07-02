import * as should from 'should';

import { CanonMap, naiveCanonize, jsonCanonize, JsonCanonMap, SelfCanonMap } from '../exports/canon';
import { defined } from '../types/utils';
import { describeThis } from './describe-this';
import { collect } from 'iterable';
import { identity } from 'fp-ts/lib/function';
import { keyBy, mapCollectInto } from 'exports';

// Have to require should to monkey-patch it onto objects,
// but have to import should to get the types. Yuck!
require('should');

const keyA1 = { "a": 1 };
const keyA2 = { "a": 2 };
const otherKeyA1 = { "a": 1 };
const keyB2 = { "b": 2 };
const keyC3 = { "c": 3 };

describeThis(CanonMap, subject => {
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
    collect(instance.keys()).should.deepEqual(["b", "c"]);
    collect(instance.values()).should.deepEqual([2, 3]);
  });

  it ("Should collide keys with the same canonical value", () => {
    const instance = new subject<typeof keyA1 | typeof keyB2 | typeof keyC3, number>([[keyA1, 70], [otherKeyA1, 702], [keyB2, 7002]]);
    collect(instance.keys()).should.deepEqual([otherKeyA1, keyB2]);
    defined(instance.get(keyA1)).should.equal(702);
    defined(instance.get(otherKeyA1)).should.equal(702);
    instance.set(keyC3, 70002);
    instance.delete(keyA1);
    instance.has(keyA1).should.false();
    instance.has(otherKeyA1).should.false();
    collect(instance.entries()).should.deepEqual([
      [keyB2, 7002],
      [keyC3, 70002]
    ]);
    collect(instance.keys()).should.deepEqual([keyB2, keyC3]);
    collect(instance.values()).should.deepEqual([7002, 70002]);
  });

  it("Should be instantiable with a custom canonizer", () => {
    const canonizeByALookup = (x: { a: number }) => x.a
    const instance = new subject<any, any>([], canonizeByALookup);
    const keyA1WithExtraProperty = {a: 1, b: 2}
    const keyA1WithDifferentExtraProperty = { a: 1, b: 3 };
    instance.set(keyA1WithExtraProperty, 9);
    defined(instance.get(keyA1WithDifferentExtraProperty)).should.equal(9);
  });

  it ("Should be instantiable with a number that sets the naive canonizer recursion depth", () => {
    const NO_DIG_RECURSION_DEPTH = 0
    const shallowInstance = new subject<any, any>([], NO_DIG_RECURSION_DEPTH);
    shallowInstance.set(keyA1, 9);
    defined(shallowInstance.get(keyA2)).should.equal(9);

    const DEEPER_DIG_RECURSION_DEPTH = 3;
    const instance = new subject<any, any>([], DEEPER_DIG_RECURSION_DEPTH);
    const deepInstance = new subject<any, any>([], DEEPER_DIG_RECURSION_DEPTH);
  });

  it("Should provide forEach in a way that hides the abstraction", () => {
    const instance = new subject<{a: number}, number>([
      [{a: 1}, 2],
      [{a: 3}, 4]
    ])

    const result: any[] = []

    instance.forEach(
      function () {
        result.push(Array.from(arguments))
      }
    )

    result.should.deepEqual([
      [2, {a: 1}],
      [4, {a: 3}]
    ])
  });

  it("Should make it easy to load objects identified by a subset of their keys", () => {
    type FancyObject = { a: number, b: string }
    const objects: FancyObject[] = [{ a: 1, b: 'chatter' }, { a: 1, b: 'other chatter' }, { a: 2, b: 'nothing of interest' }]

    
    const instance = new subject<{a: number}, FancyObject>(
      keyBy(objects, identity),
      ({a}) => a
    );

    mapCollectInto(
      keyBy(objects, identity),
      instance
    );
  })
});

describeThis(naiveCanonize, () => {
  it("Should resolve values to canonical keys without collision in most typical cases", () => {
    should.notEqual(naiveCanonize("[]"), naiveCanonize([]));
    should.notEqual(naiveCanonize("[1]"), naiveCanonize([1]));
    should.notEqual(naiveCanonize(null), naiveCanonize(NaN));
    should.notStrictEqual(naiveCanonize(undefined), naiveCanonize(null));
    should.notEqual(naiveCanonize(0), naiveCanonize(""));
    should.notEqual(naiveCanonize({}), naiveCanonize([]));
    should.notEqual(naiveCanonize(new Date(0)), naiveCanonize(0));
    should.equal(naiveCanonize(new Date(2012, 6, 5)), naiveCanonize(new Date(2012, 6, 5)));
  });

  it("Should map NaN to itself", () => {
    should.equal(naiveCanonize(NaN), naiveCanonize(NaN));
  });

  it("Should conflate objects at level 0", () => {
    should.equal(
      naiveCanonize({a: 1, c: {}}, 0),
      naiveCanonize({b: 1}, 0)
    );
  });

  it("Should distinguish non-nested objects but conflate nested objects at level 1", () => {
    should.notEqual(
      naiveCanonize({a: 1, c: {}}),
      naiveCanonize({b: 1})
    );

    should.equal(
      naiveCanonize({a: 1, c: {}}, 1),
      naiveCanonize({a: 1, c: {
        x: 1
      }}, 1)
    );
  });

  it("Should conflate objects regardless of key order", () => {
    should.equal(
      naiveCanonize({a: 1, c: 2}),
      naiveCanonize({c: 2, a: 1})
    );
  });

  it("Should distinguish one-level-nested objects but conflate nested objects at level 2 and by default", () => {
    should.notEqual(
      naiveCanonize({a: 1, c: { a: 1}}, 2),
      naiveCanonize({a: 1, c: { a: 2 }}, 2)
    );

    should.equal(
      naiveCanonize({a: 1, c: { a: {} }}, 2),
      naiveCanonize({a: 1, c: { a: { ww: 70 } }}, 2)
    );

    should.notEqual(
      naiveCanonize({a: 1, c: { a: 1}}),
      naiveCanonize({a: 1, c: { a: 2 }})
    );

    should.equal(
      naiveCanonize({a: 1, c: { a: {} }}),
      naiveCanonize({a: 1, c: { a: { ww: 70 } }})
    );
  });
});

describeThis(jsonCanonize, (subject) => {
  it ("Should canonize using JSON", () => {
    should.equal(jsonCanonize({}), JSON.stringify({}));
  });
})

describeThis(JsonCanonMap, (subject) => {
  it ("Should create a map that canonizes using JSON", () => {
    const newCanonMap = subject<any, any>();
    (newCanonMap instanceof CanonMap).should.true();

    const getDeepNestedObject = () => ({
      a: { a: { a: { a: { a: { a: {}} }}} }
    })

    newCanonMap.set(getDeepNestedObject(), 700);
    defined(newCanonMap.get(getDeepNestedObject())).should.equal(700);
    should.equal(newCanonMap.get({}), undefined);
  });
})

describeThis(SelfCanonMap, subject => {
  it("Should index Ducks by their names", () => {
    const duckMap = new SelfCanonMap(['name'], [{ name: 'Rodney', featherCount: 13217 }, { name: 'Ellis', featherCount: 11992 }])
    defined(duckMap.get({ name: 'Ellis' })).featherCount.should.equal(11992)
  })

  it("Should allow post facto filling with overwriting", () => {
    const duckMap = new SelfCanonMap<{ name: string, featherCount: number }, 'name'>(['name'])
    duckMap.fill([{ name: 'Rodney', featherCount: 13217 }, { name: 'Ellis', featherCount: 11992 }])
    duckMap.fill([{ name: 'Rodney', featherCount: 13001 }, { name: 'Alessandra', featherCount: 12314 }])
    defined(duckMap.get({ name: 'Rodney' })).featherCount.should.equal(13001)
    defined(duckMap.get({ name: 'Alessandra' })).featherCount.should.equal(12314)
  })
})
