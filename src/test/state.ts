/**
 * Test `drivers/state.ts`
 * Run with `npm test`
 */
import test from "ava";
import * as rxdn from "../rxdn";
import {Observable} from "rxjs";

test("Returns function", t => {
  let d = rxdn.makeStateDriver<Object>({});
  t.is(typeof d, "function");
});

test("Updates state", t => {
  const testValue = {key: "value"};
  let d = rxdn.makeStateDriver<Object>({});
  let r = d(Observable.of((state: Object) => Object.assign({}, state, testValue)));
  if (!r) {
    t.fail();
  } else {
    r.map(val => t.deepEqual(val, testValue));
  }
});
