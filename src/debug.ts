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

interface Sources extends rxdn.ObservableCollection {
  openflowDriver: Observable<rxdn.OFDSource>;
}

const main: rxdn.MainFn = (sources: Sources) => {
  // Print some debug info to the console
  const consoleDriver = sources.openflowDriver
    .map(({event, id, message, error}) => `${rxdn.OFDEvent[event]} ${id} ${show(message)} ${show(error)}`);

  // Run Core component
  const {openflowDriver} = rxdn.Core(sources);

  // Send a `Hello` message upon connection
  // const openflowDriver: Observable<rxdn.OFDSink> = sources.openflowDriver
  //   .filter(ev => ev.event === rxdn.OFDEvent.Connection)
  //   .do(ev => console.log(`I see a connection ${insp(ev)}`))
  //   .map(ev => ({id: ev.id, message: new rxdn.Hello()}));

  return {consoleDriver, openflowDriver};
};

const drivers: rxdn.Drivers = {
  consoleDriver: rxdn.consoleDriver,
  openflowDriver: rxdn.makeOpenFlowDriver({host: "0.0.0.0", port: 6653}),
};

rxdn.run(main, drivers);
