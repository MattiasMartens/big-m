import { ReadableStream } from "ts-stream";
import { Reconciler, BumperFn as Bumper, getOrFail, foldingGet } from "./maps";
import { defined, Possible } from "types/utils";
import { BiMap } from "exports";
import { CanonMap } from "./canon";


/**
 * Insert the entries of a ReadableStream into `seed` with an optional Reconciler.
 * 
 * @param {ReadableStream} stream The input stream.
 * @param {Map} seed The Map to update with the contents of `stream`.
 * @param {Reconciler} reconcileFn Function to call to resolve collisions.
 * @returns A promise of the updated map, to be returned when the ReadableStream closes.
 */
export function streamCollectInto<K, T>(
  stream: ReadableStream<[K, T]>,
  seed: Map<K, T>
): Promise<Map<K, T>>
export function streamCollectInto<K, T, V>(
  stream: ReadableStream<[K, T]>,
  seed: Map<K, V>,
  reconcileFn: Reconciler<K, T, V>
): Promise<Map<K, V>>
export async function streamCollectInto<K, T, V>(
  stream: ReadableStream<[K, T]>,
  seed: Map<K, V>,
  reconcileFn?: Reconciler<K, T, V>
): Promise<Map<K, V>> {
  if (reconcileFn) {
    await stream.forEach(
      entry => {
        const [key, val] = entry;
        seed.set(key, reconcileFn(
          seed.get(key),
          val,
          key
        ));
      }
    );
  } else {
    await stream.forEach(
      entry => {
        const [key, val] = entry;
        seed.set(key, val as unknown as V);
      }
    );
  }

  return seed;
}

/**
 * Generate a new map from the ReadableStream of entries using an optional Reconciler.
 * 
 * @param {ReadableStream} stream The input stream.
 * @param {Reconciler} reconcileFn Function to call to resolve collisions.
 * @returns A promise of the generated map, to be returned when the ReadableStream closes.
 */
export function streamCollect<K, T>(
  iterable: ReadableStream<[K, T]>
): Promise<Map<K, T>>
export function streamCollect<K, T, V>(
  iterable: ReadableStream<[K, T]>,
  reconcileFn: Reconciler<K, T, V>
): Promise<Map<K, V>>
export function streamCollect<K, T, V>(
  stream: ReadableStream<[K, T]>,
  reconcileFn?: Reconciler<K, T, V>
) {
  return streamCollectInto(
    stream,
    new Map<K, V>(),
    reconcileFn as any
  );
}

type Option<T> = {
  isSome: true,
  value: T
} | {
  isSome: false
};

const none: Option<any> = {
  isSome: false
};

function some<V>(val: V) {
  return {
    isSome: true,
    value: val
  }
}

function foldOption<T, V>(
  opt: Option<T>,
  some: (t: T) => V,
  none: () => V
) {
  if (opt.isSome) {
    return some(opt.value);
  } else {
    return none();
  }
}

type Switchboard<K, T> = Map<K, [Promise<Option<T>>, (resolution: Option<T>) => void]>;

async function getGetOrHasPromise<K, V, W, P extends Map<K, V>>(
  {finalized}: { finalized: boolean },
  switchboard: Switchboard<K, V>,
  underlyingMap: P,
  key: K
): Promise<Option<V>> {
  if (finalized || underlyingMap.has(key)) {
    return underlyingMap.has(key) ? some(underlyingMap.get(key) as V)
      : none;
  } else if (switchboard.has(key)) {
    return getOrFail(
      switchboard,
      key
    )[0];
  } else {
    let resolver: Possible<(resolution: Option<any>) => void>;
    const newPromise = new Promise<Option<V>>(resolve => resolver = resolve);

    switchboard.set(key, [newPromise, defined(resolver, "Resolver not properly captured from Promise, this might be due to an unexpected implementation of Promises")]);

    return newPromise;
  }
}


async function queryMap<K, V, W, P extends Map<K, V>>(
  {finalized}: { finalized: boolean },
  switchboard: Switchboard<K, V>,
  underlyingMap: P,
  onSome: (v: V) => W,
  onNone: () => W,
  key: K
) {
  const ret = await getGetOrHasPromise(
    {finalized},
    switchboard,
    underlyingMap,
    key
  );

  return foldOption(
    ret,
    onSome,
    onNone
  );
}

/**
 * A Map that is in the process of being built from a Stream.
 * Supports async lookups that return Promises that resolve either immediately, if the key is already present in the Map, or eventually when the key arrives in the input Stream or the input Stream ends.
 * 
 */
