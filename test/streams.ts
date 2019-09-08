import * as should from 'should';
import { Stream } from "ts-stream";

import {
  eventualMap
} from '../exports/streams';
import { describeThis } from "./describe-this";
import { defined, isDefined, Possible, tuple } from '../types/utils';
import { reconcileDefault, reconcileAppend } from 'exports/maps';

let tick: number;

// Have to require should to monkey-patch it onto objects,
// but have to import should to get the types. Yuck!
require('should');

function valAfterMs<T> (val: T, ms = 0): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => {
      // console.log(JSON.stringify({
      //   val,
      //   ms: new Date().valueOf() - tick
      // }));
      resolve(val);
    }, ms);
  });
}

function afterMs<T> (fn: () => T, ms = 0): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(fn()), ms);
  });
}

describeThis(eventualMap, underTest => {
  describe("get", () => {
    it("Returns a promise that is fulfilled when the stream entry comes through", async () => {
      const eventual = underTest(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15)
        ])
      );

      const result = await eventual.get("A");
      defined(result).should.equal(92);
    });

    it("Returns the first value to be returned with key", async () => {
      const eventual = underTest(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15),
          valAfterMs(tuple(["A", 922]), 20),
          valAfterMs(tuple(["A", 9222]), 30)
        ])
      );

      const result = await eventual.get("A");
      defined(result).should.equal(92);

      await afterMs(async () => {
        const result = await eventual.get("A");
        defined(result).should.equal(92);
      }, 1);

      const result2 = await eventual.finalMap;
      defined(result2.get("A")).should.equal(92);
    });

    it("With default reconcile, returns the most recent value to be returned with key, or the next value if value has not arrived yet", async () => {
      const eventual = underTest(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15),
          valAfterMs(tuple(["A", 922]), 20),
          valAfterMs(tuple(["A", 9222]), 30)
        ]),
        {
          reconciler: reconcileDefault()
        }
      );

      const result = await eventual.get("A");
      defined(result).should.equal(92);

      await afterMs(async () => {
        const result = await eventual.get("A");
        defined(result).should.equal(922);
      }, 6);

      const result2 = await eventual.finalMap;
      defined(result2.get("A")).should.equal(9222);
    });

    it("With a provided seed, plants key-entry pairs on the seed", async () => {
      const eventual = underTest(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15),
          valAfterMs(tuple(["A", 922]), 20),
          valAfterMs(tuple(["B", 111]), 30),
          valAfterMs(tuple(["A", 9222]), 30)
        ]),
        {
          reconciler: reconcileAppend(),
          seed: new Map<string, number[]>([tuple(["B", [0]]), tuple(["A", []])])
        }
      );

      const result = await eventual.finalMap;
      defined(result.get("A")).should.deepEqual([92, 922, 9222]);
      defined(result.get("B")).should.deepEqual([0, 111]);
      defined(await eventual.get("B")).should.deepEqual([0, 111]);
    });
  });

  describe("getNow", () => {
    it("Returns whatever value is currently loaded into the underlying map", async () => {
      // tick = new Date().valueOf();

      const eventual = underTest(
        Stream.from([
          valAfterMs(tuple(["A", 92]), 15),
          valAfterMs(tuple(["A", 922]), 20),
          valAfterMs(tuple(["B", 111]), 30),
          valAfterMs(tuple(["A", 9222]), 30)
        ]),
        {
          reconciler: reconcileDefault()
        }
      );

      const result = eventual.getNow("A");
      should.equal(result, undefined);

      await afterMs(() => {
        const result = eventual.getNow("A");
        // console.log(JSON.stringify({
        //   result,
        //   ms: new Date().valueOf() - tick
        // }));
        should.equal(result, 92);
      }, 16);

      await afterMs(() => {
        const result = eventual.getNow("A");
        // console.log(JSON.stringify({
        //   result,
        //   ms: new Date().valueOf() - tick
        // }));
        should.equal(result, 922);
      }, 21 - 16);

      await afterMs(() => {
        const result = eventual.getNow("A");
        // console.log(JSON.stringify({
        //   result,
        //   ms: new Date().valueOf() - tick
        // }));
        should.equal(result, 9222);
      }, 31 - 21);
    });
  });
});