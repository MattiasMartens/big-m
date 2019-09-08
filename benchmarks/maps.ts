import { Suite } from 'benchmark';

import { collect, count, take } from '../exports/iterable';

const suite = new Suite;

const array = collect(
  take(count(), 100000)
);
const mapFn = ((i: number) => [Math.round(Math.random() * 10), i] as [number, number]);

suite
  .add('Collect map manual', () => {
    const map = new Map();
    array.forEach(i => {
      const entry = mapFn(i);
      map.set(entry[0], entry[1]);
    });
  })
  .on('cycle', function(event: any) {
    console.log(String(event.target));
  })
  .on('complete', function(this: any) {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ 'async': true });