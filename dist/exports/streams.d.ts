import { ReadableStream } from "ts-stream";
import { Reconciler } from "./maps";
import { Possible } from "types/utils";
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
export declare function eventualMap<K, T, V>(stream: ReadableStream<[K, T]>, { reconciler, seed }?: {
    reconciler?: Reconciler<K, T, V>;
    seed?: Map<K, V>;
}): EventualMap<K, unknown extends V ? T : V>;
export {};
