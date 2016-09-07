/**
 * Run with `npm test`
 */

/* tslint:disable:no-string-literals */
import test from "ava";
import * as rxdn from "../rxdn";
import {Observable} from "rxjs";

const EXCLUDE = "ofp_hello";

interface TestSource extends rxdn.ObservableCollection {
  mixed: Observable<string | number>;
}

const input: Observable<rxdn.OFDSource> = Observable.from([
  {
    event: rxdn.OFDEvent.Connection,
    id: "abc123",
  },
  {
    event: rxdn.OFDEvent.Message,
    id: "abc123",
    message: new rxdn.Hello(),
  },
  {
    event: rxdn.OFDEvent.Message,
    id: "abc123",
    message: new rxdn.FlowMod(),
  },
  {
    event: rxdn.OFDEvent.Disconnection,
    id: "abc123",
  },
]);

const result = rxdn.Filter(input, EXCLUDE);

test("removes named message", t => {
  t.plan(3);
  const r: Observable<any> = result
    .map(val => {
      if (val.event === rxdn.OFDEvent.Message && val.message) {
        t.false(val.message.name === EXCLUDE);
      } else {
        t.pass();
      }
    });
  return r;
});
