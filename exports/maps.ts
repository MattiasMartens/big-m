import {BiMap} from "./bidirectional";
import {defined, Possible, tuple} from "../types/utils";
import {map, filter, flatMap, forEach, entries, collect, collectInto} from "../iterable";

/**
 * Any iterable of entries, regardless of origin.
 * Note that `Map<K, V>` is in this type.
 */
export type MapStream<K, V> = Iterable<[K, V]>;

/**
 * A function for dealing with collisions when an iterable has two entries of the same key to insert into a Map, or the Map already has a value at that key.
 * 
 * @param  {Possible<V>} colliding
 * The value that was previously present at `key` in some Map, or `undefined` if there was no such value.
 * @param {T} incoming
 * A value from an iterator that is being pumped into the Map.
 * @param {K} key
 * The `key` at which the value is being inserted.
 * @returns The updated value.
 */
export type Reconciler<K, T, V> = (
  colliding: Possible<V>,
  incoming: T,
  key: K
) => V;

/**
 * Inserts the entries in the iterable into the provided map.
 * If two values map to the same key and the `reconcileFn` argument is provided, it will be called to combine the colliding values to set the final value; otherwise, the last value to arrive at that key will overwrite the rest.
 * 
 * @param {Iterable} iterable The entries to add.
 * @param {Map} seed The Map to add them to.
 * @param {Reconciler} reconcileFn?
 * A function specifying what value to set when two keys map to the same value.
 * If provided, this is called whether there is a collision or not, so it also serves as a mapper.
 * Called with:
 * 1. The value previously set at this key, or `undefined` if no value was set;
 * 2. The new value arriving from the Iterable;
 * 3. The key where the output will be entered.
 * @returns The updated Map. 
 */
export function mapCollectInto<K, T>(
  iterable: Iterable<[K, T]>,
  seed: Map<K, T>
): Map<K, T>
export function mapCollectInto<K, T, V>(
  iterable: Iterable<[K, T]>,
  seed: Map<K, V>,
  reconcileFn: Reconciler<K, T, V>
): Map<K, V>
export function mapCollectInto<K, T, V>(
  iterable: Iterable<[K, T]>,
  seed: Map<K, V>,
  reconcileFn?: Reconciler<K, T, V>
): Map<K, V> {
  if (reconcileFn) {
    for (let entry of iterable) {
      const [key, val] = entry;
        seed.set(key, reconcileFn(
          seed.get(key),
          val,
          key
        ));
    }
  } else {
    for (let entry of iterable) {
      const [key, val] = entry;
        seed.set(key, val as unknown as V);
    }
  }

  return seed;
}

/**
 * Converts an Iterable of Map entries into a brand new map.
 * When called on a map, the result will be a new Map with the same entries as the previous one.
 * If two values map to the same key and the `reconcileFn` argument is provided, it will be called to combine the colliding values to set the final value; otherwise, the last value to arrive at that key will overwrite the rest.
 * 
 * @param {Iterable} iterable The entries to add.
 * @param {Reconciler} reconcileFn?
 * A function specifying what value to set when two keys map to the same value.
 * If provided, this is called whether there is a collision or not, so it also serves as a mapper.
 * Called with:
 * 1. The value previously set at this key, or `undefined` if no value was set;
 * 2. The new value arriving from the Iterable;
 * 3. The key where the output will be entered.
 * @returns The newly created Map. 
 */
export function mapCollect<K, T>(
  iterable: Iterable<[K, T]>
): Map<K, T>
export function mapCollect<K, T, V>(
  iterable: Iterable<[K, T]>,
  reconcileFn: Reconciler<K, T, V>
): Map<K, V>
export function mapCollect<K, T, V>(
  iterable: Iterable<[K, T]>,
  reconcileFn?: Reconciler<K, T, V>
) {
  return mapCollectInto(
    iterable,
    new Map<K, V>(),
    reconcileFn as any
  );
}

