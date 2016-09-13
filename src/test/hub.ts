import test from "ava";
import * as rxdn from "../rxdn";
import {Observable} from "rxjs";

test("Floods packets", t => {
  let pi = new rxdn.PacketIn();
  pi.message.buffer_id = rxdn.OFP_NO_BUFFER;
  pi.data = "abc123";

  const openflowDriver = Observable.of({
    id: "1.2.3.4:1111",
    event: rxdn.OFEvent.Message,
    message: pi,
  } as rxdn.OpenFlow);
  return <Observable<any>> rxdn.Hub({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFEvent.Message, message: rxdn.PacketOut}) => {
      t.is(m.message.name, "ofp_packet_out");
      t.is(m.message.message.data, pi.data);
    });
});
