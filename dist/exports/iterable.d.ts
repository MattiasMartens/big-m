export declare function map<T, V>(arr: Iterable<T>, fn: (t: T) => V): Generator<V, void, unknown>;
export declare function forEach<T>(arr: Iterable<T>, fn: (t: T) => void): void;
export declare function flatMap<T, V>(arr: Iterable<T>, fn: (t: T) => Iterable<V>): Generator<V, void, undefined>;
export declare function filter<T>(arr: Iterable<T>, fn: (t: T) => boolean): Generator<T, void, unknown>;
export declare function entries<V>(obj: {
    [key: string]: V;
}): Generator<[string, V], void, unknown>;
export declare function series(start?: number, step?: number): Generator<number, void, unknown>;
export declare function take<T>(arr: Iterable<T>, num?: number): Generator<T, void, unknown>;
export declare function slice<T>(arr: Iterable<T>, start?: number, end?: number): Generator<T, void, unknown>;
export declare function collect<T>(arr: Iterable<T>): T[];
export declare function collectInto<T>(arr: Iterable<T>, into: T[]): T[];
