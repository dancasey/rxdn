import * as rxdn from "../rxdn";
import {Observable} from "rxjs";

interface OFConsoleCollection extends rxdn.OFCollection {
  consoleDriver: Observable<string>;
}

/**
 * Example "hub" controller.
 * Run with `node dist/examples/hub.js`.
 */
const main: rxdn.OFComponent = src => {
  return <{sources: rxdn.OFCollection, sinks: OFConsoleCollection}> rxdn.Compose([
    rxdn.Core10,
    rxdn.Hub,
    rxdn.OFLog,
  ], src);
};

const drivers: rxdn.Drivers = {
  consoleDriver: rxdn.consoleDriver,
  openflowDriver: rxdn.makeOpenFlowDriver({host: "0.0.0.0", port: 6633}),
};

rxdn.run(main, drivers);
