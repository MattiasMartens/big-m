export type Possible<T> = T | undefined;

export type ErrorBuilder<T extends any[]> = string | Error | ((...t: T) => string | Error)

export const identity = <T>(t: T) => t

export type Some<T> = { readonly _tag: 'Some', value: T }
export type None = { readonly _tag: 'None' }
export type Option<T> = None | Some<T>

export const none: None = { _tag: 'None' }
export const some = <T>(value: T) => ({ _tag: 'Some', value } as Option<T>)

export function buildError<T extends any[]>(errorBuilder: ErrorBuilder<T>, ...input: T) {
  if (typeof errorBuilder === 'string') {
    return new Error(errorBuilder)
  } else if (errorBuilder instanceof Error) {
    return errorBuilder
  } else {
    const yielded = errorBuilder(...input)

    if (typeof yielded === 'string') {
      return new Error(yielded)
    } else {
      return yielded
    }
  }
}

export function defined<T>(t: Possible<T>, errorBuilder: ErrorBuilder<[]> = "Value was undefined but asserted to be defined."): T {
  if (t === undefined) {
    throw buildError(errorBuilder);
  } else {
    return t;
  }
}

export function isDefined<T>(t: Possible<T>) {
  return t !== undefined;
}

type MaybeNullOrUndefined<T> = T | null | undefined;

export function notNullOrUndefined<T>(t: MaybeNullOrUndefined<T>, errorBuilder: ErrorBuilder<[T]> = t => `Value was unexpectedly ${t}.`): T {
  if (t === undefined || t === null) {
    throw buildError(errorBuilder, t);
  } else {
    return t;
  }
}

// Thanks to Gerrit0 from Stack Overflow https://stackoverflow.com/a/49889856/5063469
export type Awaited<T> = T extends Promise<infer U> ? U : T;

export function tuple<T0, T1, T2, T3, T4, T5, T6, T7>(arr: [T0, T1, T2, T3, T4, T5, T6, T7]): [T0, T1, T2, T3, T4, T5, T6, T7]
export function tuple<T0, T1, T2, T3, T4, T5, T6>(arr: [T0, T1, T2, T3, T4, T5, T6]): [T0, T1, T2, T3, T4, T5, T6]
export function tuple<T0, T1, T2, T3, T4, T5>(arr: [T0, T1, T2, T3, T4, T5]): [T0, T1, T2, T3, T4, T5]
export function tuple<T0, T1, T2, T3, T4>(arr: [T0, T1, T2, T3, T4]): [T0, T1, T2, T3, T4]
export function tuple<T0, T1, T2, T3>(arr: [T0, T1, T2, T3]): [T0, T1, T2, T3]
export function tuple<T0, T1, T2>(arr: [T0, T1, T2]): [T0, T1, T2]
export function tuple<T0, T1>(arr: [T0, T1]): [T0, T1]
export function tuple<T0>(arr: [T0]): [T0]
export function tuple(arr: any) {
  return arr;
}