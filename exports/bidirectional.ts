import { collect, reversedMap } from "../exports/maps";

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
          return (key: T) => target.has(key) ? biMap.delete(target.get(key)) : false;
        } else {
          return target[p];
        }
      }
    }
  ) as BiMap<T, K>;
}

export class BiMap<K, T> extends Map<K, T> {
  _reverse: Map<T, K>
  _reversedProxy: BiMap<T, K>;

  get reversed() {
    return this._reversedProxy || (this._reversedProxy = getReversedBiMap(this));
  }

  constructor(forward?: Iterable<[K, T]>, reverse?: Iterable<[T, K]>) {
    super(forward);
    
    this._reverse = reverse
      ? new Map(reverse)
      : collect(reversedMap(forward));
  }

  set(key: K, val: T) {
    if (this._reverse.has(val)) {
      this.delete(this._reverse.get(val));
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
      const valueAt = super.get(key);
      this._reverse.delete(valueAt);
    }

    return super.delete(key);
  }

  // TODO implement on reversed map
  getKey(val: T) {
    return this._reverse.get(val);
  }

  deleteVal(val: T) {
    return this.hasVal(val) ? this.delete(this.getKey(val)) : false;
  }

  hasVal(val: T) {
    return this._reverse.has(val);
  }
}