export type EventualMap<K, V> = {
  /**
   * @method get Return the value that will eventually be at the key.
   */
  get: (key: K) => Promise<Possible<V>>,
  /**
   * @method get Return the value that will eventually be at the key.
   */
  has: (key: K) => Promise<boolean>,
  /**
   * @method getOrElse Return the value that will eventually be at the key, or the result of calling the argument function 
   */
  getOrElse: (key: K, substitute: (key: K) => V) => Promise<V>,
  /**
   * @method getOrVal Return the value that will eventually be at the key, or `substitute` if the key is not set before the input stream ends.
   */
  getOrVal: (key: K, substitute: V) => Promise<V>,
  /**
   * getOrFail Return the value that will eventually be at the key or throw an error if the key is not set before the input stream ends.
   */
  getOrFail: (key: K, error: (string | ((key: K) => string))) => Promise<V>,
  /**
   * @method foldingGet Return the result of calling `some` on the input value when the key is set, the result of calling `none` if the result is not set before the input stream ends.
   */
  foldingGet<W>(key: K, some: (v: V) => W, none: () => W): Promise<W>,
  /**
   * @method getNow Immediately return the value that is at the key whether the input stream has ended or not.
   */
  getNow: (key: K) => Possible<V>,
  /**
   * @method hasNow Return `true` if the key is set now, `false` otherwise.
   */
  hasNow: (key: K) => boolean,
  /**
   * @field _underlyingMap The Map that is being populated with Stream entries.
 * This must be accessed with caution as mutating operations on `_underlyingMap`, like `set` and `delete`, destroy all correctness guarantees for the other methods.
   */
  _underlyingMap: Map<K, V>,
  /**
   * @field finalMap A Promise resolving to `underlyingMap` when the input stream ends.
   */
  finalMap: Promise<Map<K, V>>
};

/**
 * {@link EventualMap} Map, but for BiMaps.
 */
export type EventualBiMap<K, V> = {
  get: (key: K) => Promise<Possible<V>>,
  has: (key: K) => Promise<boolean>,
  getOrElse: (key: K, substitute: (key: K) => V) => Promise<V>,
  getOrVal: (key: K, substitute: V) => Promise<V>,
  getOrFail: (key: K, error?: (string | ((key: K) => string))) => Promise<V>,
  foldingGet<W>(key: K, some: (v: V) => W, none: () => W): Promise<W>,
  getNow: (key: K) => Possible<V>,
  hasNow: (key: K) => boolean,
  _underlyingMap: BiMap<K, V>,
  finalMap: Promise<BiMap<K, V>>
};

/**
 * {@link EventualMap}, but for CanonMaps.
 */
export type EventualCanonMap<K, V> = {
  get: (key: K) => Promise<Possible<V>>,
  has: (key: K) => Promise<boolean>,
  getOrElse: (key: K, substitute: (key: K) => V) => Promise<V>,
  getOrVal: (key: K, substitute: V) => Promise<V>,
  getOrFail: (key: K, error: (string | ((key: K) => string))) => Promise<V>,
  foldingGet<W>(key: K, some: (v: V) => W, none: () => W): Promise<W>,
  getNow: (key: K) => Possible<V>,
  hasNow: (key: K) => boolean,
  _underlyingMap: CanonMap<K, V>,
  finalMap: Promise<CanonMap<K, V>>
};

/**
 * 
 * Initialize an EventualMap from a stream of entries. An EventualMap is a Map-like object that returns Promises which resolve as soon as possible.
 * 
 * - If a request comes in for a key that has already been loaded in from the stream, it resolves immediately with that value.
 * 
 * - If a request comes in before the corresponding entry arrives, it is added to a queue.
 * 
 * - When the entry with the request key comes in, the Promise resolves with that value.
 * 
 * - If the stream ends, and the requested key has not arrived in the stream, the Promise resolves with `undefined`.
 * 
 * @remarks
 * To ensure the correctness of early `get` calls, the eventualMap does not allow existing values to be overwritten.
 * Instead, collisions can be resolved by modifying the incoming key using the `bumper` option.
 * If the `bumper` returns `undefined`, the second entry to arrive is simply ignored.
 * 
 * @param {Stream.ReadableStream} stream The input stream to draw the entries from.
 * @param {{bumper?: Bumper, seed: Map}} opts
 * - bumper The function to call on key collisions to get a new key for the colliding entry.
 * By default, after a key arrives, subsequent entries with the same key will be discarded.
 * - seed The Map to load entries into. By default, generates a new Map.
 * 
 * @returns  A Map that is in the process of being built from a Stream.
 * 
 * @method get Return the value that will eventually be at the key.
 * @method has Return `true` if the key is eventually set, `false` if it is not set before the input stream ends.
 * @method getOrElse Return the value that will eventually be at the key, or the result of calling the argument function `substitute` if the key is not set before the input stream ends.
 * @method getOrVal Return the value that will eventually be at the key, or `substitute` if the key is not set before the input stream ends.
 * @method getOrFail Return the value that will eventually be at the key or throw an error if the key is not set before the input stream ends.
 * @method foldingGet Return the result of calling `some` on the input value when the key is set, the result of calling `none` if the result is not set before the input stream ends.
 * @method getNow Immediately return the value that is at the key whether the input stream has ended or not.
 * @method hasNow Return `true` if the key is set now, `false` otherwise.
 * @field _underlyingMap The Map that is being populated with Stream entries.
 * This must be accessed with caution as mutating operations on `_underlyingMap`, like `set` and `delete`, destroy all correctness guarantees for the other methods.
 * @field finalMap A Promise resolving to `underlyingMap` when the input stream ends.
 */
