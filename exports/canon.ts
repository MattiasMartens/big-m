import { mapCollect, reverseMap, foldingGet } from "../exports/maps";
import { entries, map, collect } from "../iterable";
import { pipe } from "fp-ts/lib/pipeable";
import { Possible } from "types/utils";
/**
 * 
 * A fallible canonizer.
 * Primitives are mapped to themselves.
 * Arrays and objects are mapped to a stringification of them that goes only one level deep.
 * Maps are mapped to a series of key-value pairs in insertion order and remain distinguishable from their equivalent dictionaries.
 * Sets are mapped to their entries and remain distinguishable from arrays.
 * 
 * @param  {K} lookup The key to canonize.
 */
export function naiveCanonizer<K>(lookup: K) {
  if (typeof lookup === 'object' && lookup !== null) {
    const [ first, last ] = Array.isArray(lookup) ? ["[", "]"] : ["{", "}"];
    return first +
      (
        (Symbol.iterator in lookup)
          ? pipe(
            lookup as any as Iterable<any>,
            x => map(x, x => Array.isArray(x)
              ? x.join("->>")
              : String(x)
            ),
            collect,
            x => x.join()
          )
          : pipe(
            entries(lookup as any) as any,
            (x: Iterable<any>) => map(x, entry => entry.join(":")),
            collect,
            x => x.join()
          )
      )
      + last;
  } else {
    return lookup;
  }
}

type Canonizer<C, K> = (lookup: K) => C;

/**
 * Map with canonized keys.
 * By instantiating a Map with a canonizer function, we can execute lookups according to an arbitrary notion of key identity.
 * For example, we can use arrays as Map indices and treat arrays with the same members as equivalent.
 * 
 * @remarks
 * In use cases that call for Maps, developers will often want to map by some combination of values instead of a single value.
 * If they use an object or array for this, however, each one will be unique, and so a lookup attempted with a newly initialized object or array will fail.
 * The solution is to initialize the map with a "canonizer" that, for any key, creates a canonical equivalent that other values can map to.
 * 
 * This gives the user total control over what matches to what.
 * 
 * @extends Map
 */
export class CanonMap<K, T> extends Map<K, T> {
  canonizer: Canonizer<any, K>;

  /**
   * 
   * Initialize a CanonMap.
   * 
   * 
   * @typeparam K Key type
   * @typeparam T Value type
   * @param entries? {Iterable}
   * An iterable yielding all key-value tuples that will be fed into the Map.
   * Without this, the Map is initialized to empty.
   */
  constructor(canonizer: Canonizer<any, K>, entries?: Iterable<[K, T]>) {
    super();
    this.canonizer = canonizer;

    if (entries) {
      for (let entry of entries) {
        const [key, value] = entry;
        // @ts-ignore
        super.set(canonizer(key), [key, value]);
      }
    }
  }

  /**
   * Gets the value at the canonization of the key in the CanonMap object.
   * Returns the CanonMap object.
   * 
   * 
   * @param {K} key The key to look up.
   * @returns {T | undefined} The value if found, `undefined` otherwise.
   */
  get(key: K): Possible<T> {
    const canon = this.canonizer(key);
    return super.has(canon as any) ? (super.get(canon as any) as any)[1] : undefined;
  }

  /**
   * Gets the value at the canonization of the key in the CanonMap object.
   * Returns the CanonMap object.
   * 
   * 
   * @param {K} key The key to look up.
   * @returns {boolean} `true` if the canonization of the key is present in the CanonMap, `false` otherwise.
   */
  has(key: K): boolean {
    return super.has(this.canonizer(key) as any);
  }

  /**
   * Sets the value for the canonization of the key in the CanonMap object.
   * Returns the CanonMap object.
   * 
   * 
   * @param {K} key The key to set.
   * @param {T} val The value to set at that key.
   */
  set(key: K, val: T) {
    // @ts-ignore
    super.set(this.canonizer(key), [key, val]);

    return this;
  }

  /**
   * 
   * Deletes the key-value pair associated with the canonization of `key`.
   * Does nothing if that entry is not present.
   * 
   * @param {K} key The key to delete the canonization of.
   * @returns `true` if an element in the CanonMap object existed and has been removed, `false` if the element does not exist.
   */
  delete(key: K) {
    return super.delete(this.canonizer(key) as any);
  }

  *[Symbol.iterator]() {
    for (let entry of super[Symbol.iterator]()) {
      yield entry[1] as any;
    }
  }

  *entries() {
    for (let entry of this[Symbol.iterator]()) {
      yield entry as [K, T];
    }
  }

  *keys() {
    for (let entry of this[Symbol.iterator]()) {
      yield entry[0] as K;
    }
  }

  *values() {
    for (let entry of this[Symbol.iterator]()) {
      yield entry[1] as T;
    }
  }
}

export function NaiveCanonMap<K, T>(entries?: Iterable<[K, T]>) {
  return new CanonMap(naiveCanonizer, entries);
}