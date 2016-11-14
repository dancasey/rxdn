import {OFComponent, OFEventType, OFEvent} from "../drivers/openflow";
import {of10, of13} from "@dancasey/node-openflow";

/** Responds to PacketIn with PacketOut which floods */
export const Hub: OFComponent = sources => {
  const packetout = sources.openflowDriver
    .filter(m => m.event === OFEventType.Message && m.message.name === "ofp_packet_in")
    .map((m: {id: string, event: OFEventType.Message, message: of10.PacketIn | of13.PacketIn}) => {
      let po: of10.PacketOut | of13.PacketOut;
      if (m.message instanceof of13.PacketIn) {
        // Build the Action to send flows to the controller
        let action = new of13.Action();
        action.type = of13.ofp_action_type[of13.OFPAT_OUTPUT];
        // This is a hub, so flood the frame to all ports (except the ingress port)
        action.port = of13.OFPP_ALL;
        action.max_len = of13.OFPCML_NO_BUFFER;

        // Build the PacketOut that applies the Action
        po = new of13.PacketOut();
        po.message.in_port = of13.OFPP_CONTROLLER;
        po.message.actions.push(action);

        // If the switch did not buffer, then copy the data; otherwise reference by id
        if (m.message.message.buffer_id === of13.OFP_NO_BUFFER) {
          po.message.data = m.message.data.toString();
          po.message.buffer_id = of13.OFP_NO_BUFFER;
        } else {
          po.message.buffer_id = m.message.message.buffer_id;
        }
      } else {
        // Build the Action to send flows to the controller
        let action = new of10.Action();
        action.type = of10.ofp_action_type[of10.OFPAT_OUTPUT];
        // This is a hub, so flood the frame to all ports (except the ingress port)
        action.port = of10.OFPP_FLOOD;
        action.max_len = 0xffe5;

        // Build the PacketOut that applies the Action
        po = new of10.PacketOut();
        po.message.in_port = m.message.message.in_port;
        po.message.actions.push(action);

        // If the switch did not buffer, then copy the data; otherwise reference by id
        if (m.message.message.buffer_id === of10.OFP_NO_BUFFER) {
          po.message.data = m.message.data;
          po.message.buffer_id = of10.OFP_NO_BUFFER;
        } else {
          po.message.buffer_id = m.message.message.buffer_id;
        }
      }

      // Keep same xid as PacketIn
      po.message.header.xid = m.message.message.header.xid;

      return <OFEvent> {
        event: OFEventType.Message,
        id: m.id,
        message: po,
      };
    });

  return {sources, sinks: {openflowDriver: packetout}};
};