/**
 * Converts an Iterable of Map entries into a brand new BiMap.
 * If two values map to the same key and the `reconcileFn` argument is provided, it will be called to combine the colliding values to set the final value; otherwise, the last value to arrive at that key will overwrite the rest.
 * 
 * Note that BiMaps do not allow two values to share a key. The reconciler plays no role in this case.
 * 
 * @param {Iterable} iterable The entries to add.
 * @param {Reconciler} reconcileFn?
 * A function specifying what value to set when two keys map to the same value.
 * If provided, this is called whether there is a collision or not, so it also serves as a mapper.
 * Called with:
 * 1. The value previously set at this key, or `undefined` if no value was set;
 * 2. The new value arriving from the Iterable;
 * 3. The key where the output will be entered.
 * @returns The newly created BiMap. 
 */
export function biMapCollect<K, T>(
  iterable: Iterable<[K, T]>
): Map<K, T>
export function biMapCollect<K, T, V>(
  iterable: Iterable<[K, T]>,
  reconcileFn: Reconciler<K, T, V>
): Map<K, V>
export function biMapCollect<K, T, V>(
  iterable: Iterable<[K, T]>,
  reconcileFn?: Reconciler<K, T, V>
) {
  return mapCollectInto(
    iterable,
    new BiMap<K, V>(),
    reconcileFn as any
  );
}

/**
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @returns An iterable representing the entries of a Map from value to key.
 */
export function reverseMap<K, T>(
  iterable: Iterable<[K, T]>
) {
  return map(iterable, ([k, t]) => [t, k] as [T, K])
}

/**
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @param {Function} fn A function mapping the values of the Map to a transformed value.
 * @returns An iterable representing the entries of a map from key to the transformed value.
 */
export function mapValues<K, T, V>(
  iterable: Iterable<[K, T]>,
  fn: (value: T, key: K) => V
): MapStream<K, V> {
  return map<[K, T], [K, V]>(iterable, ([key, val]) => [key, fn(val, key)]);
}

/**
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @returns An iterable representing the keys of the map.
 */
export function keysOf<K, T>(
  iterable: Iterable<[K, T]>
) {
  return map(iterable, arr => arr[0]);
}

/**
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @returns An iterable representing the values of the map.
 */
export function valuesOf<K, T>(
  iterable: Iterable<[K, T]>
) {
  return map(iterable, arr => arr[1]);
}

/**
 * @param {Iterable} iterable An iterable representing the keys of a Map.
 * @param {T} of The fixed value to set all keys to.
 * @returns An iterable representing the entries of a Map from the keys each to the same fixed value.
 */
export function uniformMap<K, T>(keys: Iterable<K>, of: T) {
  return map(keys, key => [key, of] as [K, T]);
}

/**
 * @param {Iterable} iterable An iterable representing the entries of a Map.
 * @param {Function} filterFn A function that returns true if the entry is to be included, false otherwise.
 * @returns An iterable representing the entries of a Map without all those entries for which `filterFn` returned `false`.
 */
export function selectMap<K, T>(
  iterable: Iterable<[K, T]>,
  filterFn: (value: T, key: K) => boolean
) {
  return filter(iterable, ([key, val]) => filterFn(val, key));
}
/**
 * 
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {V} substitute The value to return if the key is not present.
 * @returns The value at the key in the map, or the substitute if that key is not present.
 */
export function getOrVal<T, V>(
  map: Map<T, V>,
  key: T,
  substitute: V
) {
  if (map.has(key)) {
    return map.get(key) as V;
  } else {
    return substitute;
  }
}

export function foldingGet<T, V, W>(
  map: Map<T, V>,
  key: T,
  ifPresent: (val: V, key: T) => W
): W
export function foldingGet<T, V, W>(
  map: Map<T, V>,
  key: T,
  ifPresent: (val: V, key: T) => W,
  ifAbsent: (key: T) => W
): W
/** 
 * 
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {Function} ifPresent The function to call on the value and `key` if the value is present.
 * @param  {Function} ifAbsent? The function to call on `key` if the value is absent, by default a noop returning `undefined`.
 * @returns the result of calling `ifPresent` on a value if that value is at `key` in `map`, the result of calling `ifAbsent` otherwise.
 */
