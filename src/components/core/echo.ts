import {OFComponent, OFEventType, OFEvent} from "../../drivers/openflow";
import {of10, of13} from "@dancasey/node-openflow";

/** Replies to EchoRequest messages and removes them from outgoing sources */
export const Echo: OFComponent = sources => {
  const [echoRequests, noEchoRequests] = sources.openflowDriver.partition(m => {
    if (m.event === OFEventType.Message) {
      return m.message.name === "ofp_echo_request" ? true : false;
    } else {
      return false;
    }
  });

  const echoReply = echoRequests
    .map((m: {id: string, event: OFEventType.Message, message: of10.EchoRequest | of13.EchoRequest}) => {
      let reply: of10.EchoReply | of13.EchoReply;
      if (m.message.message.header.version === of13.OFP_VERSION) {
        reply = new of13.EchoReply();
      } else {
        reply = new of10.EchoReply();
      }
      if (m.message.data.length > 0) {
        reply.data = m.message.data;
      }
      reply.message.header.xid = m.message.message.header.xid;
      const result: OFEvent = {
        event: OFEventType.Message,
        id: m.id,
        message: reply,
      };
      return result;
    });

  return {
    sources: {openflowDriver: noEchoRequests},
    sinks: {openflowDriver: echoReply},
  };
};
