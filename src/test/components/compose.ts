/**
 * Run with `npm test`
 */

/* tslint:disable:no-string-literals */
import test from "ava";
import * as rxdn from "../../rxdn";
import {Observable} from "rxjs";

interface TestSource extends rxdn.Collection {
  mixed: Observable<string | number>;
}

const mixed = Observable.from([1, 2, "a", 3, "b", "c"]);

const componentNoSink: rxdn.Component = (sources: TestSource) => {
  const numbersOnly = sources.mixed
    .filter(val => typeof val === "number" ? true : false);
  return {
    sources: {mixed: numbersOnly},
    sinks: {},
  };
};

const componentSinkOnly: rxdn.Component = (sources: TestSource) => {
  const sink = sources.mixed
    .map(val => `hello ${val}!`);
  return {
    sources,
    sinks: {mixed: sink},
  };
};

const result = rxdn.Compose([componentNoSink, componentSinkOnly], {mixed});

test("Passes sources through components", t => {
  t.plan(3);
  const r: Observable<any> = (result.sources as TestSource).mixed
    .map(val => t.true(typeof val === "number"));
  return r;
});

test("Collects and merges sinks", t => {
  t.plan(3);
  const r: Observable<any> = (result.sinks as TestSource).mixed
    .map(val => t.true(typeof val === "string"));
  return r;
});
