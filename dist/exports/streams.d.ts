import { ReadableStream } from "ts-stream";
import { Reconciler } from "./maps";
import { Possible } from "types/utils";
import { BiMap } from "exports";
/**
 * Inserts the entries in the iterable into
 *
 * @returns The updated Map.
 */
export declare function streamCollectInto<K, T>(iterable: ReadableStream<[K, T]>, seed: Map<K, T>): Promise<Map<K, T>>;
export declare function streamCollectInto<K, T, V>(iterable: ReadableStream<[K, T]>, seed: Map<K, V>, reconcileFn: Reconciler<K, T, V>): Promise<Map<K, V>>;
export declare function streamCollect<K, T>(iterable: ReadableStream<[K, T]>): Promise<Map<K, T>>;
export declare function streamCollect<K, T, V>(iterable: ReadableStream<[K, T]>, reconcileFn: Reconciler<K, T, V>): Promise<Map<K, V>>;
declare type EventualMap<K, V> = {
    get: (key: K) => Promise<Possible<V>>;
    has: (key: K) => Promise<boolean>;
    getOrElse: (key: K, substitute: (key: K) => V) => Promise<V>;
    getOrVal: (key: K, substitute: V) => Promise<V>;
    getOrFail: (key: K, error: (string | ((key: K) => string))) => Promise<V>;
    foldingGet<W>(key: K, some: (v: V) => W, none: () => W): Promise<W>;
    getNow: (key: K) => Possible<V>;
    hasNow: (key: K) => boolean;
    underlyingMap: Map<K, V>;
    finalMap: Promise<Map<K, V>>;
};
declare type EventualBiMap<K, V> = {
    get: (key: K) => Promise<Possible<V>>;
    has: (key: K) => Promise<boolean>;
    getOrElse: (key: K, substitute: (key: K) => V) => Promise<V>;
    getOrVal: (key: K, substitute: V) => Promise<V>;
    getOrFail: (key: K, error: (string | ((key: K) => string))) => Promise<V>;
    foldingGet<W>(key: K, some: (v: V) => W, none: () => W): Promise<W>;
    getNow: (key: K) => Possible<V>;
    hasNow: (key: K) => boolean;
    underlyingMap: BiMap<K, V>;
    finalMap: Promise<BiMap<K, V>>;
};
export declare function eventualMap<K, T, V>(stream: ReadableStream<[K, T]>, opts: {
    reconciler?: Reconciler<K, T, V>;
    seed: BiMap<K, V>;
}): EventualBiMap<K, V>;
export declare function eventualMap<K, T, V>(stream: ReadableStream<[K, T]>, opts?: {
    reconciler?: Reconciler<K, T, V>;
    seed?: Map<K, V>;
}): EventualMap<K, unknown extends V ? T : V>;
export {};
