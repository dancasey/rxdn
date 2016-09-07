/* tslint:disable:no-console */
/**
 * Used to run one-off tests, rather than the `test` directory which
 * is a suite of tests that run automatically with `npm test`
 */
import * as rxdn from "./rxdn";
import {Observable} from "rxjs";

import {inspect} from "util";
const insp = (obj: any) => inspect(obj, {colors: true, depth: 4});
const show = (item: any) => item ? item instanceof Object ? insp(item) : item : "";

const main: rxdn.Component = (sources: {openflowDriver: Observable<rxdn.OFDSource>}) => {
  // Print some debug info to the console
  const consoleDriver = sources.openflowDriver
    .map(({event, id, message, error}) => `${rxdn.OFDEvent[event]} ${id} ${show(message)} ${show(error)}`);

  const core = rxdn.Core(sources);
  const sinks = Object.assign({}, {consoleDriver}, core.sinks);

  return {
    sources: core.sources,
    sinks,
  };
};

const drivers: rxdn.Drivers = {
  consoleDriver: rxdn.consoleDriver,
  openflowDriver: rxdn.makeOpenFlowDriver({host: "0.0.0.0", port: 6653}),
};

rxdn.run(main, drivers);
