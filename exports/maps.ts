import { filter, flatMap, forEach, map, combine } from '../iterable';
import { Possible, tuple } from '../types/utils';

/**
 * Any iterable of entries, regardless of origin.
 * Note that `Map<K, V>` is in this type.
 */
export type MapEnumeration<K, V> = Iterable<[K, V]>;

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
 * If the updated value is `undefined`, any existing value at the key will be deleted.
 */
export type Reconciler<K, T, V> = (
  colliding: Possible<V>,
  incoming: T,
  key: K
) => V;

/**
 * Insert the entries in the iterable into the provided map.
 * 
 * @param {Iterable} iterable The entries to add.
 * @param {Map} seed The Map to add them to.
 * @param {Reconciler} reconcileFn
 */
export function mapCollectInto<K, T, P extends Map<K, T>>(
  iterable: Iterable<[K, T]>,
  seed: P
): P
/**
 * Insert the entries in the iterable into the provided map.
 * If two values map to the same key, `reconcileFn` will be called to combine the colliding values to set the final value; otherwise, the last value to arrive at that key will overwrite the rest.
 * 
 * @param {Iterable} iterable The entries to add.
 * @param {Map} seed The Map to add them to.
 * @param {Reconciler} reconcileFn
 * A function specifying what value to set when two keys map to the same value.
 * If provided, this is called whether there is a collision or not, so it also serves as a mapper.
 * Called with:
 * 1. The value previously set at this key, or `undefined` if no value was set;
 * 2. The new value arriving from the Iterable;
 * 3. The key where the output will be entered.
 * @returns The updated Map. 
 */
export function mapCollectInto<K, T, V, P extends Map<K, V>>(
  iterable: Iterable<[K, T]>,
  seed: P,
  reconcileFn: Reconciler<K, T, V>
): P
/**
 * Insert the entries in the iterable into the provided map.
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
export function mapCollectInto<K, T, V, P extends Map<K, V>>(
  iterable: Iterable<[K, T]>,
  seed: P,
  reconcileFn?: Reconciler<K, T, V>
): P {
  if (reconcileFn) {
    for (let [key, val] of iterable) {
      const got = seed.get(key);
      const reconciled = reconcileFn(
        got,
        val,
        key
      );
      if (reconciled === undefined) {
        seed.delete(key);
      } else if (reconciled !== got) {
        seed.set(key, reconciled);
      }
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
 * Combine Iterables of Map entries into a single Iterable, leaving keys unmerged.
 * 
 * @param maps The Map Iterables to merge
 * @returns An Iterable consisting of *all* entries of the Iterables in the arguments, even those with duplicate keys.
 */
export function concatMap<K, T>(
  ...maps: MapEnumeration<K, T>[]
): MapEnumeration<K, T> {
  return combine(...maps);
}

/**
 * Convert an Iterable of Map entries into a brand new map.
 * When called on a map, the result will be a new Map with the same entries as the previous one.
 * If two values map to the same key, the last value to arrive at that key will overwrite the rest.
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
/**
 * Convert an Iterable of Map entries into a brand new map.
 * When called on a map, the result will be a new Map with the same entries as the previous one.
 * If two values map to the same key, `reconcileFn` will be called to combine the colliding values to set the final value; otherwise, the last value to arrive at that key will overwrite the rest.
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
export function mapCollect<K, T, V>(
  iterable: Iterable<[K, T]>,
  reconcileFn: Reconciler<K, T, V>
): Map<K, V>
/**
 * Convert an Iterable of Map entries into a brand new map.
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
 * Reverse a stream of entries so that entries of the form [key, value] are now in the form [value, key].
 * 
 * Any key collisions must be handled in later steps, or they will be reconciled automatically by later entries overriding earlier ones.
 * 
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @returns An iterable representing the entries of a Map from value to key.
 */
export function reverseMap<K, T>(
  iterable: Iterable<[K, T]>
) {
  return map(iterable, ([k, t]) => [t, k] as [T, K])
}

