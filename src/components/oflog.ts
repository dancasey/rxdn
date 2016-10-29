import {OFCollection, OFEventType} from "../drivers/openflow";
import {Component} from "../interfaces";
import {inspect} from "util";

const show = (item: any) => item instanceof Object ? inspect(item, {colors: true, depth: 4}) : item;

/** Sends OpenFlow-related log messages to the console */
export const OFLog: Component = (sources: OFCollection) => {
  const log = sources.openflowDriver.map(m => {
    switch (m.event) {
      case OFEventType.Connection:
      case OFEventType.Disconnection:
        return `${show(OFEventType[m.event])} from ${show(m.id)}`;
      case OFEventType.Error:
        return `${show(OFEventType[m.event])} from ${show(m.id)}: ${show(m.error)}`;
      case OFEventType.Message:
        // return `${show(OFEventType[m.event])} from ${show(m.id)}: ${show(m.message)}`;
        return `${show(OFEventType[m.event])} from ${show(m.id)}: ${show(m.message.name)}`;
      default:
        return `Unknown Event ${show(m)}`;
    }
  });
  return {sources, sinks: {consoleDriver: log}};
};
