import * as should from 'should';
import { Stream } from "ts-stream";

import {
  EventualMap
} from '../exports/streams';
import { describeThis } from "./describe-this";
import { defined, isDefined, Possible, tuple } from '../types/utils';
import { reconcileDefault, reconcileAppend } from 'exports/maps';
import { BiMap } from 'exports';

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

      const result = await eventual.get("A");
      defined(result).should.equal(92);

      await afterMs(async () => {
        const result = await eventual.get("A");
        defined(result).should.equal(92);
      }, 1);

      const result2 = await eventual.finalMap;
      defined(result2.get("A")).should.equal(92);
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
});