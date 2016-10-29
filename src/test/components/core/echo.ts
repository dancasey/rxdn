import test from "ava";
import * as rxdn from "../../../rxdn";
import {Observable} from "rxjs";

test("Sends 1.0 `EchoReply` for `EchoRequest`", t => {
  const openflowDriver = Observable.of({
    event: rxdn.OFEventType.Message,
    id: "1.1.1.1:1234",
    message: new rxdn.of10.EchoRequest(),
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core10({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.deepEqual(m.message, new rxdn.of10.EchoReply()));
  return result;
});

test("Sends 1.0 `EchoReply` with matching xid and data", t => {
  const xid = 9876;
  const data = new Buffer("echo this data");

  let request = new rxdn.of10.EchoRequest();
  request.message.header.xid = xid;
  request.data = data;

  let reply = new rxdn.of10.EchoReply();
  reply.message.header.xid = xid;
  reply.data = data;

  const openflowDriver = Observable.of({
    event: rxdn.OFEventType.Message,
    id: "1.1.1.1:1234",
    message: request,
  } as rxdn.OFEvent);

  const result: Observable<any> = rxdn.Core10({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.deepEqual(m.message, reply));
  return result;
});

test("Removes 1.0 `EchoRequest` from sources", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Message,
    message: new rxdn.of10.EchoRequest(),
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core10({openflowDriver}).sources.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.fail());
  return result;
});

test("Sends 1.3 `EchoReply` for `EchoRequest`", t => {
  const openflowDriver = Observable.of({
    event: rxdn.OFEventType.Message,
    id: "1.1.1.1:1234",
    message: new rxdn.of13.EchoRequest(),
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core13({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.deepEqual(m.message, new rxdn.of13.EchoReply()));
  return result;
});

test("Sends 1.3 `EchoReply` with matching xid and data", t => {
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

  const result: Observable<any> = rxdn.Core13({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.deepEqual(m.message, reply));
  return result;
});

test("Removes 1.3 `EchoRequest` from sources", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Message,
    message: new rxdn.of13.EchoRequest(),
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core13({openflowDriver}).sources.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.fail());
  return result;
});
