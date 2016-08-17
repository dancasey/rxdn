/**
 * Test `drivers/switch.ts`
 * Run with `npm test`
 */
import test from "ava";
import * as net from "net";
import * as rxdn from "../rxdn";
import {Observable} from "rxjs";

interface Sources extends rxdn.ObservableCollection {
  switchDriver: rxdn.switchSource;
}

const TEST_INCREMENT = 200; // separation in ms between tests
const ERROR_TEST_PORT = 1234;
const ERROR_TEST_WAIT = TEST_INCREMENT;
const MSG_TEST_PORT = 1235;
const MSG_TEST_WAIT = ERROR_TEST_WAIT + TEST_INCREMENT;

// set up a client to push data causing error on message decode
function errorClient() {
  let client = net.connect({port: ERROR_TEST_PORT}, () => {
    client.write(Buffer.from("hello"));
    client.end();
  });
}
setTimeout(errorClient, ERROR_TEST_WAIT);

// set up a client to push data causing proper message decode
function msgClient() {
  let client = net.connect({port: MSG_TEST_PORT}, () => {
    client.write(new rxdn.Hello().encode());
    client.end();
  });
}
setTimeout(msgClient, MSG_TEST_WAIT);

test("exposes errors", t => {
  const main: rxdn.MainFn = (sources: Sources) => {
    const [messages, errors] = <[Observable<rxdn.MessageStream>, Observable<rxdn.ErrorStream>]> sources.switchDriver
      .partition(x => "message" in x);
    errors.map(e => {
      t.is(e.function, "decode");
      t.truthy(e.error instanceof Error);
    });
    messages.map(m => t.fail());
    return {switchDriver: Observable.never()};
  };
  const drivers: rxdn.Drivers = {switchDriver: rxdn.makeSwitchDriver({port: ERROR_TEST_PORT})};
  rxdn.run(main, drivers);
});

test("decodes messages", t => {
  const main: rxdn.MainFn = (sources: Sources) => {
    const [messages, errors] = <[Observable<rxdn.MessageStream>, Observable<rxdn.ErrorStream>]> sources.switchDriver
      .partition(x => "message" in x);
    errors.map(e => t.fail());
    messages.map(m => {
      t.deepEqual(m.message, new rxdn.Hello());
    });
    return {switchDriver: Observable.never()};
  };
  const drivers: rxdn.Drivers = {switchDriver: rxdn.makeSwitchDriver({port: MSG_TEST_PORT})};
  rxdn.run(main, drivers);
});
