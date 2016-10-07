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

let pi00 = new rxdn.PacketIn();
pi00.data = frame00;
pi00.message.match.oxm_fields.push(new rxdn.Oxm({
  oxm_field: "OFPXMT_OFB_IN_PORT",
  oxm_value: "5",
}));

const packetIn00 = Observable.of(<rxdn.OFEvent> {
  event: rxdn.OFEventType.Message,
  id: "1.1.1.1:1234",
  message: pi00,
});


/* tests */

test("Passes on packets when src/dst MAC not in ACL", t => {
  t.plan(1);
  return <Observable<any>> rxdn.Acl({
    openflowDriver: packetIn00,
    props: Observable.of({acl: ["aabbccddeeff", "ffeeddccbbaa"]}),
  }).sources.openflowDriver
    .map(m => t.deepEqual(m, <rxdn.OFEvent> {
      event: rxdn.OFEventType.Message,
      id: "1.1.1.1:1234",
      message: pi00,
    }));
});

test("Passes on messages that are not PacketIn", t => {
  t.plan(1);
  let ereq: rxdn.OFEvent = {
    event: rxdn.OFEventType.Message,
    id: "1.1.1.1:1234",
    message: new rxdn.EchoRequest(),
  };
  return <Observable<any>> rxdn.Acl({
    openflowDriver: Observable.of(ereq),
    props: Observable.of({acl: ["aabbccddeeff", "ffeeddccbbaa"]}),
  }).sources.openflowDriver
    .map(m => t.deepEqual(m, ereq));
});

test("Drops packets when src MAC is in ACL", t => {
  t.plan(0);
  return <Observable<any>> rxdn.Acl({
    openflowDriver: packetIn00,
    props: Observable.of({acl: ["112233445566"]}),
  }).sources.openflowDriver.map(m => t.fail());
});

test("Drops packets when dst MAC is in ACL", t => {
  t.plan(0);
  return <Observable<any>> rxdn.Acl({
    openflowDriver: packetIn00,
    props: Observable.of({acl: ["665544332211"]}),
  }).sources.openflowDriver.map(m => t.fail());
});
