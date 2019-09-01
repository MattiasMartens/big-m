import * as wu from "wu";
import {BiMap} from "./bidirectional";
import {pipe} from "fp-ts/lib/pipeable";
import {defined, Possible, tuple} from "../types/utils";

export type MapStream<K, V> = Iterable<[K, V]>;

export function stream<K, T>(
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
  iterable: MapStream<K, T>
) {
  return wu.map(([k, t]) => [t, k] as [T, K], iterable)
}

export function mapValues<K, T, V>(
  iterable: MapStream<K, T>,
  fn: (value: T, key: K) => V
): MapStream<K, V> {
  return wu.map(([key, val]) => [key, fn(val, key)], iterable);
}

export function keysOf<K, T>(
  iterable: MapStream<K, T>
) {
  return wu.map(arr => arr[0], iterable);
}

export function valuesOf<K, T>(
  iterable: MapStream<K, T>
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

export function getOrElse<T, V>(
  map: Map<T, V>,
  key: T,
  defaultVal: V
) {
  if (map.has(key)) {
    return map.get(key) as V;
  } else {
    return defaultVal;
  }
}

export function getOrFail<T, V>(
  map: Map<T, V>,
  key: T
) {
  if (map.has(key)) {
    return map.get(key);
  } else {
    throw new Error(`Map has no entry ${key}`);
  }
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
  pipe(
    makeEntries(
      arr,
      keyFn
    ),
    (entries) => collectInto(
      entries,
      seed,
      reconcileFn as any
    )
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

export function* flattenDeepMap<K, V>(deepMap: DeepMap<K, V>): MapStream<K[], V> {
  for (let entry of deepMap) {
    const [key, val] = entry;

    if ((val instanceof Map)) {
      yield* wu(flattenDeepMap(val)).map(([keys, val]) => [[key, ...keys], val])
    } else {
      yield [[key], val];
    }
  }
}

export function deepCollectInto<T, K>(
  arr: MapStream<K[], T>,
  seed: DeepMap<K, T>,
): DeepMap<K, T>
export function deepCollectInto<T, K, V>(
  arr: MapStream<K[], T>,
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
  arr: MapStream<K[], T>
): DeepMap<K, T>
export function deepCollect<T, K, V>(
  arr: MapStream<K[], T>,
  reconcileFn: Reconciler<K[], T, V>
): DeepMap<K, V>
export function deepCollect<T, K, V>(
  arr: MapStream<K[], T>,
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

export function foldReconciler<T, K, V>(
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

export function mapToDictionary<K, T>(map: MapStream<K, T>, stringifier: (val: K) => string = JSON.stringify) {
  const ret: { [key: string]: T } = {};

  for (let entry of map) {
    const [key, val] = entry;
    ret[stringifier(key)] = val;
  }

  return ret;
}

function deepMapToDictionaryRecurse<K, T, Y>(map: MapStream<K, T>, depth: number, stringifier: (val: K, depth: number) => string) {
  const ret: { [key: string]: Y } = {};

  for (let entry of map) {
    const [key, val] = entry;
    
    const outVal = val instanceof Map ? deepMapToDictionaryRecurse(val, depth + 1, stringifier)
      : val;
    ret[stringifier(key, depth)] = outVal as any as Y;
  }

  return ret;
}

export function deepMapToDictionary<K, T, Y>(map: MapStream<K, T>, stringifier: (val: K, depth: number) => string = String) {
  return deepMapToDictionaryRecurse(
    map,
    0,
    stringifier
  );
}