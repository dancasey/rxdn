import test from "ava";
import * as rxdn from "../rxdn";
import {Observable} from "rxjs";

test("Sends `Hello` on new connection", t => {
  const source: Observable<rxdn.OFDSource> = Observable.of({
    event: rxdn.OFDEvent.Connection,
    id: "1.1.1.1:1234",
  });
  const result: Observable<any> = rxdn.Core(source).openflowDriver
    .map(m => t.deepEqual(m.message, new rxdn.Hello()));
  return result;
});

test("Sends `EchoReply` for `EchoRequest`", t => {
  const source: Observable<rxdn.OFDSource> = Observable.of({
    event: rxdn.OFDEvent.Message,
    id: "1.1.1.1:1234",
    message: new rxdn.EchoRequest(),
  });
  const result: Observable<any> = rxdn.Core(source).openflowDriver
    .map(m => t.deepEqual(m.message, new rxdn.EchoReply()));
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

  const source: Observable<rxdn.OFDSource> = Observable.of({
    event: rxdn.OFDEvent.Message,
    id: "1.1.1.1:1234",
    message: request,
  });

  const result: Observable<any> = rxdn.Core(source).openflowDriver
    .map(m => t.deepEqual(m.message, reply));
  return result;
});