export function EventualMap<K, T>(
  stream: ReadableStream<[K, T]>,
  opts?: {
    bumper?: Bumper<K, T>,
    seed?: BiMap<K, T>
  }
): EventualBiMap<K, T>
export function EventualMap<K, T>(
  stream: ReadableStream<[K, T]>,
  opts?: {
    bumper?: Bumper<K, T>,
    seed?: CanonMap<K, T>
  }
): EventualCanonMap<K, T>
export function EventualMap<K, T>(
  stream: ReadableStream<[K, T]>,
  opts?: {
    bumper?: Bumper<K, T>,
    seed?: Map<K, T>
  }
): EventualMap<K, T>
export function EventualMap<K, T>(
  stream: ReadableStream<[K, T]>,
  {
    bumper,
    seed
  }: {
    bumper?: Bumper<K, T>,
    seed?: Map<K, T>
  } = {}
): EventualMap<K, T> {
  const _underlyingMap = seed || new Map<K, T>();

  const switchboard: Switchboard<K, T> = new Map();

  let resolveFinalMapPromise: (val: Map<K, T>) => void;
  let finalizedWrapper = {
    finalized: false
  };

  const finalMapPromise: Promise<Map<K, T>> = new Promise((resolve, _) => {
    resolveFinalMapPromise = (val) => {
      finalizedWrapper.finalized = true;
      resolve(val);
    };
  });

  stream.forEach(([key, value]) => {
    let keyToUse;
    if (_underlyingMap.has(key)) {
      if (bumper) {
        let newKey = key;
        let attempts = 0;

        do {
          attempts++;
          const innerNewKey = bumper(newKey, attempts, key, getOrFail(_underlyingMap, key), value);

          if (innerNewKey === undefined) {
            // Failed to set
            break;
          } else if (!_underlyingMap.has(innerNewKey)) {
            _underlyingMap.set(innerNewKey, value);
            break;
          } else {
            newKey = innerNewKey;
          }
        } while (!!newKey);
      } else {
        keyToUse = undefined;
      }
    } else {
      keyToUse = key;
    }

    if (!!keyToUse) {
      _underlyingMap.set(keyToUse, value);
      foldingGet(
        switchboard,
        keyToUse,
        ([_, resolver]) => resolver(some(value))
      );
    }
  }).then(
      () => {
        switchboard.forEach(
          ([_, resolver]) => resolver(none)
        );
        resolveFinalMapPromise(_underlyingMap);
      }
    );

  return {
    get: (key: K) => queryMap(
      finalizedWrapper,
      switchboard,
      _underlyingMap,
      some => some,
      () => undefined,
      key
    ),
    has: (key: K) => queryMap(
      finalizedWrapper,
      switchboard,
      _underlyingMap,
      () => true,
      () => false,
      key
    ),
    getOrElse: (key: K, substitute: (key: K) => T) => queryMap(
      finalizedWrapper,
      switchboard,
      _underlyingMap,
      (val) => val,
      () => substitute(key),
      key
    ),
    getOrVal: (key: K, substitute: T) => queryMap(
      finalizedWrapper,
      switchboard,
      _underlyingMap,
      (val) => val,
      () => substitute,
      key
    ),
    getOrFail: (key: K, error?: (string | ((key: K) => string))) => queryMap(
      finalizedWrapper,
      switchboard,
      _underlyingMap,
      (val) => val,
      () => {
        throw new Error(
          typeof error === "function"
          ? error(key)
          : typeof error === "undefined"
            ? `Map has no entry "${key}"`
            : error
        );
      },
      key
    ),
    foldingGet<W>(key: K, some: (v: T) => W, none: () => W) {
      return queryMap(
        finalizedWrapper,
        switchboard,
        _underlyingMap,
        some,
        none,
        key
      );
    },
    getNow(key: K) {
      return _underlyingMap.get(key);
    },
    hasNow(key: K) {
      return _underlyingMap.has(key);
    },
    _underlyingMap,
    finalMap: finalMapPromise
  } as EventualMap<K, T>;
}