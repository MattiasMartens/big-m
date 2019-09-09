import * as should from 'should';

import { CanonMap, naiveCanonizer } from '../exports/canon';
import { defined, isDefined, Possible } from '../types/utils';
import { describeThis } from './describe-this';
import { collect } from 'iterable';

// Have to require should to monkey-patch it onto objects,
// but have to import should to get the types. Yuck!
require('should');

describeThis(CanonMap, UnderTest => {
  it ("Should have the capabilities of a normal map", () => {
    const instance = new UnderTest(naiveCanonizer, [["a", 1], ["b", 2]]);
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

    const instance = new UnderTest<typeof a1 | typeof b2 | typeof c3, number>(naiveCanonizer, [[a1, 70], [a1_, 702], [b2, 7002]]);
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
