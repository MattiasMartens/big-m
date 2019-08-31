import wu from "wu";
import {BiMap} from "./bidirectional";
import {Option, some, none, fold, isSome} from "fp-ts/lib/Option";
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
  colliding: Option<V>,
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
        seed.has(key) ? some(defined(seed.get(key))) : none,
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

export function collect<K, T>(
  iterable: Iterable<[K, T]>,
  reconcileFn?: Reconciler<K, T, T>
) {
  return collectInto(
    iterable,
    new Map<K, T>(),
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

export function getOrDefault<T, V>(
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

export function getOption<T, V>(
  map: Map<T, V>,
  key: T
) {
  if (map.has(key)) {
    return some(map.get(key));
  } else {
    return none;
  }
}

function optionArray<T>(opt: Option<T>) {
  return fold(
    () => [] as T[],
    (t: T) => [t]
  )(opt);
}

export function makeEntries<T, K, V>(
  arr: Iterable<T>,
  keyFn: (value: T) => Option<K>
): wu.WuIterable<[K, T]>
export function makeEntries<T, K, V>(
  arr: Iterable<T>,
  keyFn: (value: T) => Option<K>,
  mapFn: (value: T, key: K) => V
): wu.WuIterable<[K, V]>
export function makeEntries<T, K, V>(
  arr: Iterable<T>,
  keyFn: (value: T) => Option<K>,
  mapFn?: (value: T, key: K) => V
): wu.WuIterable<[K, V]> {
  const result = wu.concatMap(t => optionArray(keyFn(t)).map(key => tuple(key, t) as [K, T]), arr);

  if (mapFn) {
    return result.map(([key, t]) => tuple(key, mapFn(t, key)));
  } else {
    return result as any as wu.WuIterable<[K, V]>;
  }
}

export function accumulate<T, K, V>(
  arr: Iterable<T>,
  keyFn: (value: T) => Option<K>,
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
  keyFn: (value: T) => Option<K>,
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

export function deepAccumulateMap<Y, T, K, V>(
  arr: T[],
  keyFn: (value: T, index: number) => K[] | undefined,
  accumulateFn: (collidingValue: Possible<V>, value: T, index: number, key: K[]) => V,
  seed: Map<K, Y> = new Map()
): Map<K, Y> {
  arr.forEach((value, index) => {
    const keys = keyFn(value, index);

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
      deepestMap.set(lastKey, accumulateFn(deepestMap.get(lastKey) as any as Possible<V>, value, index, keys) as any as Y);
    }
  });

  return seed;
}

