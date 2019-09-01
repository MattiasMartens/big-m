import * as wu from "wu";
import {BiMap} from "./bidirectional";
import {defined, Possible, tuple} from "../types/utils";

export type MapStream<K, V> = wu.WuIterable<[K, V]>;

export function mapStream<K, T>(
  map: Map<K, T>
) {
  return wu(
    map.entries()
  );
}

export type Reconciler<K, T, V> = (
  colliding: Possible<V>,
  incoming: T,
  key: K
) => V;

export function collectInto<K, T>(
  iterable: Iterable<[K, T]>,
  seed: Map<K, T>
): Map<K, T>
export function collectInto<K, T, V>(
  iterable: Iterable<[K, T]>,
  seed: Map<K, V>,
  reconcileFn: Reconciler<K, T, V>
): Map<K, V>
export function collectInto<K, T, V>(
  iterable: Iterable<[K, T]>,
  seed: Map<K, V>,
  reconcileFn?: Reconciler<K, T, V>
): Map<K, V> {
  for (let entry of iterable) {
    const [key, val] = entry;
    if (reconcileFn) {
      seed.set(key, reconcileFn(
        seed.get(key),
        val,
        key
      ));
    } else {
      seed.set(key, val as unknown as V);
    }
  }

  return seed;
}

export function collect<K, T>(
  iterable: Iterable<[K, T]>
): Map<K, T>
export function collect<K, T, V>(
  iterable: Iterable<[K, T]>,
  reconcileFn: Reconciler<K, T, V>
): Map<K, V>
export function collect<K, T, V>(
  iterable: Iterable<[K, T]>,
  reconcileFn?: Reconciler<K, T, V>
) {
  return collectInto(
    iterable,
    new Map<K, V>(),
    reconcileFn as any
  );
}

export function collectBiMap<K, T>(
  iterable: Iterable<[K, T]>
): Map<K, T>
export function collectBiMap<K, T, V>(
  iterable: Iterable<[K, T]>,
  reconcileFn: Reconciler<K, T, V>
): Map<K, V>
export function collectBiMap<K, T, V>(
  iterable: Iterable<[K, T]>,
  reconcileFn?: Reconciler<K, T, V>
) {
  return collectInto(
    iterable,
    new BiMap<K, V>(),
    reconcileFn as any
  );
}

export function reversedMap<K, T>(
  iterable: Iterable<[K, T]>
) {
  return wu.map(([k, t]) => [t, k] as [T, K], iterable)
}

export function mapValues<K, T, V>(
  iterable: Iterable<[K, T]>,
  fn: (value: T, key: K) => V
): MapStream<K, V> {
  return wu.map(([key, val]) => [key, fn(val, key)], iterable);
}

export function keysOf<K, T>(
  iterable: Iterable<[K, T]>
) {
  return wu.map(arr => arr[0], iterable);
}

export function valuesOf<K, T>(
  iterable: Iterable<[K, T]>
) {
  return wu.map(arr => arr[1], iterable);
}

export function uniformMap<K, T>(keys: Iterable<K>, of: T): Map<K, T> {
  return new Map(wu.map(key => [key, of] as [K, T], keys));
}

export function selectMap<K, T>(
  iterable: MapStream<K, T>,
  filterFn: (value: T, key: K) => boolean
) {
  wu.filter(([key, val]) => filterFn(val, key), iterable);
}

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
  ifPresent: (val: V, key: T) => W,
  ifAbsent: (key: T) => W
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

export function getOrElse<T, V>(
  map: Map<T, V>,
  key: T,
  substitute: (key: T) => V
) {
  if (map.has(key)) {
    return map.get(key) as V;
  } else {
    return substitute(key);
  }
}