export function foldingGet<T, V, W>(
  map: Map<T, V>,
  key: T,
  ifPresent: (val: V, key: T) => W,
  ifAbsent: (key: T) => W = (() => {}) as () => W
) {
  if (map.has(key)) {
    return ifPresent(
      map.get(key) as V,
      key
    );
  } else {
    return ifAbsent(key);
  }
}

/** 
 * 
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {Function} substitute The function to call on `key` if the value is not present.
 * @returns the value at `key` in `map` if that value exists, the result of calling `substitute` otherwise.
 */
export function getOrElse<T, V, W>(
  map: Map<T, V>,
  key: T,
  substitute: (key: T) => W
) {
  if (map.has(key)) {
    return map.get(key) as V;
  } else {
    return substitute(key);
  }
}

/** 
 * 
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {string | Function} error? The error to generate if the key is not present. Can be a function taking the key as a parameter, or an explicit string.
 * @returns the value at `key` in `map` if that value exists, the result of calling `substitute` otherwise.
 * @throws The specified error if an error string or function is provided, a default error message if not.
 */
export function getOrFail<T, V>(
  map: Map<T, V>,
  key: T,
  error?: string | ((key: T) => string)
) {
  return getOrElse(
    map,
    key,
    (key: T) => {
      throw new Error(
        typeof error === "function"
          ? error(key)
          : typeof error === "undefined"
            ? `Map has no entry ${key}`
            : error
      );
    }
  );
}

/**
 * 
 * Convert an iterable of values into a list of Map entries with a mapping function.
 * 
 * @param {Iterable} arr The input iterable.
 * @param {Function} mapFn The function that turns inputs into entries.
 * @returns An iterable of key-value tuples generated by the output of `mapFn` when called on members of `arr`.
 */
export function makeEntries<T, K, V>(
  arr: Iterable<T>,
  mapFn: (value: T) => [K, V]
): Iterable<[K, V]> {
  return map(arr, mapFn);
}

/**
 * 
 * Convert an iterable of values into an arbitrary-length iterable of Map entries with a flat-mapping function.
 * 
 * @param {Iterable} arr The input iterable.
 * @param {Function} expandFn The function that turns the input into a (possibly empty) list of entries.
 * @returns An iterable of key-value tuples generated by appending together the output of `expandFn` when called on members of `arr`.
 */
export function* flatMakeEntries<T, K, V>(
  arr: Iterable<T>,
  expandFn: (value: T) => Iterable<[K, V]>
): Iterable<[K, V]> {
  for (let val of arr) {
    yield* expandFn(val);
  }
}

type DeepMap1<K, T> = Map<K, T | Map<K, T>>;
type DeepMap2<K, T> = Map<K, T | DeepMap1<K, T>>;
type DeepMap3<K, T> = Map<K, T | DeepMap2<K, T>>;
type DeepMap4<K, T> = Map<K, T | DeepMap3<K, T>>;
type DeepMap5<K, T> = Map<K, T | DeepMap4<K, T>>;
type DeepMap6<K, T> = Map<K, T | DeepMap5<K, T>>;
type DeepMap7<K, T> = Map<K, T | DeepMap6<K, T>>;
type DeepMap8<K, T> = Map<K, T | DeepMap7<K, T>>;

/**
 * An arbitrarily deeply nested Map.
 * It is assumed that at all levels of nesting until the deepest, the key is of type K and the value is either of type T or type DeepMap<K, T>.
 * Unfortunately this does not model the common use case where the nesting is at a fixed depth and the chain of keys to access the most deeply nested values form a consistent tuple of distinct types.
 * However, the user can cast the deep maps to the appropriate types after applying any deep transformations they may wish.
 */
