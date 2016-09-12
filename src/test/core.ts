import test from "ava";
import * as rxdn from "../rxdn";
import {Observable} from "rxjs";

test("Sends `Hello` on new connection", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFDEvent.Connection,
  } as rxdn.OpenFlow);
  const result: Observable<any> = rxdn.Core({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFDEvent.Message, message: rxdn.OpenFlowMessage}) =>
      t.deepEqual(m.message, new rxdn.Hello()));
  return result;
});

test("Sends `EchoReply` for `EchoRequest`", t => {
  const openflowDriver = Observable.of({
    event: rxdn.OFDEvent.Message,
    id: "1.1.1.1:1234",
    message: new rxdn.EchoRequest(),
  } as rxdn.OpenFlow);
  const result: Observable<any> = rxdn.Core({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFDEvent.Message, message: rxdn.OpenFlowMessage}) =>
      t.deepEqual(m.message, new rxdn.EchoReply()));
  return result;
});

test("Sends `EchoReply` with matching xid and data", t => {
  const xid = 9876;
  const data = new Buffer("echo this data");

  let request = new rxdn.EchoRequest();
  request.message.header.xid = xid;
  request.data = data;

  let reply = new rxdn.EchoReply();
  reply.message.header.xid = xid;
  reply.data = data;

  const openflowDriver = Observable.of({
    event: rxdn.OFDEvent.Message,
    id: "1.1.1.1:1234",
    message: request,
  } as rxdn.OpenFlow);

  const result: Observable<any> = rxdn.Core({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFDEvent.Message, message: rxdn.OpenFlowMessage}) =>
      t.deepEqual(m.message, reply));
  return result;
});
