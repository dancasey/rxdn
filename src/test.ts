/* run tests with `npm test` */
/* tslint:disable:no-string-literals */
import test from "ava";
import * as rxdn from "./rxdn";
import {Subscription, Observable} from "rxjs";

const testString = "test 1 2 3";

const identityMain: rxdn.MainFn = sources => sources;
// const identityDriver: rxdn.Driver<any, any> = (sinks) => sinks;
const testDriver: rxdn.Driver<void, string> = () => Observable.of(testString);

test("run returns a subscription", t => {
  t.truthy(rxdn.run(identityMain, {testDriver}) instanceof Subscription);
});


/* this is maddness; don't even read it! */
// test("run, does", t => {
//   let testObservable = new Subject<string>();
//   const d: rxdn.Driver<string, string> = (source) => {
//     testObservable.next(source);
//     return Observable.of("moo");
//   };
//   rxdn.run(identityMain, {d});
//   return testObservable.map(str => t.is(str, testString));
// });
