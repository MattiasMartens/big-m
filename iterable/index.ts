import { tuple } from "../types/utils";

export function* map<T, V>(arr: Iterable<T>, fn: (t: T) => V) {
  for (let val of arr) {
    yield fn(val);
  }
}

export function* combine<T>(...arrs: Iterable<T>[]) {
  for (let arr of arrs) {
    yield* arr;
  }
}

export function forEach<T>(arr: Iterable<T>, fn: (t: T) => void) {
  for (let val of arr) {
    fn(val);
  }
}

export function* flatMap<T, V>(arr: Iterable<T>, fn: (t: T) => Iterable<V>) {
  for (let val of arr) {
    yield* fn(val);
  }
}

export function* filter<T>(arr: Iterable<T>, fn: (t: T) => boolean) {
  for (let val of arr) {
    if (fn(val)) {
      yield val;
    }
  }
}

export function* entries<V>(obj: {[key: string]: V}) {
  for (let key in obj) {
    yield tuple([key, obj[key]]);
  }
}

export function* series(start = 0, step = 1) {
  let i = start;
  while (true) {
    yield i;
    i += step;
  }
}

export function* take<T>(arr: Iterable<T>, num = 1) {
  let i = 0;
  for (let val of arr) {
    if (i++ < num) {
      yield val;
    } else {
      return;
    }
  }
}

export function* repeat<T>(arr: Iterable<T>) {
  while (true) {
    yield* arr;
  }
}

export function* slice<T>(arr: Iterable<T>, start = 0, end = Infinity) {
  let i = 0;
  for (let val of arr) {
    if (i >= start && i < end) {
      i++;
      yield val;
    } else {
      return;
    }
  }
}

export function collect<T>(arr: Iterable<T>) {
  return collectInto(arr, []);
}

export function collectInto<T>(arr: Iterable<T>, into: T[]) {
  for (let val of arr) {
    into.push(val);
  }

  return into;
}