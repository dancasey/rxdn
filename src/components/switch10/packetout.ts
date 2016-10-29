import {OFCollection, OFEvent, OFEventType} from "../../drivers/openflow";
import {PIEvent, SMEvent, SMCollection, SMComponent} from "./memory";
import {Observable} from "rxjs";
import {of10} from "@dancasey/node-openflow";

/**
 * PacketOut
 * - If `dstport` is -1
 *   - Floods (sending nothing to FlowMod component)
 * - If not
 *   - If `buffer_id` is `OFP_NO_BUFFER`
 *     - Sends direct PacketOut
 *     - Forwards to FlowMod component
 *   - If not
 *     - Forwards to FlowMod component (no PacketOut necessary)
 *
 */
export const PacketOut: SMComponent = (sources: OFCollection & SMCollection) => {

  // Zip together packetIn and switchMemory events,
  // then partition according to whether destination was known by switchMemory
  const [unknownDest, knownDest]: Array<Observable<[PIEvent, SMEvent]>> = Observable
    .zip(sources.openflowDriver, sources.switchMemory)
    .partition(([, sm]: [PIEvent, SMEvent]) => sm.dstport === -1);

  // Create flood packetOut events for packetIn events of unknown destinations
  const packetOutFlood = unknownDest
    .map(([pi]: [PIEvent, SMEvent]) => {
      let po = new of10.PacketOut();
      po.message.header.xid = pi.message.message.header.xid;
      po.message.buffer_id = pi.message.message.buffer_id;
      po.message.in_port = pi.message.message.in_port;
      let ac = new of10.Action({
        type: of10.ofp_action_type[of10.OFPAT_OUTPUT],
        port: of10.OFPP_FLOOD,
        max_len: 0xffe5,
      });
      po.message.actions.push(ac);
      if (po.message.buffer_id === of10.OFP_NO_BUFFER) {
        po.message.data = pi.message.message.data;
      }
      return <OFEvent> {
        id: pi.id,
        event: OFEventType.Message,
        message: po,
      };
    });

  // Create direct packetOut events for packetIn events of known destinations,
  // unless there is a `buffer_id !== OFP_NO_BUFFER`; in that case, FlowMod suffices
  const packetOutDirect = knownDest
    .filter(([pi]: [PIEvent, SMEvent]) =>
      pi.message.message.buffer_id === of10.OFP_NO_BUFFER)
    .map(([pi, sm]: [PIEvent, SMEvent]) => {
      let po = new of10.PacketOut();
      po.message.header.xid = pi.message.message.header.xid;
      po.message.buffer_id = of10.OFP_NO_BUFFER;
      po.message.in_port = pi.message.message.in_port;
      let ac = new of10.Action({
        type: of10.ofp_action_type[of10.OFPAT_OUTPUT],
        port: sm.dstport,
      });
      po.message.actions.push(ac);
      po.message.data = pi.message.message.data;
      return <OFEvent> {
        id: pi.id,
        event: OFEventType.Message,
        message: po,
      };
    });

  // Un-zip packetIn and switchMemory for FlowMod component sources
  const flowModPI = knownDest.map(([pi]: [PIEvent, SMEvent]) => pi);
  const flowModSM = knownDest.map(([, sm]: [PIEvent, SMEvent]) => sm);

  // Outputs
  const outSources = Object.assign({}, sources, {
    openflowDriver: flowModPI,
    switchMemory: flowModSM,
  });
  const sinks = {openflowDriver: Observable.merge(packetOutFlood, packetOutDirect)};

  return {
    sources: outSources,
    sinks,
  };
};
