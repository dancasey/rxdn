import test from "ava";
import * as R from "ramda";
import * as rxdn from "../../../rxdn";
import {Observable} from "rxjs";
// Separately import FlowMod as it is not exported directly
import {FlowMod} from "../../../components/switch10/flowmod";
import {SMEvent} from "../../../components/switch10/memory";


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
pi00.message.in_port = 5;

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

let fm = new rxdn.of10.FlowMod();
fm.message.idle_timeout = 5;
fm.message.hard_timeout = 10;
fm.message.priority = 10;
fm.message.buffer_id = 0;
fm.flagsVal = rxdn.of10.OFPFF_SEND_FLOW_REM;
let act = new rxdn.of10.Action();
act.typeVal = rxdn.of10.OFPAT_OUTPUT;
act.port = 55;
act.max_len = 0xffff;
fm.message.actions = [act];
const props = {
  hardTimeout: 22,
  idleTimeout: 23,
  priority: 24,
};
fm.message.match.wildcards = [
  "OFPFW_IN_PORT",
  "OFPFW_DL_VLAN",
  "OFPFW_DL_SRC",
  "OFPFW_DL_TYPE",
  "OFPFW_NW_PROTO",
  "OFPFW_TP_SRC",
  "OFPFW_TP_DST",
  "OFPFW_NW_SRC_SHIFT",
  "OFPFW_NW_SRC_BITS",
  "OFPFW_NW_SRC_MASK",
  "OFPFW_NW_SRC_ALL",
  "OFPFW_NW_DST_SHIFT",
  "OFPFW_NW_DST_BITS",
  "OFPFW_NW_DST_MASK",
  "OFPFW_NW_DST_ALL",
  "OFPFW_DL_VLAN_PCP",
  "OFPFW_NW_TOS",
];
fm.message.match.dl_dst = "665544332211";

let fmProps = R.clone(fm);
fmProps.message.hard_timeout = props.hardTimeout;
fmProps.message.idle_timeout = props.idleTimeout;
fmProps.message.priority = props.priority;

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

test("Adjusts timeouts based on props", t => {
  t.plan(1);

  const expecting: rxdn.OFEvent = {
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Message,
    message: fmProps,
  };

  return <Observable<any>> FlowMod({
    openflowDriver: packetIn00,
    switchMemory: sm00,
    props: Observable.of(props),
  }).sinks.openflowDriver
    .map(m => t.deepEqual(m, expecting));
});
