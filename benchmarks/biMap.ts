import { Suite } from 'benchmark';
import { BiMap } from 'exports';
import { pipe } from 'fp-ts/lib/pipeable';

import { collect, map, series, take } from '../iterable';

const mapFn = ((i: number) => [Math.round(Math.random() * 10), i] as [number, number]);

const array = pipe(
  series(),
  a => take(a, 100000),
  a => map(a, v => mapFn(v)),
  collect
);

const map1 = collect(array);
const biMap = new BiMap(map1);

const suite = new Suite;
suite
  .add('New BiMap', () => {
    new BiMap(biMap);
  })
  .add('New BiMap manual', () => {
    new BiMap(map1);
  })
  .on('cycle', function(event: any) {
    console.log(String(event.target));
  })
  .on('complete', function(this: any) {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ 'async': false });