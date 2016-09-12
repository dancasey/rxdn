import {OFComponent, OFDEvent} from "../drivers/openflow";
import {inspect} from "util";
const show = (item: any) => item ? item instanceof Object ? inspect(item, {colors: true, depth: 4}) : item : "";

/** Sends OpenFlow-related log messages to the console */
export const OFLog: OFComponent = sources => {
  const log = sources.openflowDriver.map(m => {
    switch (m.event) {
      case OFDEvent.Connection:
      case OFDEvent.Disconnection:
        return `${show(OFDEvent[m.event])} from ${show(m.id)}`;
      case OFDEvent.Error:
        return `${show(OFDEvent[m.event])} from ${show(m.id)}: ${show(m.error)}`;
      case OFDEvent.Message:
        return `${show(OFDEvent[m.event])} from ${show(m.id)}: ${show(m.message)}`;
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
