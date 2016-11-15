/* Simple responder for cbench benchmarking tests */

import * as rxdn from "../rxdn";

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
