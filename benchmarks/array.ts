import {Suite} from "benchmark";

const suite = new Suite;

// suite.add('initializeArray', function() {
//   initializeArray(10000, () => 0);
// })
//   .add('initializeArrayConst', function() {
//     initializeArrayConst(10000, 0);
//   })
//   .add('initializeArrayAlt', function() {
//     initializeArrayAlt(10000, 0);
//   })
//   .on('cycle', function(event) {
//     console.log(String(event.target));
//   })
//   .on('complete', function() {
//     console.log('Fastest is ' + this.filter('fastest').map('name'));
//   })
//   .run({ 'async': true });