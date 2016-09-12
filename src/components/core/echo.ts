import {OFComponent, OFEvent, OpenFlow} from "../../drivers/openflow";
import * as OF from "node-openflow";

/** Replies to EchoRequest messages and removes them from outgoing sources */
export const Echo: OFComponent = sources => {
  const [echoRequests, noEchoRequests] = sources.openflowDriver.partition(m => {
    if (m.event === OFEvent.Message) {
      return m.message.name === "ofp_echo_request" ? true : false;
    } else {
      return false;
    }
  });

  const echoReply = echoRequests
    .map((m: {id: string, event: OFEvent.Message, message: OF.EchoRequest}) => {
      const reply = new OF.EchoReply();
      if (m.message.data.length > 0) {
        reply.data = m.message.data;
      }
      reply.message.header.xid = m.message.message.header.xid;
      const result: OpenFlow = {
        event: OFEvent.Message,
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
