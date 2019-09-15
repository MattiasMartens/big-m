import { BiMap } from 'exports';
import { getOrFail, reconcileAdd } from 'exports/maps';
import * as should from 'should';
import { Stream } from 'ts-stream';

import { EventualMap, streamCollectInto, streamCollect } from '../exports/streams';
import { defined, tuple } from '../types/utils';
import { describeThis } from './describe-this';

// Have to require should to monkey-patch it onto objects,
// but have to import should to get the types. Yuck!
require('should');

function valAfterMs<T> (val: T, ms = 0): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(val);
    }, ms);
  });
}

function afterMs<T> (fn: () => T, ms = 0): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(fn()), ms);
  });
}

describeThis(EventualMap, subject => {
  describe("constructor", () => {
    it("Returns a BiMap when initialized with one", async () => {
      const eventual = subject(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15)
        ]),
        { seed: new BiMap<string, number>() }
      );

      const result = (await eventual.finalMap).getKey(92);
      should.equal(result, "A");
    });
  });

  describe("get", () => {
    it("Returns a promise that is fulfilled when the stream entry comes through", async () => {
      const eventual = subject(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15)
        ])
      );

      const result = await eventual.get("A");
      defined(result).should.equal(92);
    });

    it("Returns the first value to be returned with key", async () => {
      const eventual = subject(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15),
          valAfterMs(tuple(["A", 922]), 20),
          valAfterMs(tuple(["A", 9222]), 30)
        ])
      );

      const earlyAbsentPromise = await eventual.get("C");

      const result = await eventual.get("A");
      defined(result).should.equal(92);

      await afterMs(async () => {
        const result = await eventual.get("A");
        defined(result).should.equal(92);
      }, 1);

      const result2 = await eventual.finalMap;
      defined(result2.get("A")).should.equal(92);
      defined(await (eventual.get("A"))).should.equal(92);

      should.equal(undefined, await earlyAbsentPromise);
    });

    it("With a provided seed, plants key-entry pairs on the seed", async () => {
      const eventual = subject(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15),
          valAfterMs(tuple(["A", 922]), 20),
          valAfterMs(tuple(["B", 111]), 30),
          valAfterMs(tuple(["A", 9222]), 30)
        ]),
        {
          seed: new Map<string, number>([["B", 0]])
        }
      );

      const result = await eventual.finalMap;
      defined(result.get("A")).should.equal(92);
      defined(result.get("B")).should.equal(0);
      defined(await eventual.get("B")).should.equal(0);
    });

    it("With a bumper, bumps keys instead of discarding entries", async () => {
      debugger;
      const eventual = subject(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15),
          valAfterMs(tuple(["A", 922]), 20),
          valAfterMs(tuple(["B", 111]), 30),
          valAfterMs(tuple(["A", 9222]), 30)
        ]),
        {
          bumper: (key, priorAttempts) => priorAttempts > 1 ? undefined : "_" + key 
        }
      );

      await afterMs(() => {
        const result = eventual.getNow("A");
        should.equal(result, 92);
      }, 16);

      await afterMs(() => {
        const result = eventual.getNow("A");
        should.equal(result, 92);
        const result2 = eventual.getNow("_A");
        should.equal(result2, 922);
      }, 21 - 16);

      await afterMs(() => {
        const result = eventual.getNow("A");
        should.equal(result, 92);
      }, 31 - 21);

      const result2 = await eventual.get("__A");
      should.equal(result2, undefined);
    });
  });

  describe("getNow", () => {
    it("Returns whatever value is currently loaded into the underlying map", async () => {
      const eventual = subject(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15),
          valAfterMs(tuple(["A", 922]), 20),
          valAfterMs(tuple(["B", 111]), 30),
          valAfterMs(tuple(["A", 9222]), 30)
        ])
      );

      const result = eventual.getNow("A");
      should.equal(result, undefined);

      await afterMs(() => {
        const result = eventual.getNow("A");
        should.equal(result, 92);
      }, 16);

      await afterMs(() => {
        const result = eventual.getNow("A");
        should.equal(result, 92);
      }, 21 - 16);

      await afterMs(() => {
        const result = eventual.getNow("A");
        should.equal(result, 92);
      }, 31 - 21);
    });
  });

  describe("hasNow", () => {
    it("Returns whether the key is currently loaded into the underlying map", async () => {
      const eventual = subject(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15),
          valAfterMs(tuple(["A", 922]), 20),
          valAfterMs(tuple(["B", 111]), 30),
          valAfterMs(tuple(["A", 9222]), 30)
        ])
      );

      const result = eventual.hasNow("A");
      should.equal(result, false);
      should.equal(eventual.hasNow("B"), false);

      await afterMs(() => {
        const result = eventual.getNow("A");
        should.equal(result, 92);
      }, 16);

      await afterMs(() => {
        const result = eventual.getNow("A");
        should.equal(result, 92);
      }, 21 - 16);

      await afterMs(() => {
        const result = eventual.getNow("A");
        should.equal(result, 92);
      }, 31 - 21);
    });
  });

  describe("has", () => {
    it("Returns whether the key is eventually loaded into the underlying map", async () => {
      const eventual = subject(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15),
          valAfterMs(tuple(["A", 922]), 20),
          valAfterMs(tuple(["B", 111]), 30),
          valAfterMs(tuple(["A", 9222]), 30)
        ])
      );

      should.equal(await eventual.has("C"), false);
      should.equal(await eventual.has("B"), true);
    });
  });

  describe("getOrFail", () => {
    it("Returns the value when eventually loaded into the underlying map or throws an error if it never is", async () => {
      const eventual = subject(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15),
          valAfterMs(tuple(["A", 922]), 20),
          valAfterMs(tuple(["B", 111]), 30),
          valAfterMs(tuple(["A", 9222]), 30)
        ])
      );

      try {
        await eventual.getOrFail("C", "TEST ERROR");
        true.should.be.false("Should have thrown an error by now");
      } catch (e) {
        e.message.should.equal("TEST ERROR");
      }

      try {
        await eventual.getOrFail("C", key => key);
        true.should.be.false("Should have thrown an error by now");
      } catch (e) {
        e.message.should.equal("C");
      }

      try {
        await eventual.getOrFail("C");
        true.should.be.false("Should have thrown an error by now");
      } catch (e) {
        e.message.should.equal(`Map has no entry "C"`);
      }

      should.equal(await eventual.getOrFail("B"), 111);
    });
  });

  describe("getOrElse", () => {
    it("Returns the value when eventually loaded into the underlying map or a substitute from a function if it never is", async () => {
      const eventual = subject(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15),
          valAfterMs(tuple(["A", 922]), 20),
          valAfterMs(tuple(["B", 111]), 30),
          valAfterMs(tuple(["A", 9222]), 30)
        ])
      );
      
      should.equal(await eventual.getOrElse("C", () => 0), 0);
      should.equal(await eventual.getOrElse("B", () => 0), 111);
    });
  });

  describe("getOrVal", () => {
    it("Returns the value when eventually loaded into the underlying map or a substitute if it never is", async () => {
      const eventual = subject(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15),
          valAfterMs(tuple(["A", 922]), 20),
          valAfterMs(tuple(["B", 111]), 30),
          valAfterMs(tuple(["A", 9222]), 30)
        ])
      );
      
      should.deepEqual(await Promise.all([
        eventual.getOrVal("C", 1),
        eventual.getOrVal("C", 2),
        eventual.getOrVal("C", 3),
        eventual.getOrVal("A", 4)
      ]), [
        1,
        2,
        3,
        92
      ])
    });
  });

  const staticInstance = EventualMap(Stream.from([]));
  describeThis(staticInstance.foldingGet, () => {
    it("Calls a function on the value when it arrives or a second function if it never does", async () => {
      const eventual = subject(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15),
          valAfterMs(tuple(["A", 922]), 20),
          valAfterMs(tuple(["B", 111]), 30),
          valAfterMs(tuple(["A", 9222]), 30)
        ])
      );
      
      should.deepEqual(await Promise.all([
        eventual.foldingGet("C", val => val * 2, () => 2),
        eventual.foldingGet("B", val => val * 2, () => 2),
        eventual.foldingGet("A", val => val * 2, () => 2)
      ]), [
        2,
        222,
        92 * 2
      ])
    });
  });
});

