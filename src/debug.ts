/**
 * Used to run one-off tests, rather than the `test` directory which
 * is a suite of tests that run automatically with `npm test`
 */
import * as rxdn from "./rxdn";
import {Observable} from "rxjs";

interface OFConsoleCollection extends rxdn.OFCollection {
  consoleDriver: Observable<string>;
}

const main: rxdn.OFComponent = src => {
  return <{sources: rxdn.OFCollection, sinks: OFConsoleCollection}> rxdn.Compose([rxdn.Core, rxdn.OFLog], src);
};

const drivers: rxdn.Drivers = {
  consoleDriver: rxdn.consoleDriver,
  openflowDriver: rxdn.makeOpenFlowDriver({host: "0.0.0.0", port: 6653}),
};

rxdn.run(main, drivers);
