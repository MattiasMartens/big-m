import { collect, reverseMap, foldingGet } from "../exports/maps";
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
          return biMap;
        } else if (p === "set") {
          return (key: T, val: K) => biMap.set(val, key)
        } else if (p === "clear") {
          return () => biMap.clear()
        } else if (p === "delete") {
          return (key: T) => foldingGet(
            target,
            key,
            (val) => biMap.delete(val)
          );
        } else if (p === "hasVal") {
          return (val: K) => biMap.has(val);
        } else if (p === "deleteVal") {
          return (val: K) => biMap.delete(val);
        } else if (p === "getKey") {
          return (val: K) => biMap.get(val);
        } else {
          const field = (target as any)[p];

          if (typeof field === "function") {
            return field.bind(target);
          } else {
            return field;
          }
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
    super();

    if (forward) {
      for (let entry of forward) {
        const [key, value] = entry;
        super.set(key, value);
      }
    }

    this._reverse = reverse
      ? new Map(reverse)
      : collect(reverseMap(forward || []));
  }

  set(key: K, val: T) {
    if (this._reverse.has(val)) {
      this.delete(this._reverse.get(val) as K);
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
      const valueAt = super.get(key) as T;
      this._reverse.delete(valueAt);
    }

    return super.delete(key);
  }

  getKey(val: T) {
    return this._reverse.get(val);
  }

  deleteVal(val: T) {
    return foldingGet(
      this._reverse,
      val,
      key => this.delete(key),
      () => false
    );
  }

  hasVal(val: T) {
    return this._reverse.has(val);
  }
}