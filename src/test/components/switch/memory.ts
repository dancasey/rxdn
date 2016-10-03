import test from "ava";
import * as rxdn from "../../../rxdn";
import {Observable} from "rxjs";
// Separately import SwitchMemory as it is not exported directly
import {SwitchMemory, SMEvent} from "../../../components/switch/memory";


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

// Ethernet frame dst: 010203040506, src: 0a0b0c0d0e0f
const frame01 = "\
0102030405060a0b0c0d0e0f08004500\
00541ecd0000400141e30a00010b4a7d\
c4710800139a2a34000057e4247f0007\
52c408090a0b0c0d0e0f101112131415\
161718191a1b1c1d1e1f202122232425\
262728292a2b2c2d2e2f303132333435\
3637";

// Ethernet frame dst: 0a0b0c0d0e0f, src: 010203040506
const frame02 = "\
0a0b0c0d0e0f01020304050608004500\
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

let pi01 = new rxdn.PacketIn();
pi01.data = frame01;
pi01.message.match.oxm_fields.push(new rxdn.Oxm({
  oxm_field: "OFPXMT_OFB_IN_PORT",
  oxm_value: "10",
}));

let pi02 = new rxdn.PacketIn();
pi02.data = frame02;
pi02.message.match.oxm_fields.push(new rxdn.Oxm({
  oxm_field: "OFPXMT_OFB_IN_PORT",
  oxm_value: "20",
}));

const packetIn00 = Observable.of(<rxdn.OFEvent> {
  event: rxdn.OFEventType.Message,
  id: "1.1.1.1:1234",
  message: pi00,
});

const packetIn01 = Observable.of(<rxdn.OFEvent> {
  event: rxdn.OFEventType.Message,
  id: "1.1.1.1:1234",
  message: pi01,
});

const packetIn02 = Observable.of(<rxdn.OFEvent> {
  event: rxdn.OFEventType.Message,
  id: "1.1.1.1:1234",
  message: pi02,
});

// Make sure to delay second packetIn, or memory will have all the `dstport`s immediately
const twoPackets: Observable<rxdn.OFEvent> = Observable.concat(packetIn01, packetIn02.delay(50));


/* tests */

test("Does not output to openflowDriver sink", t => {
  t.plan(1);
  return <Observable<any>> SwitchMemory({openflowDriver: packetIn00}).sinks.openflowDriver
    .map(m => t.fail())
    .timeoutWith(30, Observable.of(t.pass()));
});

test("Outputs new source info", t => {
  t.plan(1);
  const expecting: SMEvent = {
    id: "1.1.1.1:1234",
    srcport: 5,
    dstport: -1,
    srcmac: "112233445566",
    dstmac: "665544332211",
  };
  return <Observable<any>> SwitchMemory({openflowDriver: packetIn00}).sources.switchMemory
    .map(m => t.deepEqual(m, expecting));
});

test("Matches dstport in memory", t => {
  t.plan(1);
  const expecting: SMEvent[] = [{
    id: "1.1.1.1:1234",
    srcport: 10,
    dstport: -1,
    srcmac: "0a0b0c0d0e0f",
    dstmac: "010203040506",
  },
  {
    id: "1.1.1.1:1234",
    srcport: 20,
    dstport: 10,
    srcmac: "010203040506",
    dstmac: "0a0b0c0d0e0f",
  }];
  return <Observable<any>> SwitchMemory({openflowDriver: twoPackets}).sources.switchMemory
    .reduce((acc, val) => { acc.push(val); return acc; }, <SMEvent[]> new Array())
    .map(m => t.deepEqual(m, expecting));
});
