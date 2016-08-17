/**
 * Used to run one-off tests, rather than `test.ts` which
 * is a suite of tests that run automatically with `npm test`
 */
import * as rxdn from "./rxdn";
import {Observable} from "rxjs";

interface Sources extends rxdn.ObservableCollection {
  switchDriver: rxdn.switchSource;
}

const main: rxdn.MainFn = (sources: Sources) => {
  const [messages, errors] = <[Observable<rxdn.MessageStream>, Observable<rxdn.ErrorStream>]> sources.switchDriver
    .partition(x => "message" in x);
  const messageConsole = messages.map(m => `${m.message.name}\t${m.socket.address}`);
  const errorConsole = errors.map(e => `Error at ${e.function}\t${e.error}`);
  const console = messageConsole.merge(errorConsole);
  return {console};
};

const drivers: rxdn.Drivers = {
  switchDriver: rxdn.makeSwitchDriver(),
  console: rxdn.consoleDriver,
};

rxdn.run(main, drivers);
