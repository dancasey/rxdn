/**
 * Test `run.ts`
 * Run with `npm test`
 */

/* tslint:disable:no-string-literals */
import test from "ava";
import * as rxdn from "../rxdn";
import {Subscription, Observable} from "rxjs";

const testString = "test 1 2 3";
const identityMain: rxdn.Component = sources => ({sinks: sources, sources});
const identityDriver: rxdn.Driver<any, any> = (sinks) => sinks;
const testDriver: rxdn.Driver<void, string> = () => Observable.of(testString);

interface TestSources extends rxdn.ObservableCollection {
  testDriver: Observable<string>;
}

test("returns a subscription", t => {
  t.truthy(rxdn.run(identityMain, {testDriver}) instanceof Subscription);
});

// uses identity main and injects from driver
test.cb("connects drivers to main", t => {
  t.plan(1);
  // make a fake driver that checks for the string it injects
  const driver: rxdn.Driver<string, string> = (sink) => {
    if (!sink) {
      t.fail();
      return;
    }
    // check that the same string came back as a sink
    sink.subscribe(str => {
      t.is(str, testString);
      t.end();
    });
    // inject test string as a source
    return Observable.of(testString);
  };
  rxdn.run(identityMain, {driver});
});

// uses identity driver and sends from main
test.cb("connects main to drivers", t => {
  t.plan(1);
  // make a fake main that checks for the string it sends to driver
  const main: rxdn.Component = (sources: TestSources) => {
    // check that the same string came back as a source
    const sinks = sources.testDriver.map(str => {
      t.is(str, testString);
      t.end();
    });
    // send test string to driver
    return {
      sources,
      sinks: {
        testDriver: Observable.of(testString),
        subscribeDriver: sinks,
      },
    };
  };
  // need a subscribe driver to make `sinks` actually happen (or could subscribe in main)
  rxdn.run(main, {testDriver: identityDriver, subscribeDriver: identityDriver});
});
