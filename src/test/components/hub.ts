import test from "ava";
import * as rxdn from "../../rxdn";
import {Observable} from "rxjs";

test("Floods packets without buffer_id", t => {
  let pi = new rxdn.of13.PacketIn();
  pi.message.buffer_id = rxdn.of13.OFP_NO_BUFFER;
  pi.data = "abc123";

  const openflowDriver = Observable.of({
    id: "1.2.3.4:1111",
    event: rxdn.OFEventType.Message,
    message: pi,
  } as rxdn.OFEvent);
  return <Observable<any>> rxdn.Hub({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.of13.PacketOut}) => {
      t.is(m.message.name, "ofp_packet_out");
      t.is(m.message.message.data, pi.data);
    });
});

test("Floods packets with buffer_id", t => {
  let pi = new rxdn.of13.PacketIn();
  pi.message.buffer_id = 1234;

  const openflowDriver = Observable.of({
    id: "1.2.3.4:1111",
    event: rxdn.OFEventType.Message,
    message: pi,
  } as rxdn.OFEvent);
  return <Observable<any>> rxdn.Hub({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.of13.PacketOut}) => {
      t.is(m.message.name, "ofp_packet_out");
      t.is(m.message.message.buffer_id, 1234);
    });
});