export type DeepMap<K, T> = DeepMap8<K, T>;

/**
 * A stream of flattened DeepMap entries.
 * It is like a normal map entry except the key part of the tuple is an array of keys.
 */
export type DeepMapStream<K, T> = Iterable<[K[], T]>;

/**
 * 
 * Traverse a deeply nested Map and extract an iterable consisting of all its terminal values.
 * 
 * @param  {DeepMap} deepMap The Map to traverse.
 * @returns {Iterable} All the values at the leaves of the DeepMap.
 */
export function* squeezeDeepMap<K, T>(deepMap: DeepMap<K, T>): Iterable<T> {
  for (let entry of deepMap) {
    const [_, val] = entry;

    if (val instanceof Map) {
      yield* squeezeDeepMap(val) as Iterable<T>;
    } else {
      yield val;
    }
  }
}

/**
 * 
 * Traverse a deeply nested Map and extract an iterable consisting of all its DeepMap entries.
 * 
 * @param  {DeepMap} deepMap The Map to traverse.
 * @returns {Iterable} A list of all the DeepMap's entries. The key component is a list of keys specifying the full path to the value.
 */
export function* deepMapStream<K, V>(deepMap: DeepMap<K, V>): Iterable<[K[], V]> {
  for (let entry of deepMap) {
    const [key, val] = entry;

    if ((val instanceof Map)) {
      yield* (map(deepMapStream(val), ([keys, val]) => tuple([[key, ...keys], val])));
    } else {
      yield [[key], val];
    }
  }
}

/**
 * 
 * Pump a DeepMap entry Iterable into a DeepMap.
 * The entries will create nested Maps along their paths until they reach the end of the key-list, at which point the value will be deposited in that Map.
 * As with #{@link deepCollect}, collisions can be resolved with a reconciler.
 * 
 * @example
 * pipe(
 *   deepMapStream(myDeepMap),
 *   iterable => deepCollectInto(
 *     iterable,
 *     outputDeepMap
 *   )
 * );
 * 
 * @param {Iterable} arr The DeepMap entries.
 * @param {DeepMap} seed The DeepMap to load entries into.
 * @param {Reconciler} reconcileFn? The function that transforms entry values using the colliding value at that key-list, if any.
 * @returns The seed, updated with the new deep entries.
 */
export function deepMapCollectInto<T, K>(
  arr: Iterable<[K[], T]>,
  seed: DeepMap<K, T>,
): DeepMap<K, T>
export function deepMapCollectInto<T, K, V>(
  arr: Iterable<[K[], T]>,
  seed: DeepMap<K, V>,
  reconcileFn: Reconciler<K[], T, V>
): DeepMap<K, V>
export function deepMapCollectInto<T, K, V>(
  arr: MapStream<K[], T>,
  seed: DeepMap<K, V>,
  reconcileFn?: Reconciler<K[], T, V>,
): DeepMap<K, V> {
  forEach(arr, ([keys, value]) => {
    if (!!keys && !!keys.length) {
      let deepReferenceTemp = seed;

      const keyFollow = keys.slice(0);
      while (keyFollow.length > 1) {
        const keyToFollow = keyFollow.splice(0, 1)[0];
        const deepReferenceAttempt = deepReferenceTemp.get(keyToFollow) as any as Possible<Map<K, V>>;
        if (!deepReferenceAttempt) {
          const newMap = new Map();
          deepReferenceTemp.set(keyToFollow, newMap);
          deepReferenceTemp = newMap;
        } else {
          deepReferenceTemp = deepReferenceAttempt;
        }
      }

      const deepestMap = defined(deepReferenceTemp);

      const [lastKey] = keyFollow;
      const toSet = reconcileFn ? reconcileFn(deepestMap.get(lastKey) as any as Possible<V>, value, keys)
        : value;
      deepestMap.set(lastKey, toSet as any as V);
    }
  });

  return seed;
}

