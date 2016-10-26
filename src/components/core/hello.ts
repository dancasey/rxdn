import {OFComponent, OFEventType, OFEvent} from "../../drivers/openflow";
import {of13} from "@dancasey/node-openflow";

/** Sends a Hello message upon connection */
export const Hello: OFComponent = sources => {
  const hello = sources.openflowDriver
    .filter(m => m.event === OFEventType.Connection)
    .map(m => <OFEvent> {
      event: OFEventType.Message,
      id: m.id,
      message: new of13.Hello(),
    });

  return {sources, sinks: {openflowDriver: hello}};
};
