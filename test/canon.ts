import * as should from 'should';

import { CanonMap, naiveCanonize } from '../exports/canon';
import { defined, isDefined, Possible } from '../types/utils';
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
});

describeThis(naiveCanonize, () => {
  it("Should resolve values to canonical keys in such a way that unintended collisions are unlikely", () => {
    should.notEqual(naiveCanonize("[]"), naiveCanonize([]));
    should.notEqual(naiveCanonize(null), naiveCanonize(NaN));
    should.notStrictEqual(naiveCanonize(undefined), naiveCanonize(null));
    should.notEqual(naiveCanonize(0), naiveCanonize(""));
    should.notEqual(naiveCanonize({}), naiveCanonize([]));
  });

  it("Should resolve values without collision with depth 0 for most primitives", () => {
    should.notEqual(naiveCanonize("[]"), naiveCanonize([]));
    should.notEqual(naiveCanonize(null), naiveCanonize(NaN));
    should.notStrictEqual(naiveCanonize(undefined), naiveCanonize(null));
    should.notEqual(naiveCanonize(0), naiveCanonize(""));
    should.notEqual(naiveCanonize({}), naiveCanonize([]));
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