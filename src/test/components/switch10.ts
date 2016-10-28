import test from "ava";
import * as rxdn from "../../rxdn";
import {Observable} from "rxjs";

/* fixtures */

// Ethernet frame dst: 665544332211, src: 112233445566
const frame00 = "\
66554433221111223344556608004500\
00541ecd0000400141e30a00010b4a7d\
c4710800139a2a34000057e4247f0007\
52c408090a0b0c0d0e0f101112131415\
161718191a1b1c1d1e1f202122232425\
262728292a2b2c2d2e2f303132333435\
3637";

let pi00 = new rxdn.of10.PacketIn();
pi00.data = frame00;
pi00.message.buffer_id = -1;
pi00.message.in_port = 5;
pi00.reasonVal = rxdn.of10.ofp_packet_in_reason.OFPR_NO_MATCH;
pi00.message.total_len = 98;

const packetIn00 = Observable.of(<rxdn.OFEvent> {
  event: rxdn.OFEventType.Message,
  id: "1.1.1.1:1234",
  message: pi00,
});

/* tests */

test("Sends PacketOut", t => {
  t.plan(1);
  return <Observable<any>> rxdn.Switch10({
    openflowDriver: packetIn00,
  }).sinks.openflowDriver
    .first()
    .map(m => {
      if (m.event === rxdn.OFEventType.Message) {
        t.true(m.message instanceof rxdn.of10.PacketOut);
      } else {
        t.fail();
      }
    });
});
