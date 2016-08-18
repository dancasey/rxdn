/**
 * Test `drivers/switch.ts`
 * Run with `npm test`
 */
import test, {ContextualCallbackTestContext} from "ava";
import * as net from "net";
import * as rxdn from "../rxdn";
import {Observable} from "rxjs";

const identityDriver: rxdn.Driver<any, any> = (sinks) => sinks;

interface Sources extends rxdn.ObservableCollection {
  switchDriver: rxdn.switchSource;
}

const TEST_INCREMENT = 100; // separation in ms between tests
const ERROR_TEST_PORT = 1234;
const ERROR_TEST_WAIT = TEST_INCREMENT;
const DECODE_TEST_PORT = ERROR_TEST_PORT + 1;
const DECODE_TEST_WAIT = ERROR_TEST_WAIT + TEST_INCREMENT;
const ENCODE_TEST_PORT = DECODE_TEST_PORT + 1;
const ENCODE_TEST_WAIT = DECODE_TEST_WAIT + TEST_INCREMENT;

/**
 * Error test
 */

// set up a client to push data causing error on message decode
function errorClient() {
  let client = net.connect({port: ERROR_TEST_PORT}, () => {
    client.write(Buffer.from("hello"));
    client.end();
  });
}
setTimeout(errorClient, ERROR_TEST_WAIT);

test.cb("exposes errors", t => {
  t.plan(2);
  const main: rxdn.MainFn = (sources: Sources) => {
    const [messages, errors] = <[Observable<rxdn.MessageStream>, Observable<rxdn.ErrorStream>]> sources.switchDriver
      .partition(x => "message" in x);
    // check that there is an error as the sink
    const err = errors.map(e => {
      t.is(e.function, "decode");
      t.truthy(e.error instanceof Error);
      t.end();
    });
    // if there was a message, it's wrong
    const msg = messages.map(m => t.fail());
    return {
      switchDriver: Observable.never(),
      subscribeDriver: err.merge(msg),
    };
  };
  const drivers: rxdn.Drivers = {
    switchDriver: rxdn.makeSwitchDriver({port: ERROR_TEST_PORT}),
    subscribeDriver: identityDriver,
  };
  rxdn.run(main, drivers);
});

/**
 * Decode test
 */

// set up a client to push data causing proper message decode
function decodeClient() {
  let client = net.connect({port: DECODE_TEST_PORT}, () => {
    client.write(new rxdn.Hello().encode());
    client.end();
  });
}
setTimeout(decodeClient, DECODE_TEST_WAIT);

test.cb("decodes messages", t => {
  t.plan(1);
  const main: rxdn.MainFn = (sources: Sources) => {
    const [messages, errors] = <[Observable<rxdn.MessageStream>, Observable<rxdn.ErrorStream>]> sources.switchDriver
      .partition(x => "message" in x);
    // if there are errros, it's wrong
    const err = errors.map(e => t.fail());
    // check the message as the sink
    const msg = messages.map(m => {
      t.deepEqual(m.message, new rxdn.Hello());
      t.end();
    });
    return {
      switchDriver: Observable.never(),
      subscribeDriver: err.merge(msg),
    };
  };
  const drivers: rxdn.Drivers = {
    switchDriver: rxdn.makeSwitchDriver({port: DECODE_TEST_PORT}),
    subscribeDriver: identityDriver,
  };
  rxdn.run(main, drivers);
});

/**
 * Encode test
 */

// set up a client to push data causing proper message encode
function encodeClient(t: ContextualCallbackTestContext) {
  let client = net.connect({port: ENCODE_TEST_PORT}, () => {
    client.on("data", data => {
      let decoded: rxdn.OpenFlowMessage;
      try {
        decoded = rxdn.decode(data);
      } catch (error) {
        t.fail(error);
        return;
      }
      t.deepEqual(decoded, new rxdn.Hello());
      t.end();
    });
  });
}

test.cb("encodes messages", t => {
  t.plan(1);
  const main: rxdn.MainFn = (sources: Sources) => {
    if (!sources) {
      t.fail();
    }
    const output = sources.switchDriver;
      /**
       * left off here...
       */
    return {
      switchDriver: output,
    };
  };
  const drivers: rxdn.Drivers = {
    switchDriver: rxdn.makeSwitchDriver({port: ENCODE_TEST_PORT}),
  };
  rxdn.run(main, drivers);
  setTimeout(encodeClient, ENCODE_TEST_WAIT, t);
});
