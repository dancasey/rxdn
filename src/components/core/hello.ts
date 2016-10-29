import {OFComponent, OFEventType, OFEvent} from "../../drivers/openflow";
import {of10, of13} from "@dancasey/node-openflow";

/** Sends an OpenFlow 1.0 Hello message upon connection */
export const Hello10: OFComponent = sources => {
  const hello = sources.openflowDriver
    .filter(m => m.event === OFEventType.Connection)
    .map(m => <OFEvent> {
      event: OFEventType.Message,
      id: m.id,
      message: new of10.Hello(),
    });

  return {sources, sinks: {openflowDriver: hello}};
};

/** Sends an OpenFlow 1.3 Hello message upon connection */
export const Hello13: OFComponent = sources => {
  const hello = sources.openflowDriver
    .filter(m => m.event === OFEventType.Connection)
    .map(m => <OFEvent> {
      event: OFEventType.Message,
      id: m.id,
      message: new of13.Hello(),
    });

  return {sources, sinks: {openflowDriver: hello}};
};
