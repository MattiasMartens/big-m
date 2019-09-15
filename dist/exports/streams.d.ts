import { ReadableStream } from "ts-stream";
import { Reconciler, BumperFn as Bumper } from "./maps";
import { Possible } from "types/utils";
import { BiMap } from "exports";
import { CanonMap } from "./canon";
/**
 * Insert the entries of a ReadableStream into `seed` with an optional Reconciler.
 *
 * @param {ReadableStream} stream The input stream.
 * @param {Map} seed The Map to update with the contents of `stream`.
 * @returns A promise of the updated map, to be returned when the ReadableStream closes.
 */
export declare function streamCollectInto<K, T>(stream: ReadableStream<[K, T]>, seed: Map<K, T>): Promise<Map<K, T>>;
/**
 * Insert the entries of a ReadableStream into `seed` with an optional Reconciler.
 *
 * @param {ReadableStream} stream The input stream.
 * @param {Map} seed The Map to update with the contents of `stream`.
 * @param {Reconciler} reconcileFn Function to call to resolve collisions.
 * @returns A promise of the updated map, to be returned when the ReadableStream closes.
 */
export declare function streamCollectInto<K, T, V>(stream: ReadableStream<[K, T]>, seed: Map<K, V>, reconcileFn: Reconciler<K, T, V>): Promise<Map<K, V>>;
/**
 * Generate a new map from the ReadableStream of entries using an optional Reconciler.
 *
 * @param {ReadableStream} stream The input stream.
 * @returns A promise of the generated map, to be returned when the ReadableStream closes.
 */
export declare function streamCollect<K, T>(iterable: ReadableStream<[K, T]>): Promise<Map<K, T>>;
/**
 * Generate a new map from the ReadableStream of entries using an optional Reconciler.
 *
 * @param {ReadableStream} stream The input stream.
 * @returns A promise of the generated map, to be returned when the ReadableStream closes.
 */
export declare function streamCollect<K, T, V>(iterable: ReadableStream<[K, T]>, reconcileFn: Reconciler<K, T, V>): Promise<Map<K, V>>;
/**
 * A Map that is in the process of being built from a Stream.
 * Supports async lookups that return Promises that resolve either immediately, if the key is already present in the Map, or eventually when the key arrives in the input Stream or the input Stream ends.
 *
 */
export declare type EventualMap<K, V> = {
    /**
     * @method get Return the value that will eventually be at the key.
     */
    get: (key: K) => Promise<Possible<V>>;
    /**
     * @method get Return the value that will eventually be at the key.
     */
    has: (key: K) => Promise<boolean>;
    /**
     * @method getOrElse Return the value that will eventually be at the key, or the result of calling the argument function
     */
    getOrElse: (key: K, substitute: (key: K) => V) => Promise<V>;
    /**
     * @method getOrVal Return the value that will eventually be at the key, or `substitute` if the key is not set before the input stream ends.
     */
    getOrVal: (key: K, substitute: V) => Promise<V>;
    /**
     * getOrFail Return the value that will eventually be at the key or throw an error if the key is not set before the input stream ends.
     */
    getOrFail: (key: K, error: (string | ((key: K) => string))) => Promise<V>;
    /**
     * @method foldingGet Return the result of calling `some` on the input value when the key is set, the result of calling `none` if the result is not set before the input stream ends.
     */
    foldingGet<W>(key: K, some: (v: V) => W, none: () => W): Promise<W>;
    /**
     * @method getNow Immediately return the value that is at the key whether the input stream has ended or not.
     */
    getNow: (key: K) => Possible<V>;
    /**
     * @method hasNow Return `true` if the key is set now, `false` otherwise.
     */
    hasNow: (key: K) => boolean;
    /**
     * @field _underlyingMap The Map that is being populated with Stream entries.
   * This must be accessed with caution as mutating operations on `_underlyingMap`, like `set` and `delete`, destroy all correctness guarantees for the other methods.
     */
    _underlyingMap: Map<K, V>;
    /**
     * @field finalMap A Promise resolving to `underlyingMap` when the input stream ends.
     */
    finalMap: Promise<Map<K, V>>;
};
/**
 * {@link EventualMap} Map, but for BiMaps.
 */
export declare type EventualBiMap<K, V> = {
    get: (key: K) => Promise<Possible<V>>;
    has: (key: K) => Promise<boolean>;
    getOrElse: (key: K, substitute: (key: K) => V) => Promise<V>;
    getOrVal: (key: K, substitute: V) => Promise<V>;
    getOrFail: (key: K, error?: (string | ((key: K) => string))) => Promise<V>;
    foldingGet<W>(key: K, some: (v: V) => W, none: () => W): Promise<W>;
    getNow: (key: K) => Possible<V>;
    hasNow: (key: K) => boolean;
    _underlyingMap: BiMap<K, V>;
    finalMap: Promise<BiMap<K, V>>;
};
/**
 * {@link EventualMap}, but for CanonMaps.
 */
export declare type EventualCanonMap<K, V> = {
    get: (key: K) => Promise<Possible<V>>;
    has: (key: K) => Promise<boolean>;
    getOrElse: (key: K, substitute: (key: K) => V) => Promise<V>;
    getOrVal: (key: K, substitute: V) => Promise<V>;
    getOrFail: (key: K, error: (string | ((key: K) => string))) => Promise<V>;
    foldingGet<W>(key: K, some: (v: V) => W, none: () => W): Promise<W>;
    getNow: (key: K) => Possible<V>;
    hasNow: (key: K) => boolean;
    _underlyingMap: CanonMap<K, V>;
    finalMap: Promise<CanonMap<K, V>>;
};
/**
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
 * @param {object} opts
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
export declare function EventualMap<K, T>(stream: ReadableStream<[K, T]>, opts?: {
    bumper?: Bumper<K, T>;
    seed?: BiMap<K, T>;
}): EventualBiMap<K, T>;
/**
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
 * @param {object} opts
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
export declare function EventualMap<K, T>(stream: ReadableStream<[K, T]>, opts?: {
    bumper?: Bumper<K, T>;
    seed?: CanonMap<K, T>;
}): EventualCanonMap<K, T>;
/**
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
 * @param {object} opts
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
export declare function EventualMap<K, T>(stream: ReadableStream<[K, T]>, opts?: {
    bumper?: Bumper<K, T>;
    seed?: Map<K, T>;
}): EventualMap<K, T>;