/**
 * 
 * Pump a DeepMap entry Iterable into a brand new DeepMap.
 * The entries will create nested Maps along their paths until they reach the end of the key-list, at which point the value will be deposited in that Map.
 * As with #{@link deepCollectInto}, collisions can be resolved with a reconciler.
 * 
  * @param {Iterable} arr The DeepMap entries.
  * @param {Reconciler} reconcileFn? The function that transforms entry values using the colliding value at that key-list, if any.
  * @returns A new DeepMap with the entries.
  */
export function deepMapCollect<T, K>(
  arr: Iterable<[K[], T]>,
): DeepMap<K, T>
export function deepMapCollect<T, K, V>(
  arr: Iterable<[K[], T]>,
  reconcileFn: Reconciler<K[], T, V>
): DeepMap<K, V>
export function deepMapCollect<T, K, V>(
  arr: Iterable<[K[], T]>,
  reconcileFn?: Reconciler<K[], T, V>
): DeepMap<K, V> {
  return deepMapCollectInto(
    arr,
    new Map(),
    reconcileFn as any
  );
}

export function reconcileAppend<T, V, K>(
  mapFn?: (val: T) => unknown extends V ? T : V
): Reconciler<K, T, (unknown extends V ? T : V)[]> {
  if (mapFn) {
    return function(
      collidingValue,
      value
    ) {
      const val = mapFn(value);
  
      if (collidingValue === undefined) {
        return [val];
      } else {
        collidingValue.push(val);
        return collidingValue;
      }
    }
  } else {
    return function(
      collidingValue,
      value
    ) { 
      if (collidingValue === undefined) {
        return [value] as (unknown extends V ? T : V)[];
      } else {
        collidingValue.push(value as (unknown extends V ? T : V));
        return collidingValue as (unknown extends V ? T : V)[];
      }
    }
  }
}

export function reconcileAdd<K>(): Reconciler<K, number, number>
export function reconcileAdd<T, K>(
  mapFn: (val: T) => number
): Reconciler<K, T, number>
export function reconcileAdd<T, K>(
  mapFn?: (val: T) => number
): Reconciler<K, T, number> {
  return function(
    collidingValue,
    value
  ) {
    const val = mapFn ? mapFn(value) : value as any as number;

    if (collidingValue === undefined) {
      return val;
    } else {
      return val + collidingValue;
    }
  }
}

export function reconcileCount<K, T>(): Reconciler<K, T, number> {
  return function(
    collidingValue,
    _
  ) {
    if (collidingValue === undefined) {
      return 1;
    } else {
      return 1 + collidingValue;
    }
  }
}

export function reconcileAppendFlat<T, K>(): Reconciler<K, (Possible<T | Iterable<T>>), T[]>
export function reconcileAppendFlat<T, V, K>(
  mapFn: (val: T) => Possible<V | Iterable<V>>
): Reconciler<K, T, V[]>
export function reconcileAppendFlat<T, V, K>(
  mapFn: (val: T) => V[] = (val: T) => val as any as V[]
): Reconciler<K, T, V[]> {
  return function(
    collidingValue,
    value
  ) {
    const val = mapFn(value);

    if (collidingValue === undefined) {
      return val;
    } else {
      return [...collidingValue, ...val];
    }
  }
}

export function reconcileFold<K, T, V>(
  mapper: (val: T) => V,
  reducer: (colliding: V, val: T) => V
): Reconciler<K, T, V> {
  return function(
    collidingValue,
    value
  ) {
    if (collidingValue === undefined) {
      return mapper(value);
    } else {
      return reducer(collidingValue, value);
    }
  }
}

export function reconcileDefault<K, T>(): Reconciler<
  K,
  T,
  T
> {
  return function(_, value) {
    return value;
  }
}

export function reconcileFirst<K, T>(): Reconciler<K, T, T> {
  return function(collidingValue, incomingValue) {
    if (collidingValue === undefined) {
      return incomingValue;
    } else {
      return collidingValue;
    }
  }
}

