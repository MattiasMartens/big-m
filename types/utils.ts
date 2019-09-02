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

export function tuple<T0, T1, T2, T3, T4, T5, T6, T7>(t0: T0, t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7): [T0, T1, T2, T3, T4, T5, T6, T7]
export function tuple<T0, T1, T2, T3, T4, T5, T6>(t0: T0, t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6): [T0, T1, T2, T3, T4, T5, T6]
export function tuple<T0, T1, T2, T3, T4, T5>(t0: T0, t1: T1, t2: T2, t3: T3, t4: T4, t5: T5): [T0, T1, T2, T3, T4, T5]
export function tuple<T0, T1, T2, T3, T4>(t0: T0, t1: T1, t2: T2, t3: T3, t4: T4): [T0, T1, T2, T3, T4]
export function tuple<T0, T1, T2, T3>(t0: T0, t1: T1, t2: T2, t3: T3): [T0, T1, T2, T3]
export function tuple<T0, T1, T2>(t0: T0, t1: T1, t2: T2): [T0, T1, T2]
export function tuple<T0, T1>(t0: T0, t1: T1): [T0, T1]
export function tuple<T0>(t0: T0): [T0]
export function tuple(): []
export function tuple() {
  return Array.from(arguments) as any;
}