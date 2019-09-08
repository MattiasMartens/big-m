import { Suite } from 'benchmark';

import { collect, count, take, map } from '../exports/iterable';
import { mapCollect, reconcileAppend } from "../exports/maps";
import { pipe } from 'fp-ts/lib/pipeable';

const suite = new Suite;
const mapFn = ((i: number) => [Math.round(Math.random() * 10), i] as [number, number]);

const array = pipe(
  count(),
  a => take(a, 100000),
  a => map(a, v => mapFn(v)),
  collect
);

suite
  .add('Collect map manual', () => {
    const map = new Map();
    array.forEach(entry => {
      map.set(entry[0], entry[1]);
    });
  })
  .add('Collect map', () => {
    mapCollect(
      array
    );
  })
  .on('cycle', function(event: any) {
    console.log(String(event.target));
  })
  .on('complete', function(this: any) {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ 'async': false });

const suite2 = new Suite;
suite2
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