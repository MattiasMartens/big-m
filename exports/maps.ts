import {BiMap} from "./bidirectional";
import {defined, Possible, tuple} from "../types/utils";
import {map, filter, flatMap, forEach, entries} from "../iterable";

export type MapStream<K, V> = Iterable<[K, V]>;

export type Reconciler<K, T, V> = (
  colliding: Possible<V>,
  incoming: T,
  key: K
) => V;

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

export function reverseMap<K, T>(
  iterable: Iterable<[K, T]>
) {
  return map(iterable, ([k, t]) => [t, k] as [T, K])
}

export function mapValues<K, T, V>(
  iterable: Iterable<[K, T]>,
  fn: (value: T, key: K) => V
): MapStream<K, V> {
  return map<[K, T], [K, V]>(iterable, ([key, val]) => [key, fn(val, key)]);
}

export function keysOf<K, T>(
  iterable: Iterable<[K, T]>
) {
  return map(iterable, arr => arr[0]);
}

export function valuesOf<K, T>(
  iterable: Iterable<[K, T]>
) {
  return map(iterable, arr => arr[1]);
}

export function uniformMap<K, T>(keys: Iterable<K>, of: T) {
  return map(keys, key => [key, of] as [K, T]);
}

export function selectMap<K, T>(
  iterable: Iterable<[K, T]>,
  filterFn: (value: T, key: K) => boolean
) {
  return filter(iterable, ([key, val]) => filterFn(val, key));
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
  ifPresent: (val: V, key: T) => W
): W
export function foldingGet<T, V, W>(
  map: Map<T, V>,
  key: T,
  ifPresent: (val: V, key: T) => W,
  ifAbsent: (key: T) => W
): W
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

export function flatMakeEntries<T, K, V>(
  arr: Iterable<T>,
  expandFn: (value: T) => Iterable<[K, V]>
): Iterable<[K, V]> {
  return flatMap(arr, function* (t) {
    for (let entry of expandFn(t)) {
      yield entry;
    }
  });
}

export function makeEntries<T, K, V>(
  arr: Iterable<T>,
  mapFn: (value: T) => [K, V]
): Iterable<[K, V]> {
  return map(arr, mapFn);
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

export type DeepMapStream<K, T> = Iterable<[K[], T]>;

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
  return flatMap(
    entries(dictionary),
    ([key, object]) => {
      if (object === null || typeof object !== "object" || Array.isArray(object) || object instanceof Date) {
        return [tuple([[key], object as any as Y])];
      } else {
        return map(
          deepDictionaryToMap<Y>(object as {[key: string]: Object}),
          ([keys, object]) => tuple([[key, ...keys], object as any as Y]),
        );
      }
    }
  );
}