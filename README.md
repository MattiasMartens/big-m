# Big-M

Big-M is a library of utility functions for efficiently working with Maps. 
That's Maps with a big "M", not `array.map` or "directions to the nearest Thai place" kind of map.

Specifically, Big-M enables composing Maps, decomposing them, recomposing them, and chaining operations without having to loop over the data structure more than once.
It also includes some Map sub-classes for special use cases: EventualMap, BiMap, and CanonizedMap.

Complete docs available at <https://mattiasmartens.github.io/big-m/>

# maps.ts

Pure function library.
Most functions in this library can be used not only on Maps, but on anything that implements the Iterable interface.
This includes arrays of key-value tuples and Iterables created by libraries like [wu.js](https://fitzgen.github.io/wu.js/) and [lazy.js](http://danieltao.com/lazy.js/).

To allow efficient composition of operations, most functions return an Iterable of entries instead of an actual Map.
To get to a Map from one of these Iterables, just call `collectMap` on it or use the `Map` constructor:

```
const myIterable = selectMap(myMap, a => isWorthKeeping(a));

// this works
const myNewMap = mapCollect(myIterable);

// this works, too
const myNewMap2 = new Map(myIterable);
```

See the [docs](https://mattiasmartens.github.io/big-m/) for detailed descriptions of all the functions and what they do.

# streams.ts

## EventualMap

The main use case for EventualMap is when you are loading data from two remote sources and joining them together - say you're getting a user IDs from one source and a user metadata table from another - and you want to front-load as much of the work as possible, continuing processing on each user ID the moment it arrives in your system.

With EventualMap, you can perform async lookups on a Stream (note that this is from [ts-stream](https://github.com/poelstra/ts-stream), not the Node implementation) that return as soon as the value arrives.
This simplifies the work of combining multiple incoming data streams while minimizing unnecessary awaiting.

## StreamCollectInto

For the more straightforward case where you have a Stream of key-value pairs and you want it to be a Map, but don't care about it until it's complete, there's also `streamCollectInto`.
This simply returns a Promise of the completed Map.

# bidirectional.ts

## BiMap

A subclass of Map which, for every key-value pair, maintains a corresponding value-key pair in another Map.
Lookups can then be performed in either direction, from a key to a value or from a value to a key.

BiMap also exposes a reversed version of itself with `.reverse`, which behaves exactly like the original except that the key set and value set are flipped.
The map can be reversed and re-reversed indefinitely without the data structure being rebuilt.

# canon.ts

## CanonMap

Normally Maps don't provide an effective way of doing things like this:

```
const myMap = new Map();
myMap.set(
  ["Farooq", "867-5309"],
  36.59
);

// ???
myMap.get(
  ["Farooq", "867-5309"]
) === undefined;

// Oh right, it's compare-by-reference and those two arrays were declared separately so they can't be considered as the same key.

```

But with CanonMap, the above actually works:

```
const myMap = new CanonMap();
myMap.set(
  ["Farooq", "867-5309"],
  36.59
);

myMap.get(
  ["Farooq", "867-5309"]
) === 36.59;

// Yay!

```

CanonMap behaves exactly *as if* it were mapping complex objects to values by the values in the objects, instead of their references.
What it's actually doing is mapping these complex values to primitives such as strings, using a function called a canonizer.
The default canonizer is pretty effective at recognizing when two values ought to be considered the same:
```
const myCanonMap = new CanonMap();

const indexable = (val1, val2) => {
  myCanonMap.set(val1, "TEST");
  const indexable = myCanonMap.get(val2) === "TEST";
  myCanonmMp.delete(val1);
  return indexable;
}

indexable(
  ["Farooq", "867-5309"],
  ["Farooq", "867-5309"]
);

indexable(
  {
    a: 1,
    b: [9, 10]
  },
  {
    a: 1,
    b: [9, 10]
  }
);

!indexable(
  ["1"],
  [1]
);
```

But it only looks two levels deep into deeply nested objects.
However, users can have complete control over how the canonizer works using the canonizer argument, allowing them to adapt the class to their own particular use case.

# Chaining

Chaining operations together can be done readably with <https://github.com/gcanti/fp-ts>'s pipe function:

```
pipe(
  makeEntries(fibonacci, fib => [fib, romanNumerals(fib)]),
  x => selectMap(x, fib => fib % 2 === 1),
  x => mapKeys(fib => fib % 7),
  x => mapCollectBumping(fib => fib * 2)
);
```

It would be nicer to call functions directly on their first argument, i.e. `map1.mapValues()`, but this is not implemented yet - see the Contributing section below.

## [Contributing](https://github.com/MattiasMartens/big-m)

Source code is hosted at <https://github.com/MattiasMartens/big-m>.

To set up locally (assuming you have Yarn installed and you've forked the repo):
```
yarn install

# To ensure tests pass and to see coverage report
yarn test

# To see performance benchmarks
yarn benchmark
```

To submit changes as a PR, before committing:
```
yarn test
yarn compile
yarn docs
```

### Monkey-Patching

Currently the utility functions must be called as pure functions:

```
mapCollectInto(myListOfEntries, myNewMap);
```

It would be nicer to call them like this:
```
myListOfEntries.mapCollectInto(myNewMap)
```

But modifying the existing native classes is not recommended.
Instead the plan is to patch them on using Symbols, which a user can import:

```
import { mapCollectInto } from "cartographer/monkey";

myListOfEntries[mapCollectInto](myNewMap);
```

This is not implemented yet, however.
TypeScript makes it pretty laborious to monkey-patch a large number of symbols onto various prototypes and communicate through declarations that you've done so.
I'm thinking of writing a macro to generate the code that does this.
PRs welcome.