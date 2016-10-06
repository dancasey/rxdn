import test from "ava";
import * as rxdn from "../../../rxdn";
import {Observable} from "rxjs";
// Separately import FlowMod as it is not exported directly
import {FlowMod} from "../../../components/switch/flowmod";
import {SMEvent} from "../../../components/switch/memory";


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

const sm00: Observable<SMEvent> = Observable.of({
  id: "1.1.1.1:1234",
  srcport: 5,
  dstport: 55,
  srcmac: "112233445566",
  dstmac: "665544332211",
});

let fm = new rxdn.FlowMod();
fm.message.idle_timeout = 5;
fm.message.hard_timeout = 10;
fm.message.priority = 10;
fm.message.buffer_id = 0;
fm.flagsVal = rxdn.OFPFF_SEND_FLOW_REM;

let match = new rxdn.Match();
match.oxm_fields.push(new rxdn.Oxm({oxm_field: "OFPXMT_OFB_ETH_DST", oxm_value: "665544332211"}));
fm.message.match = match;

let ins = new rxdn.Instruction();
ins.typeVal = rxdn.OFPIT_APPLY_ACTIONS;
let act = new rxdn.Action();
act.typeVal = rxdn.OFPAT_OUTPUT;
act.port = 55;
act.max_len = rxdn.OFPCML_NO_BUFFER;
ins.actions.push(act);
fm.message.instructions.push(ins);


/* tests */

test("Creates the corresponding FlowMod", t => {
  t.plan(1);

  const expecting: rxdn.OFEvent = {
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Message,
    message: fm,
  };

  return <Observable<any>> FlowMod({openflowDriver: packetIn00, switchMemory: sm00}).sinks.openflowDriver
    .map(m => t.deepEqual(m, expecting));
});
