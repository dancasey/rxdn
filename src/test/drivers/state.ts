/**
 * Test `drivers/state.ts`
 * Run with `npm test`
 */
import test from "ava";
import * as rxdn from "../../rxdn";
import {Observable} from "rxjs";

test("Returns function", t => {
  let d = rxdn.makeStateDriver<Object>({});
  t.is(typeof d, "function");
});

test("Returns initial value", t => {
  t.plan(1);
  let stateDriver = rxdn.makeStateDriver({});
  let runDriver = stateDriver(Observable.empty());
  if (runDriver) {
    return <Observable<any>> runDriver
      .map(val => t.deepEqual(val, {}));
  } else {
    t.fail();
    return;
  }
});

test("Updates state", t => {
  t.plan(1);
  const testValue = {key: "value"};
  let stateDriver = rxdn.makeStateDriver({});
  let runDriver = stateDriver(Observable
    .of((state: Object) => Object.assign({}, state, testValue)));
  if (runDriver) {
    return <Observable<any>> runDriver
      .last()
      .map(val => t.deepEqual(val, testValue));
  } else {
    t.fail();
    return;
  }
});
