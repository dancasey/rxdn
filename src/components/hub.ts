import {OFComponent, OFEvent, OpenFlow} from "../drivers/openflow";
import * as OF from "node-openflow";

/** Responds to PacketIn with PacketOut which floods */
export const Hub: OFComponent = sources => {
  const packetout = sources.openflowDriver
    .filter(m => m.event === OFEvent.Message && m.message.name === "ofp_packet_in")
    .map((m: {id: string, event: OFEvent.Message, message: OF.PacketIn}) => {
      // Build the Action to send flows to the controller
      let action = new OF.Action();
      action.type = OF.ofp_action_type[OF.OFPAT_OUTPUT];
      // This is a hub, so flood the frame to all ports (except the ingress port)
      action.port = OF.OFPP_ALL;
      action.max_len = OF.OFPCML_NO_BUFFER;

      // Build the PacketOut that applies the Action
      let po = new OF.PacketOut();
      // Keep same xid as PacketIn
      po.message.header.xid = m.message.message.header.xid;
      po.message.in_port = OF.OFPP_CONTROLLER;
      po.message.actions.push(action);
      // If the switch did not buffer, then copy the data; otherwise reference by id
      if (m.message.message.buffer_id === OF.OFP_NO_BUFFER) {
        po.message.data = m.message.data.toString();
        po.message.buffer_id = OF.OFP_NO_BUFFER;
      } else {
        po.message.buffer_id = m.message.message.buffer_id;
      }

      return <OpenFlow> {
        event: OFEvent.Message,
        id: m.id,
        message: po,
      };
    });

  return {sources, sinks: {openflowDriver: packetout}};
};
