import {OFComponent, OFEvent, OpenFlow} from "../../drivers/openflow";
import * as OF from "node-openflow";

/** Sends a Hello message upon connection */
export const Hello: OFComponent = sources => {
  const hello = sources.openflowDriver
    .filter(m => m.event === OFEvent.Connection)
    .map(m => <OpenFlow> {
      event: OFEvent.Message,
      id: m.id,
      message: new OF.Hello(),
    });

  return {sources, sinks: {openflowDriver: hello}};
};
