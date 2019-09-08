export declare class BiMap<K, T> extends Map<K, T> {
    _reverse: Map<T, K>;
    _reversedProxy: BiMap<T, K>;
    readonly reversed: BiMap<T, K>;
    constructor(forward?: Iterable<[K, T]>, reverse?: Iterable<[T, K]>);
    set(key: K, val: T): this;
    clear(): void;
    delete(key: K): boolean;
    getKey(val: T): K | undefined;
    deleteVal(val: T): boolean;
    hasVal(val: T): boolean;
}