export function getOrFail<T, V>(
  map: Map<T, V>,
  key: T,
  error?: string | ((key: T) => string)
) {
  getOrElse(
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

export function makeEntries<T, K, V>(
  arr: Iterable<T>,
  keyFn: (value: T) => Possible<K>
): wu.WuIterable<[K, T]>
export function makeEntries<T, K, V>(
  arr: Iterable<T>,
  keyFn: (value: T) => Possible<K>,
  mapFn: (value: T, key: K) => V
): wu.WuIterable<[K, V]>
export function makeEntries<T, K, V>(
  arr: Iterable<T>,
  keyFn: (value: T) => Possible<K>,
  mapFn?: (value: T, key: K) => V
): wu.WuIterable<[K, V]> {
  const result = wu.concatMap(t => {
    const key = keyFn(t);

    return key ? [tuple(key, t)] : []
  }, arr);

  if (mapFn) {
    return result.map(([key, t]) => tuple(key, mapFn(t, key)));
  } else {
    return result as any as wu.WuIterable<[K, V]>;
  }
}

export function accumulate<T, K>(
  arr: Iterable<T>,
  keyFn: (value: T) => Possible<K>
): Map<K, T>
export function accumulate<T, K, V>(
  arr: Iterable<T>,
  keyFn: (value: T) => Possible<K>,
  reconcileFn: Reconciler<K, T, V>
): Map<K, V>
export function accumulate<T, K, V>(
  arr: Iterable<T>,
  keyFn: (value: T) => Possible<K>,
  reconcileFn?: Reconciler<K, T, V>
): Map<K, V> {
  return accumulateInto(
    arr,
    new Map(),
    keyFn,
    reconcileFn as any
  );
}

export function accumulateInto<T, K>(
  arr: Iterable<T>,
  seed: Map<K, T>,
  keyFn: (value: T) => Possible<K>
): Map<K, T>
export function accumulateInto<T, K, V>(
  arr: Iterable<T>,
  seed: Map<K, V>,
  keyFn: (value: T) => Possible<K>,
  reconcileFn: Reconciler<K, T, V>
): Map<K, V>
export function accumulateInto<T, K, V>(
  arr: Iterable<T>,
  seed: Map<K, V>,
  keyFn: (value: T) => Possible<K>,
  reconcileFn?: Reconciler<K, T, V>
): Map<K, V> {
  const entries = makeEntries(
    arr,
    keyFn
  );
  
  collectInto(
    entries,
    seed,
    reconcileFn as any
  );

  return seed;
}

type DeepMap1<K, T> = Map<K, T | Map<K, T>>;
type DeepMap2<K, T> = Map<K, T | DeepMap1<K, T>>;
type DeepMap3<K, T> = Map<K, T | DeepMap2<K, T>>;
type DeepMap4<K, T> = Map<K, T | DeepMap3<K, T>>;
type DeepMap5<K, T> = Map<K, T | DeepMap4<K, T>>;
type DeepMap6<K, T> = Map<K, T | DeepMap5<K, T>>;
type DeepMap7<K, T> = Map<K, T | DeepMap6<K, T>>;
type DeepMap8<K, T> = Map<K, T | DeepMap7<K, T>>;
export type DeepMap<K, T> = DeepMap8<K, T>;

export type DeepMapStream<K, T> = wu.WuIterable<[K[], T]>;

export function* squeezeDeepMap<K, T>(deepMap: DeepMap<K, T>): Iterable<T> {
  return wu(_squeezeDeepMap(deepMap));
}

function* _squeezeDeepMap<K, T>(deepMap: DeepMap<K, T>): Iterable<T> {
  for (let entry of deepMap) {
    const [_, val] = entry;

    if (val instanceof Map) {
      yield* _squeezeDeepMap(val) as Iterable<T>;
    } else {
      yield val;
    }
  }
}

export function deepMapStream<K, V>(deepMap: DeepMap<K, V>): MapStream<K[], V> {
  return wu(_flattenDeepMap(deepMap));
}

function* _flattenDeepMap<K, V>(deepMap: DeepMap<K, V>): Iterable<[K[], V]> {
  for (let entry of deepMap) {
    const [key, val] = entry;

    if ((val instanceof Map)) {
      yield* wu(_flattenDeepMap(val)).map(([keys, val]) => [[key, ...keys], val])
    } else {
      yield [[key], val];
    }
  }
}

export function deepCollectInto<T, K>(
  arr: Iterable<[K[], T]>,
  seed: DeepMap<K, T>,
): DeepMap<K, T>
export function deepCollectInto<T, K, V>(
  arr: Iterable<[K[], T]>,
  seed: DeepMap<K, V>,
  reconcileFn: Reconciler<K[], T, V>
): DeepMap<K, V>
export function deepCollectInto<T, K, V>(
  arr: MapStream<K[], T>,
  seed: DeepMap<K, V>,
  reconcileFn?: Reconciler<K[], T, V>,
): DeepMap<K, V> {
  wu(arr).forEach(([keys, value]) => {
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

export function deepCollect<T, K>(
  arr: Iterable<[K[], T]>,
): DeepMap<K, T>
export function deepCollect<T, K, V>(
  arr: Iterable<[K[], T]>,
  reconcileFn: Reconciler<K[], T, V>
): DeepMap<K, V>
export function deepCollect<T, K, V>(
  arr: Iterable<[K[], T]>,
  reconcileFn?: Reconciler<K[], T, V>
): DeepMap<K, V> {
  return deepCollectInto(
    arr,
    new Map(),
    reconcileFn as any
  );
}

export function deepAccumulateInto<Y, T, K>(
  arr: Iterable<T>,
  seed: DeepMap<K, Y>,
  keyFn: (value: T) => K[] | undefined
): DeepMap<K, T> 
export function deepAccumulateInto<Y, T, K, V>(
  arr: Iterable<T>,
  seed: Map<K, Y>,
  keyFn: (value: T) => K[] | undefined,
  reconcileFn: (collidingValue: Possible<V>, value: T, keys: K[]) => V
): DeepMap<K, V> 
export function deepAccumulateInto<T, K, V>(
  arr: Iterable<T>,
  seed: DeepMap<K, V>,
  keyFn: (value: T) => K[] | undefined,
  reconcileFn?: (collidingValue: Possible<V>, value: T, keys: K[]) => V
): DeepMap<K, V> {
  const entries = makeEntries(arr, keyFn);

  return deepCollectInto(
    entries,
    seed,
    reconcileFn as any
  );
}

export function deepAccumulate<T, K>(
  arr: Iterable<T>,
  keyFn: (value: T) => K[] | undefined
): Map<K, T>
export function deepAccumulate<T, K, V>(
  arr: Iterable<T>,
  keyFn: (value: T) => K[] | undefined,
  reconcileFn: Reconciler<K[], T, V>
): Map<K, V>
export function deepAccumulate<T, K, V>(
  arr: Iterable<T>,
  keyFn: (value: T) => K[] | undefined,
  reconcileFn?: Reconciler<K[], T, V>
): DeepMap<K, V> {
  return deepAccumulateInto(
    arr,
    new Map(),
    keyFn,
    reconcileFn as any
  );
}

export function appenderReconciler<T, V, K>(): Reconciler<K, T, T[]>
export function appenderReconciler<T, V, K>(
  mapFn: (val: T) => V
): Reconciler<K, T, V[]>
export function appenderReconciler<T, V, K>(
  mapFn: (val: T) => V = (val: T) => val as any as V
): Reconciler<K, T, V[]> {
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
}

export function adderReconciler<K>(): Reconciler<K, number, number>
export function adderReconciler<T, K>(
  mapFn: (val: T) => number
): Reconciler<K, T, number>
export function adderReconciler<T, K>(
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

export function counterReconciler<K, T>(): Reconciler<K, T, number> {
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

export function appenderFlattenReconciler<T, K>(): Reconciler<K, (Possible<T | Iterable<T>>), T[]>
export function appenderFlattenReconciler<T, V, K>(
  mapFn: (val: T) => Possible<V | Iterable<V>>
): Reconciler<K, T, V[]>
export function appenderFlattenReconciler<T, V, K>(
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

export function foldReconciler<K, T, V>(
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

export function invertBinMap<K, T>(map: MapStream<K, T[]>): Map<T, K[]> {
  return collect(
      wu(map)
        .concatMap(
          ([key, arr]) => arr.map(t => [t, key])
        ),
      appenderReconciler()
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

export function deepHas<K, T>(map: DeepMap<K, T>, lookup: K[], error?: string | ((follow: K[], matched: K[]) => string)) {
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

function deepMapToDictionaryRecurse<K, T, Y>(map: Iterable<[K, T]>, depth: number, stringifier: (val: K, depth: number) => string) {
  const ret: { [key: string]: Y } = {};

  for (let entry of map) {
    const [key, val] = entry;
    
    const outVal = val instanceof Map ? deepMapToDictionaryRecurse(val, depth + 1, stringifier)
      : val;
    ret[stringifier(key, depth)] = outVal as any as Y;
  }

  return ret;
}

export function deepMapToDictionary<K, T>(map: Iterable<[K, T]>, stringifier: (val: K, depth: number) => string = String) {
  return deepMapToDictionaryRecurse(
    map,
    0,
    stringifier
  );
}

export function deepDictionaryToMap<Y>(dictionary: {[key: string]: Object}): DeepMapStream<string, Y> {
  return wu.entries(dictionary)
    .concatMap(([key, object]) => {
      if (object === null || typeof object !== "object" || Array.isArray(object) || object instanceof Date) {
        return [[[key], object as any as Y]];
      } else {
        return wu.map(
          ([keys, object]) => [[key, ...keys], object],
          deepDictionaryToMap<Y>(object as {[key: string]: Object})
        );
      }
    });
}