import {OFComponent, OFEvent} from "../drivers/openflow";
import {inspect} from "util";
const show = (item: any) => item ? item instanceof Object ? inspect(item, {colors: true, depth: 4}) : item : "";

/** Sends OpenFlow-related log messages to the console */
export const OFLog: OFComponent = sources => {
  const log = sources.openflowDriver.map(m => {
    switch (m.event) {
      case OFEvent.Connection:
      case OFEvent.Disconnection:
        return `${show(OFEvent[m.event])} from ${show(m.id)}`;
      case OFEvent.Error:
        return `${show(OFEvent[m.event])} from ${show(m.id)}: ${show(m.error)}`;
      case OFEvent.Message:
        return `${show(OFEvent[m.event])} from ${show(m.id)}: ${show(m.message)}`;
      default:
        return `Unknown Event ${show(m)}`;
    }
  });

  return {
    sources,
    sinks: {
      consoleDriver: log,
      openflowDriver: sources.openflowDriver,
    },
  };
};