/**
 * Given a Map-like Iterable, produce an entry set for a new Map where each key has been mapped to a new key by calling ${mapper}.
 * 
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @param {Function} mapper A function mapping the values of the Map to a transformed value.
 * @returns An iterable representing the entries of a map from key to the transformed value.
 */
export function mapValues<K, T, V>(
  iterable: Iterable<[K, T]>,
  mapper: (value: T, key: K) => V
): MapEnumeration<K, V> {
  return map<[K, T], [K, V]>(iterable, ([key, val]) => [key, mapper(val, key)]);
}

/**
 * Given a Map-like Iterable, produce an entry set for a new Map where each key has been mapped to a new key by calling ${keyMapper}.
 * 
 * Any key collisions must be handled in later steps, or they will be reconciled automatically by later entries overriding earlier ones.
 * 
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @param {Function} fn A function mapping the keys of the Map to a transformed key.
 * @returns An iterable representing the entries of a map from the transformed key to value.
 */
export function mapKeys<K, T, V>(
  iterable: Iterable<[K, T]>,
  keyMapper: (key: K, value: T) => V
): MapEnumeration<V, T> {
  return map<[K, T], [V, T]>(iterable, ([key, val]) => [keyMapper(key, val), val]);
}

/**
 * Get an Iterable containing the keys of a Map or Map-like Iterable.
 * 
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @returns An iterable representing the keys of the map.
 */
export function keysOf<K, T>(
  iterable: Iterable<[K, T]>
) {
  return map(iterable, arr => arr[0]);
}

/**
 * Get an Iterable containing the values of a Map or Map-like Iterable.
 * 
 * @param {Iterable} iterable An iterable representing the entries of a Map from key to value.
 * @returns An iterable representing the values of the map.
 */
export function valuesOf<K, T>(
  iterable: Iterable<[K, T]>
) {
  return map(iterable, arr => arr[1]);
}

/**
 * Create a Map-like Iterable from an Iterable of keys where each key maps to the same value.
 * 
 * @param {Iterable} iterable An iterable representing the keys of a Map.
 * @param {T} of The fixed value to set all keys to.
 * @returns An Iterable representing the entries of a Map from the keys each to the same fixed value.
 */
export function uniformMap<K, T>(keys: Iterable<K>, of: T) {
  return map(keys, key => [key, of] as [K, T]);
}

/**
 * Filter out key-value pairs from a Map or Map-like Iterable.
 * 
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
 * Retrieve a value from the Map at the given key. If it is not present, return ${substitute} instead.
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

/**
 * Retrieve a value from the Map at the given key. If the value was retrieved, map it with ${ifPresent}; if not, return undefined.
 * 
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {Function} ifPresent The function to call on the value and `key` if the value is present.
 * @returns the result of calling `ifPresent` on a value if that value is at `key` in `map`, undefined otherwise.
 */
export function foldingGet<T, V, W>(
  map: Map<T, V>,
  key: T,
  ifPresent: (val: V, key: T) => W
): W
/** 
 * Retrieve a value from the Map at the given key. If the value was retrieved, map it with ${ifPresent}; if not, return the result or calling ${ifAbsent}.
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
  ifAbsent: (key: T) => W
): W
/** 
 * Retrieve a value from the Map at the given key. If the value was retrieved, map it with ${ifPresent}; if not, return the result or calling ${ifAbsent}.
 * 
 * @param  {Map} map The map on which to perform the lookup.
 * @param  {T} key The key to look up.
 * @param  {Function} ifPresent The function to call on the value and `key` if the value is present.
 * @param  {Function} ifAbsent? The function to call with `key` if the value is absent, by default a noop returning `undefined`.
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
 * Set a value on Map, using a Reconciler to merge the incoming value with any existing value.
 * 
 * This simulates the behaviour of merging a value in MapCollect, but for a single value instead of an Iterable.
 * 
 * WARNING: This includes the behaviour that, if the Reconciler returns `undefined`, the entry at the Map will be deleted.
 * 
 * @param map The Map to set the key-value pair on.
 * @param key The key to set.
 * @param value The value to reconcile with any possible colliding value in Map.
 * @param reconciler The reconciler function.
 * @returns The value ultimately set.
 */
