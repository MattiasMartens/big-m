import { collect, reversedMap } from "../exports/maps";
import { defined } from "../types/utils";

function getReversedBiMap<K, T>(biMap: BiMap<K, T>): BiMap<T, K> {
  return new Proxy(
    biMap._reverse,
    {
      get(
        target,
        p
      ) {
        if (p === "reversed") {
          return () => biMap;
        } else if (p === "set") {
          return (key: T, val: K) => biMap.set(val, key)
        } else if (p === "clear") {
          return () => biMap.clear()
        } else if (p === "delete") {
          return (key: T) => target.has(key) ? biMap.delete(defined(target.get(key))) : false;
        } else {
          // @ts-ignore
          return target[p];
        }
      }
    }
  ) as BiMap<T, K>;
}

export class BiMap<K, T> extends Map<K, T> {
  _reverse: Map<T, K>
  _reversedProxy: BiMap<T, K>;

  get reversed(): BiMap<T, K> {
    return this._reversedProxy || (this._reversedProxy = getReversedBiMap(this));
  }

  constructor(forward?: Iterable<[K, T]>, reverse?: Iterable<[T, K]>) {
    // @ts-ignore
    super(forward);
    

    this._reverse = reverse
      ? new Map(reverse)
      : collect(reversedMap(forward || []));
  }

  set(key: K, val: T) {
    if (this._reverse.has(val)) {
      this.delete(defined(this._reverse.get(val)));
    }

    super.set(key, val);
    this._reverse.set(val, key);
    return this;
  }

  clear() {
    super.clear();
    this._reverse.clear();
  }

  delete(key: K) {
    if (super.has(key)) {
      const valueAt = defined(super.get(key));
      this._reverse.delete(valueAt);
    }

    return super.delete(key);
  }

  // TODO implement on reversed map
  getKey(val: T) {
    return this._reverse.get(val);
  }

  deleteVal(val: T) {
    return this.hasVal(val) ? this.delete(defined(this.getKey(val))) : false;
  }

  hasVal(val: T) {
    return this._reverse.has(val);
  }
}