export function invertBinMap<K, T>(map: Iterable<[K, T[]]>): Map<T, K[]> {
  return mapCollect(
    flatMap(
      map,
      ([key, arr]) => arr.map(t => tuple([t, key]))
    ),
    reconcileAppend()
  );
}

export function mapToDictionary<K, T>(map: Iterable<[K, T]>, stringifier: (val: K) => string = String) {
  const ret: { [key: string]: T } = {};

  for (let entry of map) {
    const [key, val] = entry;
    ret[stringifier(key)] = val;
  }

  return ret;
}

export function deepFoldingGet<T, V, W>(
  map: Map<T, V>,
  lookup: T[],
  ifPresent: (val: V, keys: T[]) => W,
  ifAbsent: (keys: T[], matched: T[]) => W
) {
  const follow = lookup.slice();
  const matched: T[] = [];
  let innerMap = map;

  while (follow.length) {
    const [key] = follow.splice(0, 1);

    if (innerMap.has(key)) {
      matched.push(key);
      const value = innerMap.get(key);

      if (follow.length) {
        if (value instanceof Map) {
          innerMap = value;
        } else {
          return ifAbsent(lookup, matched);
        }
      } else {
        return ifPresent(value as V, lookup);
      }
    } else {
      return ifAbsent(lookup, matched);
    }
  }

  return ifAbsent(lookup, matched);
}

export function deepGet<K, T>(map: DeepMap<K, T>, lookup: K[]) {
  const follow = lookup.slice();
  let innerMap = map;

  while (follow.length) {
    const [key] = follow.splice(0, 1);

    if (innerMap.has(key)) {
      const value = innerMap.get(key);

      if (follow.length) {
        if (value instanceof Map) {
          innerMap = value;
        } else {
          return undefined;
        }
      } else {
        return value;
      }
    } else {
      return undefined;
    }
  }

  return undefined;
}

export function deepGetOrVal<K, T>(map: DeepMap<K, T>, lookup: K[], substitute: T) {
  const follow = lookup.slice();
  let innerMap = map;

  while (follow.length) {
    const [key] = follow.splice(0, 1);

    if (innerMap.has(key)) {
      const value = innerMap.get(key);

      if (follow.length) {
        if (value instanceof Map) {
          innerMap = value;
        } else {
          return substitute;
        }
      } else {
        return value as T;
      }
    } else {
      return substitute;
    }
  }

  return substitute;
}

export function deepGetOrElse<K, T>(map: DeepMap<K, T>, lookup: K[], substituteFn: (lookup: K[], matched: K[]) => T) {
  const follow = lookup.slice();
  const matched: K[] = [];
  let innerMap = map;

  while (follow.length) {
    const [key] = follow.splice(0, 1);

    if (innerMap.has(key)) {
      matched.push(key);
      const value = innerMap.get(key);

      if (follow.length) {
        if (value instanceof Map) {
          innerMap = value;
        } else {
          return substituteFn(lookup, matched);
        }
      } else {
        return value as T;
      }
    } else {
      return substituteFn(lookup, matched);
    }
  }

  return substituteFn(lookup, matched);
}


export function deepGetOrFail<K, T>(map: DeepMap<K, T>, lookup: K[], error?: string | ((follow: K[], matched: K[]) => string)) {  
  return deepGetOrElse(map, lookup, (lookup, matched) => {
    throw new Error(
      typeof error === "function"
        ? error(lookup, matched)
        : typeof error === "undefined"
          ? `Deep lookup failed on keys [${lookup}], keys matched were [${matched}]`
          : error
    );
  });
}

/**
 * @param  {DeepMap} map
 * @param  {Array} lookup The series of keys to use to dig into the nested Maps.
 */
