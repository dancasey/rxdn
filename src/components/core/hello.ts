import {OFComponent, OFDEvent, OFDMessage} from "../../drivers/openflow";
import * as OF from "node-openflow";

/** Sends a Hello message upon connection */
export let Hello: OFComponent = sources => {
  const openflowDriver = sources.openflowDriver
    .filter(ev => ev.event === OFDEvent.Connection)
    .map(ev => <OFDMessage> ({
      event: OFDEvent.Message,
      id: ev.id,
      message: new OF.Hello(),
    }));
  return {
    sources,
    sinks: {openflowDriver},
  };
};
