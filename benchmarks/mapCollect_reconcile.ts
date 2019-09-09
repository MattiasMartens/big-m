import { Suite } from 'benchmark';
import { pipe } from 'fp-ts/lib/pipeable';

import { mapCollect, reconcileAppend } from '../exports/maps';
import { collect, series, take, map } from '../iterable';

const suite = new Suite;

const mapFn = ((i: number) => [Math.round(Math.random() * 10), i] as [number, number]);

const array = pipe(
  series(),
  a => take(a, 100000),
  a => map(a, v => mapFn(v)),
  collect
);

suite
  .add('Collect map reconciling manual', () => {
    const map = new Map();
    array.forEach(entry => {
      map.has(entry[0])
        ? (map.get(entry[0]) as number[]).push(entry[1])
        : map.set(entry[0], [entry[1]]);
    });
  })
  .add('Collect map reconcile', () => {
    mapCollect(
      array,
      reconcileAppend()
    );
  })
  .on('cycle', function(event: any) {
    console.log(String(event.target));
  })
  .on('complete', function(this: any) {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ 'async': false });
