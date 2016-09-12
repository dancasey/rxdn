import {OFComponent, OFDEvent, OpenFlow} from "../../drivers/openflow";
import * as OF from "node-openflow";

/** Sends a Hello message upon connection */
export const Hello: OFComponent = sources => {
  const hello = sources.openflowDriver
    .filter(m => m.event === OFDEvent.Connection)
    .map(m => {
      const result: OpenFlow = {
        event: OFDEvent.Message,
        id: m.id,
        message: new OF.Hello(),
      };
      return result;
    });
  return {
    sources,
    sinks: {openflowDriver: hello},
  };
};
