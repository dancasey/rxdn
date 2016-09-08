/**
 * Test `drivers/openflow.ts`
 * Run with `npm test`
 */
import test, {ContextualCallbackTestContext} from "ava";
import * as net from "net";
import * as rxdn from "../rxdn";
import {Observable} from "rxjs";

const identityDriver: rxdn.Driver<any, any> = (sinks) => sinks;

const CLIENT_DELAY = 100; // setTimeout delay for clients
const ERROR_TEST_PORT = 1234;
const DECODE_TEST_PORT = ERROR_TEST_PORT + 1;
const ENCODE_TEST_PORT = DECODE_TEST_PORT + 1;

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
setTimeout(errorClient, CLIENT_DELAY);

test.cb("exposes errors", t => {
  t.plan(2);
  const main: rxdn.OFComponent = sources => {
    const err = sources.openflowDriver
      .filter(m => m.event === rxdn.OFDEvent.Error)
      .map((m: rxdn.OFDError) => {
        t.is(m.event, rxdn.OFDEvent.Error);
        t.true(m.error instanceof Error);
        t.end();
        return null;
      });
    const sinks = {
      openflowDriver: sources.openflowDriver.filter(() => false),
      subscribeDriver: err,
    };
    return {sinks, sources};
  };
  const drivers: rxdn.Drivers = {
    openflowDriver: rxdn.makeOpenFlowDriver({port: ERROR_TEST_PORT}),
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
setTimeout(decodeClient, CLIENT_DELAY);

test.cb("decodes messages", t => {
  t.plan(1);
  const main: rxdn.OFComponent = sources => {
    const err = sources.openflowDriver
      .filter(e => e.event === rxdn.OFDEvent.Error)
      .map(e => t.fail());
    const msg = sources.openflowDriver
      .filter(e => e.event === rxdn.OFDEvent.Message)
      .map((m: rxdn.OFDMessage) => {
        t.deepEqual(m.message, new rxdn.Hello());
        t.end();
      });
    const sinks = {
      openflowDriver: sources.openflowDriver.filter(() => false),
      subscribeDriver: err.merge(msg),
    };
    return {sinks, sources};
  };
  const drivers: rxdn.Drivers = {
    openflowDriver: rxdn.makeOpenFlowDriver({port: DECODE_TEST_PORT}),
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
    client.on("data", (data: Buffer) => {
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
  const main: rxdn.OFComponent = sources => {
    const sinks = {
      openflowDriver: sources.openflowDriver
        .filter(e => e.event === rxdn.OFDEvent.Connection)
        .map(e => ({
          event: rxdn.OFDEvent.Message,
          id: e.id,
          message: new rxdn.Hello(),
        })) as Observable<rxdn.OpenFlow>,
    };
    return {sinks, sources};
  };
  const drivers: rxdn.Drivers = {
    openflowDriver: rxdn.makeOpenFlowDriver({port: ENCODE_TEST_PORT}),
  };
  rxdn.run(main, drivers);
  setTimeout(encodeClient, CLIENT_DELAY, t);
});
