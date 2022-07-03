export declare type Possible<T> = T | undefined;
export declare type ErrorBuilder<T extends any[]> = string | Error | ((...t: T) => string | Error);
export declare const identity: <T>(t: T) => T;
export declare type Some<T> = {
    readonly _tag: 'Some';
    value: T;
};
export declare type None = {
    readonly _tag: 'None';
};
export declare type Option<T> = None | Some<T>;
export declare const none: None;
export declare const some: <T>(value: T) => Option<T>;
export declare function buildError<T extends any[]>(errorBuilder: ErrorBuilder<T>, ...input: T): Error;
export declare function defined<T>(t: Possible<T>, errorBuilder?: ErrorBuilder<[]>): T;
export declare function isDefined<T>(t: Possible<T>): boolean;
declare type MaybeNullOrUndefined<T> = T | null | undefined;
export declare function notNullOrUndefined<T>(t: MaybeNullOrUndefined<T>, errorBuilder?: ErrorBuilder<[T]>): T;
export declare type Awaited<T> = T extends Promise<infer U> ? U : T;
export declare function tuple<T0, T1, T2, T3, T4, T5, T6, T7>(arr: [T0, T1, T2, T3, T4, T5, T6, T7]): [T0, T1, T2, T3, T4, T5, T6, T7];
export declare function tuple<T0, T1, T2, T3, T4, T5, T6>(arr: [T0, T1, T2, T3, T4, T5, T6]): [T0, T1, T2, T3, T4, T5, T6];
export declare function tuple<T0, T1, T2, T3, T4, T5>(arr: [T0, T1, T2, T3, T4, T5]): [T0, T1, T2, T3, T4, T5];
export declare function tuple<T0, T1, T2, T3, T4>(arr: [T0, T1, T2, T3, T4]): [T0, T1, T2, T3, T4];
export declare function tuple<T0, T1, T2, T3>(arr: [T0, T1, T2, T3]): [T0, T1, T2, T3];
export declare function tuple<T0, T1, T2>(arr: [T0, T1, T2]): [T0, T1, T2];
export declare function tuple<T0, T1>(arr: [T0, T1]): [T0, T1];
export declare function tuple<T0>(arr: [T0]): [T0];
export {};