export function reconcileEntryInto<T, V, W>(
  map: Map<T, W>,
  key: T,
  value: V,
  reconciler: Reconciler<T, V, Possible<W>>
): Possible<W> {
  const reconciled = reconciler(
    map.get(key),
    value,
    key
  );

  if (reconciled !== undefined) {
    map.set(key, reconciled);
  } else {
    map.delete(key);
  }

  return reconciled;
}

/** 
 * Retrieve a value from the Map at the given key. If the key is not set, return an alternate value by calling ${substitute}.
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
 * Retrieve a value from the Map at the given key, throwing an error if the key was not set.
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
            ? `Map has no entry "${key}"`
            : error
      );
    }
  );
}

/**
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
 * Produce an Iterable from a list of values and a function to produce a key for each value.
 * 
 * Does not check collisions; these can be handled at a later step.
 * 
 * @param arr The values to map.
 * @param keyFn The function to generate keys.
 * @returns An Iterable representing key-value pairs where the keys are generated by calling `keyFn` on the values.
 */
export function* keyBy<T, K>(
  arr: Iterable<T>,
  keyFn: (value: T) => K
): Iterable<[K, T]> {
  for (let val of arr) {
    yield [
      keyFn(val),
      val
    ];
  }
}

/**
 * Generate a Map that stores the keys of incoming values, as produced by ${keyFn}, and maps them to the full array of values that produced those keys.
 * 
 * For those familiar with SQL, this is functionally a "GROUP BY" query that groups values by combining them into arrays.
 * 
 * @param {Iterable} arr The Iterable to map over.
 * @param keyFn The function to generate keys with.
 */
export function binMap<T, K, P extends Map<K, T[]>>(
  arr: Iterable<T>,
  keyFn: (val: T) => K,
  seed?: P
): P extends unknown ? Map<K, T[]> : P {
  const ret = seed || new Map<K, T[]>();

  forEach(
    arr,
    val => {
      const key = keyFn(val);

      const current = getOrVal(
        ret,
        key,
        [] as T[]
      );

      current.push(val);

      ret.set(key, current);
    }
  );

  return ret as any;
}


/**
 * Convert an iterable of values into a sequence of Map entries, pairing each value with a series of keys as returned by ${expandFn}.
 * 
 * Where @{expandFn} returns no keys, the value will be ignored; where it returns multiple keys, an entry will be created for each key.
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

/**
 * Generate a Reconciler that pushes input values onto an array of previously colliding values, optionally transforming them first with a mapper.
 * 
 * @param {Function} mapFn? A function to call on the inputs.
 * @returns {Reconciler} A Reconciler that combines input values into an Array.
 */
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

/**
 * Generate a Reconciler that adds a numeric input value to a colliding numeric value.
 * 
 * @returns {Reconciler} A summing Reconciler.
 */
export function reconcileAdd<K>(): Reconciler<K, number, number>
/**
 * Generate a Reconciler that either adds a numeric input value to a colliding numeric value, or maps the input value to a number before doing so.
 * 
 * @param {Function} mapFn A function that maps incoming values to numbers so they can be reconciled by adding.
 * @returns {Reconciler} A summing Reconciler.
 */
export function reconcileAdd<T, K>(
  mapFn: (val: T) => number
): Reconciler<K, T, number>
/**
 * Generate a Reconciler that either adds a numeric input value to a colliding numeric value, or maps the input value to a number before doing so.
 * 
 * @param {Function} mapFn A function that maps incoming values to numbers so they can be reconciled by adding.
 * @returns {Reconciler} A summing Reconciler.
 */
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

/**
 * Generate a Reconciler that bumps up a count on each collision, ultimately yielding the total number of entries that collided on a key.
 * 
 * @returns {Reconciler} A Reconciler that counts entries that has the same key.
 */
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

/**
 * Generate a Reconciler that concatenates input values together when they collide.
 * 
 * @returns {Reconciler} A Reconciler that concatenates input values together.
 */
