import {Observable} from "rxjs";
import {OFDSource, OFDEvent, OFDSink} from "../../drivers/openflow";
import {Filter} from "./filter";
import * as OF from "node-openflow";

/**
 * Replies to EchoRequest messages and removes them from `next`
 * @param {Observable<OFDSource>} source
 * @returns {ObservableCollection}
 */
export const Echo = (source: Observable<OFDSource>) => {
  // Send an `EchoReply` whenever an `EchoRequest` is received
  const openflowDriver: Observable<OFDSink> = source
    .filter(({event}) => event === OFDEvent.Message)
    .filter(({message}) => (message as OF.OpenFlowMessage).name === "ofp_echo_request")
    .map(({id, message}) => {
      const reply = new OF.EchoReply();
      // TODO fix upstream so type assertion isn't necessary
      if (message && (<OF.EchoRequest> message).data) {
        reply.data = (<OF.EchoRequest> message).data;
      }
      reply.message.header.xid = (<OF.EchoRequest> message).message.header.xid;
      return {id, message: reply};
    });

  // For chained components, filter out EchoRequest messages
  const next: Observable<OFDSource> = Filter(source, "ofp_echo_request");

  return {
    next,
    openflowDriver,
  };
};
