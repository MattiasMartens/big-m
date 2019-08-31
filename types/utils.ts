export type Possible<T> = T | undefined;

export function defined<T>(t: Possible<T>, errorMessage?: string): T {
  if (t === undefined) {
    throw new Error(errorMessage || "Value was undefined but asserted to be defined.");
  } else {
    return t;
  }
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

export function tuple<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}

const x = tuple("A", 1);