export function reconcileConcat<T, K>(): Reconciler<K, (Possible<Iterable<T>>), T[]>
/**
 * Generate a Reconciler that concatenates input values together when they collide, optionally transforming them first with a mapper.
 * 
 * @param {Function} mapFn? A function to call on the inputs.
 * Regardless of the input type, the output must be an Iterable so it can be concatenated into the Map.
 * @returns {Reconciler} A Reconciler that concatenates input values together.
 */
export function reconcileConcat<T, V, K>(
  mapFn: (val: T) => Iterable<V> = (val: T) => val as any as V[]
): Reconciler<K, T, V[]> {
  return function(
    collidingValue,
    value
  ) {
    const val = mapFn(value);

    if (collidingValue === undefined) {
      return Array.from(val);
    } else {
      return [...collidingValue, ...val];
    }
  }
}

/**
 * Generate a Reconciler by specifying a function to run by default, and a second function to run if a value already exists in the Map at the specified key.
 * 
 * @remarks
 * This is an alternate dialect for generating a Reconciler that saves the boilerplate of `if () {} else {}` at the cost of having to define two different functions.
 *
 * @param mapper A function that takes an incoming value and returns the value to set.
 * @param reducer A function that takes the colliding value and an incoming value and returns the value to set.
 * 
 * @returns A Reconciler that calls `mapper` if a collidingValue exists (even if it is `undefined`!), calls `reducer` otherwise.
 */
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

/**
 * Generate a Reconciler by specifying a function to generate the initial value if none exists, and a second function to run to merge the incoming value with either the preexisting value or the initial value.
 * 
 * @remarks
 * This is an alternate dialect for generating a Reconciler that saves the boilerplate of `const toMerge = colliding === undefined ?initial() : colliding;` at the cost of having to define two different functions.
 * It makes the function behave like a traditional reducer, with a zip function and an initializer.
 * 
 * @param reducer A function that merges a colliding value and an incoming value.
 * @param initial A function that generates the first colliding value for when a colliding value does not exist.
 * 
 * @returns A Reconciler that calls `mapper` if a collidingValue exists (even if it is `undefined`!), calls `reducer` otherwise.
 */
export function reconcileInit<K, T, V>(
  initializer: (val: T) => V,
  reducer: (colliding: V, val: T) => V
): Reconciler<K, T, V> {
  return function(
    collidingValue,
    value
  ) {
    if (collidingValue === undefined) {
      return reducer(initializer(
        value
      ), value);
    } else {
      return reducer(collidingValue, value);
    }
  }
}

/**
 * Generate a reconciler that simulates the default behaviour of setting Maps, overwriting any value that was already at the key on `set`.
 * @returns {Reconciler} A Reconciler that always returns the `incomingValue`. 
 */
export function reconcileDefault<K, T>(): Reconciler<
  K,
  T,
  T
> {
  return function(_, value) {
    return value;
  }
}

/**
 * Generate a reconciler that reverses the default behaviour of setting Maps: instead of overwriting what's already at a key, the `set` operation is ignored if a value is already present at that key.
 * @returns {Reconciler} A Reconciler that returns the `collidingValue` if it is defined, the `incomingValue` otherwise. 
 */
export function reconcileFirst<K, T>(): Reconciler<K, T, T> {
  return function(collidingValue, incomingValue) {
    if (collidingValue === undefined) {
      return incomingValue;
    } else {
      return collidingValue;
    }
  }
}

/**
 * Convert a map from keys to arrays of values (i.e., of the form Map<K, T[]>) to a map of values from arrays of keys (i.e., of the form Map<T, K[]>).
 * 
 * @example
 * const peopleToFlavours = new Map([
 *   ["Alex", ["vanilla"]],
 *   ["Desdemona", ["banana", "chocolate"],
 *   ["Henrietta", ["vanilla", "chocolate", "cherry"]
 * ]);
 * 
 * const flavoursToPeople = new Map([
 *   ["vanilla", ["Alex", "Henrietta"]],
 *   ["banana", ["Desdemona"]],
 *   ["chocolate", ["Desdemona", "Henrietta"]],
 *   ["cherry", ["Henrietta"]]
 * ]);
 * 
 * assert(deepEquals(
 *   Array.from(flavoursToPeople),
 *   Array.from(invertBinMap(peopleToFlavours))
 * ));
 * 
 * @param {Iterable} map An Iterable representing a Map of entries where the values are arrays.
 * @returns {Map} A Map containing, for each member value that appears in any of the arrays, an entry where the key is the value in the array and the value is a list of all the keys in the input Map that included it.
 */
