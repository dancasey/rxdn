/**
 * Used to run one-off tests, rather than `test.ts` which
 * is a suite of tests that run automatically with `npm test`
 */
import * as rxdn from "./rxdn";
import {Observable} from "rxjs";

interface Sources extends rxdn.ObservableCollection {
  console: Observable<string>;
  switchDriver: Observable<rxdn.MessageStream>;
}

const main: rxdn.MainFn = (sources: Sources) => {
  const sink = sources.switchDriver
    .map(val => `Received a ${val.message.name}`);
  return {
    console: sink,
  };
};

const drivers: rxdn.Drivers = {
  switchDriver: rxdn.makeSwitchDriver(),
  console: rxdn.consoleDriver,
};

rxdn.run(main, drivers);
