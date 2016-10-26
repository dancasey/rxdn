import test from "ava";
import * as rxdn from "../../../rxdn";
import {Observable} from "rxjs";

test("Sends `EchoReply` for `EchoRequest`", t => {
  const openflowDriver = Observable.of({
    event: rxdn.OFEventType.Message,
    id: "1.1.1.1:1234",
    message: new rxdn.of13.EchoRequest(),
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.deepEqual(m.message, new rxdn.of13.EchoReply()));
  return result;
});

test("Sends `EchoReply` with matching xid and data", t => {
  const xid = 9876;
  const data = new Buffer("echo this data");

  let request = new rxdn.of13.EchoRequest();
  request.message.header.xid = xid;
  request.data = data;

  let reply = new rxdn.of13.EchoReply();
  reply.message.header.xid = xid;
  reply.data = data;

  const openflowDriver = Observable.of({
    event: rxdn.OFEventType.Message,
    id: "1.1.1.1:1234",
    message: request,
  } as rxdn.OFEvent);

  const result: Observable<any> = rxdn.Core({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.deepEqual(m.message, reply));
  return result;
});

test("Removes `EchoRequest` from sources", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Message,
    message: new rxdn.of13.EchoRequest(),
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core({openflowDriver}).sources.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.fail());
  return result;
});