export function invertBinMap<K, T>(map: Iterable<[K, T[]]>): Map<T, K[]> {
  return mapCollect(
    flatMap(
      map,
      ([key, arr]) => arr.map(t => tuple([t, key]))
    ),
    reconcileAppend()
  );
}

/**
  * Convert a map from keys to arrays of values (i.e., of the form Map<K, T[]>) to a map of different keys to arrays of values (i.e. of the form Map<K2, T[]>) with a re-keying function that takes the value and its current key.
  *
  * This is most useful when a collection of objects has been grouped by one of its properties and, after operating on it, you need to group it by a different one of its properties.
  *
  * @example
const peopleToFlavours = new Map([
  ["Alex", [{name: "Alex", flavour: "vanilla"}]],
  ["Desdemona", [{name: "Desdemona", flavour: "banana"}, {name: "Desdemona", flavour: "chocolate"}]],
  ["Alexa", [{name: "Alexa", flavour: "vanilla"}, {name: "Alexa", flavour: "chocolate"}, {name: "Alexa", flavour: "cherry"}]]
]);

const flavoursToPeople = new Map([
  ["vanilla", [{name: "Alex", flavour: "vanilla"}, {name: "Alexa", flavour: "vanilla"}]],
  ["banana", [{name: "Desdemona", flavour: "banana"}]],
  ["chocolate", [{name: "Desdemona", flavour: "chocolate"}, {name: "Alexa", flavour: "chocolate"}]],
  ["cherry", [{name: "Alexa", flavour: "cherry"}]]
]);

should.deepEqual(
  Array.from(flavoursToPeople),
  Array.from(rekeyBinMap(peopleToFlavours, val => val.flavour))
);
  * 
  * @param {Iterable} map An Iterable representing a Map of entries where the values are arrays.
  * @param {Function} keyBy The function used to generate a new key for each member element of each bin.
  * First argument: the value in the bin
  * Second argument: the key of the bin
  * @returns {Map} A Map containing, for each member value that appears in any of the arrays, an entry where the key is the value in the array and the value is a list of all the keys in the input Map that included it.
  */
export function rekeyBinMap<K, T, K2>(map: Iterable<[K, T[]]>, keyBy: (element: T, key: K) => K2): Map<K2, T[]> {
  return mapCollect(
    flatMap(
      map,
      ([key, arr]) => arr.map(t => tuple([keyBy(t, key), t]))
    ),
    reconcileAppend()
  );
}

/**
 * Convert a Map into a dictionary.
 * 
 * @remarks This is handy when the contents of map need to be serialized to JSON.
 * 
 * @param {Iterable} map An iterable of Map entries.
 * @param {Function} stringifier? A function to convert a Map key into a string key that is suitable for use in a dictionary. If excluded, `mapToDictionary` will use the default String constructor.
 * @returns The new dictionary object.
 */
export function mapToDictionary<K, T>(map: Iterable<[K, T]>, stringifier: (val: K) => string = String) {
  const ret: { [key: string]: T } = {};

  for (let entry of map) {
    const [key, val] = entry;
    ret[stringifier(key)] = val;
  }

  return ret;
}

/**
 * Combine two Maps into a stream of entries of the form `[commonKeyType, [valueInFirstMap, valueInSecondMap]]`.
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
 * Combine two Maps into a stream of entries of the form `[commonKeyType, [valueInFirstMap | undefined], [valueInSecondMap | undefined]]`.
 * If a key is in one Map but not the other, the output tuple will contain `undefined` in place of the missing value.
 * To exclude them instead, use {@link zipMapsIntersection}.
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
 * @param  {Iterable} mapEnumeration An entry stream with duplicate keys.
 * @param  {BumperFn} bumper A function to be called each time a key would overwrite a key that has already been set in `seed`.
 * @param  {Map} seed The Map to insert values into.
 * @returns {{Map}} The finalized Map. 
 */
