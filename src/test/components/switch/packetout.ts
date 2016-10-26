import test from "ava";
import * as rxdn from "../../../rxdn";
import {Observable} from "rxjs";
// Separately import PacketOut as it is not exported directly
import {PacketOut} from "../../../components/switch/packetout";
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

let packetInNoId = new rxdn.of13.PacketIn();
packetInNoId.message.match.oxm_fields.push(new rxdn.of13.Oxm({
  oxm_field: "OFPXMT_OFB_IN_PORT",
  oxm_value: "5",
}));
packetInNoId.message.buffer_id = rxdn.of13.OFP_NO_BUFFER;
packetInNoId.data = frame00;

const packetInNoIdEvent = Observable.of(<rxdn.OFEvent> {
  event: rxdn.OFEventType.Message,
  id: "1.1.1.1:1234",
  message: packetInNoId,
});

let packetInId = new rxdn.of13.PacketIn();
packetInId.message.match.oxm_fields.push(new rxdn.of13.Oxm({
  oxm_field: "OFPXMT_OFB_IN_PORT",
  oxm_value: "5",
}));
packetInId.message.buffer_id = 128;

const packetInIdEvent = Observable.of(<rxdn.OFEvent> {
  event: rxdn.OFEventType.Message,
  id: "1.1.1.1:1234",
  message: packetInId,
});

const switchMemoryNoDst: Observable<SMEvent> = Observable.of({
  id: "1.1.1.1:1234",
  srcport: 5,
  dstport: -1,
  srcmac: "112233445566",
  dstmac: "665544332211",
});

const switchMemoryDst: Observable<SMEvent> = Observable.of({
  id: "1.1.1.1:1234",
  srcport: 5,
  dstport: 22,
  srcmac: "112233445566",
  dstmac: "665544332211",
});

//

let packetOutNoDstNoId = new rxdn.of13.PacketOut();
packetOutNoDstNoId.message.actions.push(new rxdn.of13.Action({
  type: rxdn.of13.ofp_action_type[rxdn.of13.OFPAT_OUTPUT],
  port: rxdn.of13.OFPP_ALL,
}));
packetOutNoDstNoId.message.buffer_id = rxdn.of13.OFP_NO_BUFFER;
packetOutNoDstNoId.message.data = frame00;

const packetOutNoDstNoIdEvent: rxdn.OFEvent = {
  id: "1.1.1.1:1234",
  event: rxdn.OFEventType.Message,
  message: packetOutNoDstNoId,
};

//

let packetOutNoDstId = new rxdn.of13.PacketOut();
packetOutNoDstId.message.actions.push(new rxdn.of13.Action({
  type: rxdn.of13.ofp_action_type[rxdn.of13.OFPAT_OUTPUT],
  port: rxdn.of13.OFPP_ALL,
}));
packetOutNoDstId.message.buffer_id = 128;

const packetOutNoDstIdEvent: rxdn.OFEvent = {
  id: "1.1.1.1:1234",
  event: rxdn.OFEventType.Message,
  message: packetOutNoDstId,
};

//

let packetOutDstNoId = new rxdn.of13.PacketOut();
packetOutDstNoId.message.actions.push(new rxdn.of13.Action({
  type: rxdn.of13.ofp_action_type[rxdn.of13.OFPAT_OUTPUT],
  port: 22,
}));
packetOutNoDstNoId.message.buffer_id = rxdn.of13.OFP_NO_BUFFER;
packetOutDstNoId.message.data = frame00;

const packetOutDstNoIdEvent: rxdn.OFEvent = {
  id: "1.1.1.1:1234",
  event: rxdn.OFEventType.Message,
  message: packetOutDstNoId,
};


/* tests */

test("NoId, NoDst: Flood PacketOut", t => {
  t.plan(1);
  return <Observable<any>> PacketOut({
    openflowDriver: packetInNoIdEvent,
    switchMemory: switchMemoryNoDst,
  }).sinks.openflowDriver
    .map(m => t.deepEqual(m, packetOutNoDstNoIdEvent));
});

test("NoId, NoDst: Does not send to FlowMod component", t => {
  t.plan(0);
  return <Observable<any>> PacketOut({
    openflowDriver: packetInNoIdEvent,
    switchMemory: switchMemoryNoDst,
  }).sources.openflowDriver
    .map(m => t.fail());
});

test("Id, NoDst: Flood PacketOut", t => {
  t.plan(1);
  return <Observable<any>> PacketOut({
    openflowDriver: packetInIdEvent,
    switchMemory: switchMemoryNoDst,
  }).sinks.openflowDriver
    .map(m => t.deepEqual(m, packetOutNoDstIdEvent));
});

test("Id, NoDst: Does not send to FlowMod component", t => {
  t.plan(0);
  return <Observable<any>> PacketOut({
    openflowDriver: packetInIdEvent,
    switchMemory: switchMemoryNoDst,
  }).sources.openflowDriver
    .map(m => t.fail());
});

test("NoId, Dst: Direct PacketOut", t => {
  t.plan(1);
  return <Observable<any>> PacketOut({
    openflowDriver: packetInNoIdEvent,
    switchMemory: switchMemoryDst,
  }).sinks.openflowDriver
    .map(m => t.deepEqual(m, packetOutDstNoIdEvent));
});

test("NoId, Dst: Sends to FlowMod component", t => {
  t.plan(1);
  return <Observable<any>> PacketOut({
    openflowDriver: packetInNoIdEvent,
    switchMemory: switchMemoryDst,
  }).sources.openflowDriver
    .map(m => t.deepEqual(m, <rxdn.OFEvent> {
      event: rxdn.OFEventType.Message,
      id: "1.1.1.1:1234",
      message: packetInNoId,
    }));
});

test("Id, Dst: Sends to FlowMod component", t => {
  t.plan(1);
  return <Observable<any>> PacketOut({
    openflowDriver: packetInIdEvent,
    switchMemory: switchMemoryDst,
  }).sources.openflowDriver
    .map(m => t.deepEqual(m, <rxdn.OFEvent> {
      event: rxdn.OFEventType.Message,
      id: "1.1.1.1:1234",
      message: packetInId,
    }));
});

test("Id, Dst: No PacketOut", t => {
  t.plan(0);
  return <Observable<any>> PacketOut({
    openflowDriver: packetInIdEvent,
    switchMemory: switchMemoryDst,
  }).sinks.openflowDriver
    .map(m => t.fail());
});

test("When sending to FlowMod component, includes switchMemory", t => {
  t.plan(1);
  return <Observable<any>> PacketOut({
    openflowDriver: packetInIdEvent,
    switchMemory: switchMemoryDst,
  }).sources.switchMemory
    .map(m => t.deepEqual(m, {
      id: "1.1.1.1:1234",
      srcport: 5,
      dstport: 22,
      srcmac: "112233445566",
      dstmac: "665544332211",
    }));
});
