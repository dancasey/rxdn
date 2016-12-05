/* Simple responder for cbench benchmarking tests */

import * as rxdn from "../rxdn";

// cbench emulates 16 switches by deault; increase listener limit to avoid
// extra error messages being printed (the limit is not enforced; it only warns).
import {EventEmitter} from "events";
EventEmitter.defaultMaxListeners = 30;

const simpleFlowMod: rxdn.OFComponent = sources => {
  const flowMods = sources.openflowDriver
    .filter(ev => ev.event === rxdn.OFEventType.Message && ev.message.name === "ofp_packet_in")
    .map(ev => {
      let fm = new rxdn.of10.FlowMod();
      fm.message.match.wildcardsVal = rxdn.of10.OFPFW_ALL;
      return <rxdn.OFEvent> {
        event: rxdn.OFEventType.Message,
        id: ev.id,
        message: fm,
      };
    });
  return {sources, sinks: {openflowDriver: flowMods}};
};

const main: rxdn.OFComponent = sources => {
  return <{sources: rxdn.OFCollection, sinks: rxdn.OFCollection}> rxdn.Compose([
    rxdn.Core10,
    simpleFlowMod,
  ], sources);
};

const drivers: rxdn.Drivers = {
  openflowDriver: rxdn.makeOpenFlowDriver({host: "0.0.0.0", port: 6633}),
};

rxdn.run(main, drivers);
