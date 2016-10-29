import test from "ava";
import * as rxdn from "../../../rxdn";
import {Observable} from "rxjs";

test("Sends 1.0 `Hello` on new connection", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Connection,
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core10({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.deepEqual(m.message, new rxdn.of10.Hello()));
  return result;
});

test("Sends 1.3 `Hello` on new connection", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Connection,
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core13({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.deepEqual(m.message, new rxdn.of13.Hello()));
  return result;
});
