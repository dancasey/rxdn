/* run tests with `npm test` */
/* tslint:disable:no-string-literals */
import test from "ava";
import * as rxdn from "../rxdn";
import {Subscription, Observable} from "rxjs";

const testString = "test 1 2 3";
const identityMain: rxdn.MainFn = sources => sources;
const identityDriver: rxdn.Driver<any, any> = (sinks) => sinks;
const testDriver: rxdn.Driver<void, string> = () => Observable.of(testString);

interface TestSources extends rxdn.ObservableCollection {
  testDriver: Observable<string>;
}

test("returns a subscription", t => {
  t.truthy(rxdn.run(identityMain, {testDriver}) instanceof Subscription);
});

// uses identity main and injects from driver
test("connects drivers to main", t => {
  // make a fake driver that checks for the string it injects
  const d: rxdn.Driver<string, string> = (sink) => {
    if (!sink) {
      t.fail();
      return;
    }
    // check that the same string came back as a sink
    sink.subscribe(str => t.is(str, testString));
    // inject test string as a source
    return Observable.of(testString);
  };
  rxdn.run(identityMain, {d});
});

// uses identity driver and sends from main
test("connects main to drivers", t => {
  // make a fake main that checks for the string it sends to driver
  const m: rxdn.MainFn = (sources: TestSources) => {
    // check that the same string came back as a source
    sources.testDriver.map(str => t.is(str, testString));
    // send test string to driver
    return {testDriver: Observable.of(testString)};
  };
  rxdn.run(m, {testDriver: identityDriver});
});