export function mapCollectBumping<K, T>(
  mapEnumeration: Iterable<[K, T]>,
  bumper: BumperFn<K, T>
): Map<K, T> {
  return mapCollectIntoBumping(
    mapEnumeration,
    bumper,
    new Map()
  );
}

/**
 * Function to resolve bumping keys.
 * {@link bumpDuplicateKeys} and {@link collectIntoBumpingDuplicateKeys} take one of these as an argument and call it every time they fail to insert an entry into a Map because of a duplicate key.
 * If the BumperFn returns a key, the caller will use that as the new insertion key.
 * If the BumperFn returns `undefined`, the caller will treat this as a failure and skip it.
 * 
 * @remarks
 * The `priorBumps` parameter can be used to fail key generation if too many collisions occur, either by returning `undefined` or by throwing an appropriate error (see {@link resolutionFailureMessage}).
 * For complex functions, this is the only guaranteed way to avoid entering an infinite loop.
 * 
 * @param  {K} collidingKey The key that would have been set in a Map if it did not already exist in the Map.
 * @param  {number} priorBumps The number of times the caller has already attempted to insert the key.
 * @param  {K} originalKey The key that was initially attempted to be set when the resolution process began.
 * @param  {T} collidingValue The value that is currently set at the key in a Map.
 * @param  {T} incomingValue The value that would have been set at the key in a Map.
 * @returns {K | undefined} The key if a key was successfully generated, `undefined` otherwise.
 */
export type BumperFn<K, T> = (collidingKey: K, priorBumps: number, originalKey: K, collidingValue: T, incomingValue: T) => Possible<K>;

/**
 * Pipe the entries of a Map iterable into a Map, resolving key collisions by setting the incoming entry to a new key determined by `bumper`.
 * If the new key collides too, keeps calling `bumper` until it either resolves to a unique key or returns `undefined` to signal failure.
 * 
 * @remarks
 * The `priorBumps` parameter can be used to fail key generation if too many collisions occur, either by returning `undefined` or by throwing an appropriate error (see {@link resolutionFailureMessage}).
 * For complex functions, this is the only guaranteed way to avoid entering an infinite loop.
 * 
 * @param {Iterable} mapEnumeration An entry stream with duplicate keys.
 * @param {BumperFn} bumper A function to be called each time a key would overwrite a key that has already been set in `seed`.
 * @param {Map} seed The Map to insert values into.
 * @returns {{Map}} The finalized Map. 
 */
export function mapCollectIntoBumping<K, T>(
  mapEnumeration: Iterable<[K, T]>,
  bumper: BumperFn<K, T>,
  seed: Map<K, T>
): Map<K, T> {
  for (let [key, value] of mapEnumeration) {
    if (seed.has(key)) {
      let newKey = key;
      let attempts = 0;

      while (true) {
        const innerNewKey = bumper(newKey, attempts++, key, getOrFail(seed, key), value);

        if (innerNewKey === undefined) {
          // Failed to set
          break;
        } else if (!seed.has(innerNewKey)) {
          seed.set(innerNewKey, value);
          break;
        } else {
          newKey = innerNewKey;
        }
      }
    } else {
      seed.set(key, value);
    }
  }

  return seed;
}

/**
 * Function that a caller of `bumpDuplicateKeys()` can use to produce a generic error message when a key collision cannot be resolved.
 * 
 * @param collidingKey The key that could not be resolved.
 * @param priorBumps The number of attempts made before the bumper gave up.
 * @returns {string} A message describing the error
 */
export function resolutionFailureMessage<K, T>(collidingKey: K, priorBumps: number): string {
  const pluralize = (n: number) => n === 1 ? "try" : "tries";
  return `Failed to resolve key "${collidingKey}" to a unique value after ${priorBumps} ${pluralize(priorBumps)}`;
}