export function deepHas<K, T>(map: DeepMap<K, T>, lookup: K[]) {
  const follow = lookup.slice();
  const matched: K[] = [];
  let innerMap = map;

  while (follow.length) {
    const [key] = follow.splice(0, 1);

    if (innerMap.has(key)) {
      matched.push(key);
      const value = innerMap.get(key);

      if (follow.length) {
        if (value instanceof Map) {
          innerMap = value;
        } else {
          return false;
        }
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  return false;
}

/**
 *  Convert a deeply nested object into a deeply nested Map.
 * 
 * @param {object} dictionary The deeply nested object to transform.
 * @param {number} maxDepth The maximum number of levels to dig into the dictionary.
 * @returns {Iterable} A stream of entries representing a deeply nested Map.
 * This can be turned into the real Map with {@link deepMapCollect}.
 */
export function deepDictionaryToMap<Y>(dictionary: {[key: string]: Y}, maxDepth: number = Infinity): DeepMapStream<string, Y> {
  return flatMap(
    entries(dictionary),
    ([key, object]) => {
      if (maxDepth === 1 || object === null || typeof object !== "object" || Array.isArray(object) || object instanceof Date) {
        return [tuple([[key], object as any as Y])];
      } else {
        return map(
          deepDictionaryToMap<Y>(object as any as {[key: string]: Y}, maxDepth - 1),
          ([keys, object]) => tuple([[key, ...keys], object as any as Y]),
        );
      }
    }
  );
}

/**
 * 
 * Combine two Maps into a stream of entries of the form `[commonKeyType, [valueInFirstMap], [valueInSecondMap]]`.
 * Any key that is not contained in both input Maps will not be represented in the output.
 * To include them, use {@link zipMapsUnion}.
 * 
 * @remarks
 * Internally, `zipMapsIntersection` turns `map2` into a Map if it isn't one already.
 * This is because it needs random access into `map2` while looping over `map1` to get the values to zip.
 * 
 * @param map1 
 * @param map2
 * @returns {Iterable} An iterable of the form `Map<commonKeyType, [valueInFirstMap, valueInSecondMap]>` containing all keys that `map1` and `map2` have in common.
 */
export function* zipMapsIntersection<K, T1, T2>(map1: Iterable<[K, T1]>, map2: Iterable<[K, T2]>): Iterable<[K, [T1, T2]]> {
  const map2Collect: Map<K, T2> = map2 instanceof Map ? map2 : mapCollect(map2);
  
  for (let [key, value1] of map1) {
    if (map2Collect.has(key)) {
      yield [key, [value1, getOrFail(map2Collect, key)]];
    }
  }
}

/**
 * 
 * Combine two Maps into a stream of entries of the form `[commonKeyType, [valueInFirstMap | undefined], [valueInSecondMap | undefined]]`.
 * If a key is in one Map but not the other, the output tuple will contain `undefined` in place of the missing value.
 * To exclude them instead, use {@link zipMapsUnion}.
 * 
 * @remarks
 * Internally, `zipMapsUnion` must collect all non-Map Iterables into Maps so it can look up what keys exist in `map2` during the initial pass over `map1`, and then to determine which keys have already been yielded during the second pass over `map2`.
 * This probably makes it slower than {@link zipMapsIntersection} in this case.
 * 
 * @param map1 
 * @param map2
 * @returns {Iterable} An iterable of the form `Map<commonKeyType, [valueInFirstMap | undefined, valueInSecondMap | undefined]>` containing all keys that exist in either `map1` or `map2`.
 */
export function* zipMapsUnion<K, T1, T2>(map1: Iterable<[K, T1]>, map2: Iterable<[K, T2]>): Iterable<[K, [Possible<T1>, Possible<T2>]]> {
  const map1Collect: Map<K, T1> = map1 instanceof Map ? map1 : mapCollect(map1);
  const map2Collect: Map<K, T2> = map2 instanceof Map ? map2 : mapCollect(map2);

  for (let [key, value1] of map1Collect) {
    yield [key, [value1, map2Collect.get(key)]];
  }

  for (let [key, value2] of map2Collect) {
    if (!map1Collect.has(key)) {
      yield [key, [undefined, value2]];
    } 
  }
}

/**
 * Pipe the entries of a Map iterable into a Map, resolving key collisions by setting the incoming entry to a new key determined by `bumper`.
 * If the new key collides too, keep calling `bumper` until it either resolves to a unique key or returns `undefined` to signal failure.
 * 
 * @param  {Iterable} mapStream An entry stream with duplicate keys.
 * @param  {BumperFn} bumper A function to be called each time a key would overwrite a key that has already been set in `seed`.
 * @param  {Map} seed The Map to insert values into.
 * @returns {{Map}} The finalized Map. 
 */
export function bumpDuplicateKeys<K, T>(
  mapStream: Iterable<[K, T]>,
  bumper: BumperFn<K, T>
): Map<K, T> {
  return collectIntoBumpingDuplicateKeys(
    mapStream,
    bumper,
    new Map()
  );
}
/**
 * 
 * Function to resolve bumping keys.
 * {@link bumpDuplicateKeys} and {@link collectIntoBumpingDuplicateKeys} take one of these as an argument and call it every time they fail to insert an entry into a Map because of a duplicate key.
 * If the BumperFn returns a key, the caller will use that as the new insertion key.
 * If the BumperFn returns `undefined`, the caller will treat this as a failure and skip it.
 * 
 * @remarks
 * The `priorBumps` parameter can be used to fail key generation if too many collisions occur, either by returning `undefined` or by throwing an appropriate error (see {@link throwOnBump}).
 * For complex functions, this is the only guaranteed way to avoid entering an infinite loop.
 * 
 * @param  {K} collidingKey The key that would have been set in a Map if it did not already exist in the Map.
 * @param  {number} priorBumps The number of times the caller has already attempted to insert the key.
 * @param  {T} collidingValue The value that is currently set at the key in a Map.
 * @param  {T} incomingValue The value that would have been set at the key in a Map.
 * @returns {K | undefined} The key if a key was successfully generated, `undefined` otherwise.
 */
export type BumperFn<K, T> = (collidingKey: K, priorBumps: number, collidingValue: T, incomingValue: T) => Possible<K>;

/**
 * Pipe the entries of a Map iterable into a Map, resolving key collisions by setting the incoming entry to a new key determined by `bumper`.
 * If the new key collides too, keep calling `bumper` until it either resolves to a unique key or returns `undefined` to signal failure.
 * 
 * @param  {Iterable} mapStream An entry stream with duplicate keys.
 * @param  {BumperFn} bumper A function to be called each time a key would overwrite a key that has already been set in `seed`.
 * @param  {Map} seed The Map to insert values into.
 * @returns {{Map}} The finalized Map. 
 */
export function collectIntoBumpingDuplicateKeys<K, T>(
  mapStream: Iterable<[K, T]>,
  bumper: BumperFn<K, T>,
  seed: Map<K, T>
): Map<K, T> {
  for (let [key, value] of mapStream) {
    if (seed.has(key)) {
      let newKey = key;
      let attempts = 0;

      do {
        attempts++;
        const innerNewKey = bumper(newKey, attempts, getOrFail(seed, key), value);

        if (innerNewKey === undefined) {
          // Failed to set
          break;
        } else if (!seed.has(newKey)) {
          seed.set(innerNewKey, value);
          break;
        } else {
          newKey = innerNewKey;
        }
      } while (!!newKey);
    } else {
      seed.set(key, value);
    }
  }

  return seed;
}

/**
 * 
 * Function that a caller of bumpDuplicateKeys() can use to produce a handy generic error message on failure to resolve.
 * 
 * @param collidingKey The key that could not be resolved.
 * @param priorBumps The number of attempts made before the bumper gave up.
 */
export function throwOnBump<K, T>(collidingKey: K, priorBumps: number): never {
  const pluralize = (n: number) => n === 1 ? "try" : "tries";
  throw new Error(`Failed to resolve key "${collidingKey}" to a unique value after ${priorBumps} ${pluralize(priorBumps)}`);
}