describeThis(streamCollectInto, subject => {
  it ("Should pipe a stream into a map, returning a Promise that resolves to the completed map", async () => {
    const seed = new Map([["A", 92222]]);
    
    const promise = subject(Stream.from([
      valAfterMs(tuple(["A", 92]), 15),
      valAfterMs(tuple(["A", 922]), 20),
      valAfterMs(tuple(["B", 111]), 30),
      valAfterMs(tuple(["A", 9222]), 30)
    ]), seed);

    getOrFail(seed, "A").should.equal(92222);

    const result = await promise;
    result.should.equal(seed);
    getOrFail(result, "A").should.equal(9222);
  });

  it ("Should pipe a stream into a map with a reconciler", async () => {
    const seed = new Map([["A", 92222]]);
    
    const promise = subject(Stream.from([
      valAfterMs(tuple(["A", 92]), 15),
      valAfterMs(tuple(["A", 922]), 20),
      valAfterMs(tuple(["B", 111]), 30),
      valAfterMs(tuple(["A", 9222]), 30)
      ]),
      seed,
      reconcileAdd()
    );

    getOrFail(seed, "A").should.equal(92222);

    const result = await promise;
    result.should.equal(seed);
    getOrFail(result, "A").should.equal(92222 + 9222 + 922 + 92);
  });
});

describeThis(streamCollect, subject => {
  it ("Should pipe a stream into a generated map, returning a Promise that resolves to the completed map with a reconciler", async () => {    
    const promise = subject(Stream.from([
      valAfterMs(tuple(["A", 92]), 15),
      valAfterMs(tuple(["A", 922]), 20),
      valAfterMs(tuple(["B", 111]), 30),
      valAfterMs(tuple(["A", 9222]), 30)
    ]), reconcileAdd());

    const result = await promise;
    getOrFail(result, "A").should.equal(9222 + 922 + 92);
  });
});