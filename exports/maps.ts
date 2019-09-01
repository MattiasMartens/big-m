import wu from "wu";
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

type Reconciler<K, T, V> = (
  colliding: Possible<V>,
  incoming: T,
  key: K,
  map: Map<K, V>
) => V;

export function collectInto<K, T, V>(
  iterable: Iterable<[K, T]>,
  seed: Map<K, V>,
  reconcileFn?: Reconciler<K, T, V>
): Map<K, V> {
  for (let entry of iterable) {
    const [key, val] = entry;
    if (reconcileFn) {
      seed.set(key, reconcileFn(
        seed.has(key) ? defined(seed.get(key)) : undefined,
        val,
        key,
        seed
      ));
    } else {
      seed.set(key, val as unknown as V);
    }
  }

  return seed;
}

export function collect<K, T, V>(
  iterable: Iterable<[K, T]>,
  reconcileFn?: Reconciler<K, T, V>
) {
  return collectInto(
    iterable,
    new Map<K, V>(),
    reconcileFn
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

export function accumulate<T, K, V>(
  arr: Iterable<T>,
  keyFn: (value: T) => Possible<K>,
  reconcileFn: Reconciler<K, T, V>
): Map<K, V> {
  return accumulateInto(
    arr,
    keyFn,
    reconcileFn,
    new Map()
  );
}

export function accumulateInto<T, K, V>(
  arr: Iterable<T>,
  keyFn: (value: T) => Possible<K>,
  reconcileFn: Reconciler<K, T, V>,
  seed: Map<K, V>
): Map<K, V> {
  pipe(
    makeEntries(
      arr,
      keyFn
    ),
    (entries) => collectInto(
      entries,
      seed,
      reconcileFn
    )
  );

  return seed;
}

export function* flattenDeepMap<K, V>(deepMap: Map<K, unknown>, shallow = false): Iterable<V> {
  for (let entry of deepMap) {
    const [_, val] = entry;

    if ((val instanceof Map) && !shallow) {
      yield* flattenDeepMap(val) as Iterable<V>;
    } else {
      yield val as any as V;
    }
  }
}

export function deepCollectInto<Y, T, K, V>(
  arr: MapStream<K[], T>,
  reconcileFn: (collidingValue: Possible<V>, value: T, keys: K[]) => V,
  seed: Map<K, Y>
): Map<K, Y> {
  wu(arr).forEach(([keys, value]) => {
    if (!!keys && !!keys.length) {
      let deepReferenceTemp = seed;

      const keyFollow = keys.slice(0);
      while (keyFollow.length > 1) {
        const keyToFollow = keyFollow.splice(0, 1)[0];
        const deepReferenceAttempt = deepReferenceTemp.get(keyToFollow) as any as Possible<Map<K, Y>>;
        if (!deepReferenceAttempt) {
          const newMap = new Map();
          deepReferenceTemp.set(keyToFollow, newMap as any as Y);
          deepReferenceTemp = newMap;
        } else {
          deepReferenceTemp = deepReferenceAttempt;
        }
      }

      const deepestMap = defined(deepReferenceTemp);

      const [lastKey] = keyFollow;
      deepestMap.set(lastKey, reconcileFn(deepestMap.get(lastKey) as any as Possible<V>, value, keys) as any as Y);
    }
  });

  return seed;
}

export function deepCollect<Y, T, K, V>(
  arr: MapStream<K[], T>,
  reconcileFn: (collidingValue: Possible<V>, value: T, keys: K[]) => V
): Map<K, Y> {
  return deepCollectInto(
    arr,
    reconcileFn,
    new Map()
  );
}

export function deepAccumulateInto<Y, T, K, V>(
  arr: Iterable<T>,
  keyFn: (value: T) => K[] | undefined,
  reconcileFn: (collidingValue: Possible<V>, value: T, keys: K[]) => V,
  seed: Map<K, Y>
): Map<K, Y> {
  const entries = makeEntries(arr, keyFn);

  return deepCollectInto(
    entries,
    reconcileFn,
    seed
  );
}

export function deepAccumulate<Y, T, K, V>(
  arr: Iterable<T>,
  keyFn: (value: T) => K[] | undefined,
  reconcileFn: (collidingValue: Possible<V>, value: T, keys: K[]) => V
): Map<K, Y> {
  return deepAccumulateInto(
    arr,
    keyFn,
    reconcileFn,
    new Map()
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

export function appenderFlattenReconciler<T, V, K>(): Reconciler<K, T, T[]>
export function appenderFlattenReconciler<T, V, K>(
  mapFn: (val: T) => V[]
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

export function invertBinMap<K, T>(map: MapStream<K, T[]>): Map<T, K[]> {
  return collect(
      wu(map)
        .concatMap(
          ([key, arr]) => arr.map(t => [t, key])
        ),
      appenderReconciler()
  );
}