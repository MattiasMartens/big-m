import * as should from 'should';

import { CanonMap, naiveCanonize, jsonCanonize, JsonCanonMap } from '../exports/canon';
import { defined } from '../types/utils';
import { describeThis } from './describe-this';
import { collect } from 'iterable';

// Have to require should to monkey-patch it onto objects,
// but have to import should to get the types. Yuck!
require('should');

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
    const a1 = { "a": 1 };
    const a1_ = { "a": 1 };
    const b2 = { "b": 2 };
    const c3 = { "c": 3 };

    const instance = new subject<typeof a1 | typeof b2 | typeof c3, number>([[a1, 70], [a1_, 702], [b2, 7002]]);
    collect(instance.keys()).should.deepEqual([a1_, b2]);
    defined(instance.get(a1)).should.equal(702);
    defined(instance.get(a1_)).should.equal(702);
    instance.set(c3, 70002);
    instance.delete(a1);
    instance.has(a1).should.false();
    instance.has(a1_).should.false();
    collect(instance.entries()).should.deepEqual([
      [b2, 7002],
      [c3, 70002]
    ]);
    collect(instance.keys()).should.deepEqual([b2, c3]);
    collect(instance.values()).should.deepEqual([7002, 70002]);
  });

  it ("Should be instantiable with a custom canonizer", () => {
    const instance = new subject<any, any>([], (obj: any) => obj.a);
    instance.set({a: 1, b: 2}, 9);
    defined(instance.get({a: 1, b: 3})).should.equal(9);
  });

  it ("Should be instantiable with a number that sets the naive canonizer recursion depth", () => {
    const instance = new subject<any, any>([], 0);
    instance.set({a: 1}, 9);
    defined(instance.get({a: 2})).should.equal(9);
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