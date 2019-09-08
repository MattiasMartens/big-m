export type Possible<T> = T | undefined;

export function defined<T>(t: Possible<T>, errorMessage?: string): T {
  if (t === undefined) {
    throw new Error(errorMessage || "Value was undefined but asserted to be defined.");
  } else {
    return t;
  }
}

export function isDefined<T>(t: Possible<T>) {
  return t !== undefined;
}

type MaybeNullOrUndefined<T> = T | null | undefined;

export function notNullOrUndefined<T>(t: MaybeNullOrUndefined<T>, errorMessage?: string): T {
  if (t === undefined || t === null) {
    throw new Error(errorMessage || "Value was null or undefined.");
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