import {OFComponent, OFDEvent, OFDMessage} from "../../drivers/openflow";
import {Filter} from "../../util/filter";
import * as OF from "node-openflow";

/** Replies to EchoRequest messages and removes them from outgoing sources */
export const Echo: OFComponent = sources => {
  const sinks = {
    openflowDriver: sources.openflowDriver
      .filter(({event}) => event === OFDEvent.Message)
      .filter((m: OFDMessage) => m.message.name === "ofp_echo_request")
      .map((m: OFDMessage) => {
        const reply = new OF.EchoReply();
        // TODO fix upstream so type assertion isn't necessary
        if (m.message && (<OF.EchoRequest> m.message).data) {
          reply.data = (<OF.EchoRequest> m.message).data;
        }
        reply.message.header.xid = (<OF.EchoRequest> m.message).message.header.xid;
        const result: OFDMessage = {
          event: OFDEvent.Message,
          id: m.id,
          message: reply,
        };
        return result;
      }),
  };

  // For chained components, filter out EchoRequest messages
  const outSource = {
    openflowDriver: Filter(sources.openflowDriver, "ofp_echo_request"),
  };

  return {sources: outSource, sinks};
};
