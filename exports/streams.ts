import { ReadableStream } from "ts-stream";
import { Reconciler } from "./maps";
import { defined, Possible } from "types/utils";
import { BiMap } from "exports";

type Option<T> = {
  isSome: true,
  value: T
} | {
  isSome: false
};

const none: Option<any> = {
  isSome: false
};

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

async function queryMapper<K, V, W, P extends Map<K, V>>(
  {finalized}: { finalized: boolean },
  switchboard: Map<K, ((opt: Option<V>) => void)[]>,
  underlyingMap: P,
  some: (v: V) => W,
  none: () => W,
  key: K
) {
  if (finalized || underlyingMap.has(key)) {
    return underlyingMap.has(key) ? some(underlyingMap.get(key) as V)
      : none();
  } else {
    const resolvers = switchboard.get(key) || [];

    const promise = new Promise(resolve => resolvers.push((opt: Option<V>) => resolve(
      foldOption(
        opt,
        some,
        none
      )
    )));

    switchboard.set(key, resolvers);

    return promise as Promise<Possible<W>>;
  }
}

type EventualMap<K, V> = {
  get: (key: K) => Promise<Possible<V>>,
  has: (key: K) => Promise<boolean>,
  getOrElse: (key: K, substitute: (key: K) => V) => Promise<V>,
  getOrVal: (key: K, substitute: V) => Promise<V>,
  getOrFail: (key: K, error: (string | ((key: K) => string))) => Promise<V>,
  foldingGet<W>(key: K, some: (v: V) => W, none: () => W): Promise<W>,
  getNow: (key: K) => Possible<V>,
  hasNow: (key: K) => boolean,
  underlyingMap: Map<K, V>,
  finalMap: Promise<Map<K, V>>
};

type EventualBiMap<K, V> = {
  get: (key: K) => Promise<Possible<V>>,
  has: (key: K) => Promise<boolean>,
  getOrElse: (key: K, substitute: (key: K) => V) => Promise<V>,
  getOrVal: (key: K, substitute: V) => Promise<V>,
  getOrFail: (key: K, error: (string | ((key: K) => string))) => Promise<V>,
  foldingGet<W>(key: K, some: (v: V) => W, none: () => W): Promise<W>,
  getNow: (key: K) => Possible<V>,
  hasNow: (key: K) => boolean,
  underlyingMap: BiMap<K, V>,
  finalMap: Promise<BiMap<K, V>>
};

export function eventualMap<K, T, V>(
  stream: ReadableStream<[K, T]>,
  opts: {
    reconciler?: Reconciler<K, T, V>,
    seed: BiMap<K, V>
  }
): EventualBiMap<K, V>
export function eventualMap<K, T, V>(
  stream: ReadableStream<[K, T]>,
  opts?: {
    reconciler?: Reconciler<K, T, V>,
    seed?: Map<K, V>
  }
): EventualMap<K, unknown extends V ? T : V>
export function eventualMap<K, T, V>(
  stream: ReadableStream<[K, T]>,
  {
    reconciler,
    seed
  }: {
    reconciler?: Reconciler<K, T, V>,
    seed?: Map<K, V>
  } = {}
): EventualMap<K, unknown extends V ? T : V> {
  const underlyingMap = seed || new Map<K, V>();

  const switchboard = new Map<K, ((opt: Option<V>) => void)[]>();

  let resolveFinalMapPromise: (val: Map<K, V>) => void;
  let finalizedWrapper = {
    finalized: false
  };

  const finalMapPromise: Promise<Map<K, V>> = new Promise((resolve, _) => {
    resolveFinalMapPromise = (val) => {
      finalizedWrapper.finalized = true;
      resolve(val);
    };
  });

  stream.forEach(([key, value]) => {
    const newValue = reconciler
    ? reconciler(
      underlyingMap.get(key) as Possible<V>,
      value,
      key
    )
    : underlyingMap.has(key)
      ? underlyingMap.get(key) as V
      : value;

    underlyingMap.set(key, newValue as V);
    if (switchboard.has(key)) {
      defined(switchboard.get(key)).map(resolver => resolver({
        isSome: true,
        value: newValue as V
      }));
    }
  }).then(
      () => {
        switchboard.forEach(
          (resolvers) => {
            resolvers.map(
              resolver => resolver(none)
            )
          }
        );
        resolveFinalMapPromise(underlyingMap);
      }
    );

  return {
    get: (key: K) => queryMapper(
      finalizedWrapper,
      switchboard,
      underlyingMap,
      some => some,
      () => undefined,
      key
    ),
    has: (key: K) => queryMapper(
      finalizedWrapper,
      switchboard,
      underlyingMap,
      () => true,
      () => false,
      key
    ),
    getOrElse: (key: K, substitute: (key: K) => V) => queryMapper(
      finalizedWrapper,
      switchboard,
      underlyingMap,
      (val) => val,
      () => substitute(key),
      key
    ),
    getOrVal: (key: K, substitute: V) => queryMapper(
      finalizedWrapper,
      switchboard,
      underlyingMap,
      (val) => val,
      () => substitute,
      key
    ),
    getOrFail: (key: K, error: (string | ((key: K) => string))) => queryMapper(
      finalizedWrapper,
      switchboard,
      underlyingMap,
      (val) => val,
      () => {
        throw new Error(
          typeof error === "function"
          ? error(key)
          : typeof error === "undefined"
            ? `Map has no entry ${key}`
            : error
        );
      },
      key
    ),
    foldingGet<W>(key: K, some: (v: V) => W, none: () => W) {
      return queryMapper(
        finalizedWrapper,
        switchboard,
        underlyingMap,
        some,
        none,
        key
      );
    },
    getNow(key: K) {
      return underlyingMap.get(key);
    },
    hasNow(key: K) {
      return underlyingMap.has(key);
    },
    underlyingMap,
    finalMap: finalMapPromise
  } as EventualMap<K, unknown extends V ? T : V>;
}