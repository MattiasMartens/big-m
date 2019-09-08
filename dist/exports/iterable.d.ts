export declare function map<T, V>(arr: Iterable<T>, fn: (t: T) => V): IterableIterator<V>;
export declare function forEach<T>(arr: Iterable<T>, fn: (t: T) => void): void;
export declare function flatMap<T, V>(arr: Iterable<T>, fn: (t: T) => Iterable<V>): IterableIterator<V>;
export declare function filter<T>(arr: Iterable<T>, fn: (t: T) => boolean): IterableIterator<T>;
export declare function entries<V>(obj: {
    [key: string]: V;
}): IterableIterator<[string, V]>;
export declare function count(start?: number, step?: number): IterableIterator<number>;
export declare function take<T>(arr: Iterable<T>, num?: number): IterableIterator<T>;
export declare function slice<T>(arr: Iterable<T>, start?: number, end?: number): IterableIterator<T>;
export declare function collect<T>(arr: Iterable<T>): T[];
export declare function collectInto<T>(arr: Iterable<T>, into: T[]): T[];
