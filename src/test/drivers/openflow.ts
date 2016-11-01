/**
 * Test `drivers/openflow.ts`
 * Run with `npm test`
 */
import test, {ContextualCallbackTestContext} from "ava";
import * as net from "net";
import * as rxdn from "../../rxdn";
import {Observable} from "rxjs";
import {readFileSync} from "fs";
import {join} from "path";

// import {inspect} from "util";
// const insp = (obj: any) => inspect(obj, {colors: true, depth: 4});

const identityDriver: rxdn.Driver<any, any> = (sinks) => sinks;

const CLIENT_DELAY = 0; // setTimeout delay for clients
const ERROR_TEST_PORT = 1234;
const DECODE_TEST_PORT = ERROR_TEST_PORT + 1;
const MDECODE_TEST_PORT = DECODE_TEST_PORT + 1;
const ENCODE_TEST_PORT = MDECODE_TEST_PORT + 1;
const PI_TEST_PORT = ENCODE_TEST_PORT + 1;

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

test.cb("exposes errors", t => {
  t.plan(2);
  const main: rxdn.OFComponent = sources => {
    const err = sources.openflowDriver
      .filter(m => m.event === rxdn.OFEventType.Error)
      .map((m: {id: string, event: rxdn.OFEventType.Error, error: Error}) => {
        t.is(m.event, rxdn.OFEventType.Error);
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
  setTimeout(errorClient, CLIENT_DELAY);
});

/**
 * Decode test
 */

// set up a client to push data causing proper message decode
function decodeClient() {
  let client = net.connect({port: DECODE_TEST_PORT}, () => {
    client.write(new rxdn.of13.Hello().encode());
    client.end();
  });
}

test.cb("decodes messages", t => {
  t.plan(1);
  const main: rxdn.OFComponent = sources => {
    const err = sources.openflowDriver
      .filter(e => e.event === rxdn.OFEventType.Error)
      .map(e => t.fail());
    const msg = sources.openflowDriver
      .filter(e => e.event === rxdn.OFEventType.Message)
      .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) => {
        t.deepEqual(m.message, new rxdn.of13.Hello());
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
  setTimeout(decodeClient, CLIENT_DELAY);
});

/**
 * Decode test
 */

// set up a client to push data causing proper message decode
function multiDecodeClient() {
  let client = net.connect({port: MDECODE_TEST_PORT}, () => {
    const h = new rxdn.of10.Hello();
    const e = new rxdn.of10.EchoRequest();
    const buffer = Buffer.concat([h.encode(), e.encode()]);
    client.write(buffer);
    client.end();
  });
}
test.cb("decodes multiple messages from single buffer", t => {
  t.plan(2);
  const main: rxdn.OFComponent = sources => {
    const err = sources.openflowDriver
      .filter(e => e.event === rxdn.OFEventType.Error)
      .map(e => t.fail());
    const msg = sources.openflowDriver
      .filter(e => e.event === rxdn.OFEventType.Message)
      .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) => {
        if (m.message instanceof rxdn.of10.Hello) {
          t.deepEqual(m.message, new rxdn.of10.Hello());
        } else if (m.message instanceof rxdn.of10.EchoRequest) {
          t.deepEqual(m.message, new rxdn.of10.EchoRequest());
          t.end();
        }
      });
    const sinks = {
      openflowDriver: sources.openflowDriver.filter(() => false),
      subscribeDriver: err.merge(msg),
    };
    return {sinks, sources};
  };
  const drivers: rxdn.Drivers = {
    openflowDriver: rxdn.makeOpenFlowDriver({port: MDECODE_TEST_PORT}),
    subscribeDriver: identityDriver,
  };
  rxdn.run(main, drivers);
  setTimeout(multiDecodeClient, CLIENT_DELAY);
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
      t.deepEqual(decoded, new rxdn.of13.Hello());
      t.end();
    });
  });
}

test.cb("encodes messages", t => {
  t.plan(1);
  const main: rxdn.OFComponent = sources => {
    const sinks = {
      openflowDriver: sources.openflowDriver
        .filter(e => e.event === rxdn.OFEventType.Connection)
        .map(e => ({
          event: rxdn.OFEventType.Message,
          id: e.id,
          message: new rxdn.of13.Hello(),
        })) as Observable<rxdn.OFEvent>,
    };
    return {sinks, sources};
  };
  const drivers: rxdn.Drivers = {
    openflowDriver: rxdn.makeOpenFlowDriver({port: ENCODE_TEST_PORT}),
  };
  rxdn.run(main, drivers);
  setTimeout(encodeClient, CLIENT_DELAY, t);
});

/**
 * Lots of PacketIn Messages (71)
 *
 * Taken from capture of cbench running in throughput mode (-t).
 * xid 234 (0X0ea) is the first message,
 * xid 304 (0x130) is the last message.
 */
const piPath = join(__dirname, "../../../test_assets/packetsIn.txt");
const packetsIn = Buffer.from(readFileSync(piPath, "ascii"), "hex");

// set up a client
function piClient() {
  let client = net.connect({port: PI_TEST_PORT}, () => {
    client.write(packetsIn);
    client.end();
  });
}

test.cb("decodes many concatenated PacketIn messages", t => {
  t.plan(71);
  const main: rxdn.OFComponent = sources => {
    const err = sources.openflowDriver
      .filter(e => e.event === rxdn.OFEventType.Error)
      .map(e => t.fail());
    const msg = sources.openflowDriver
      .filter(e => e.event === rxdn.OFEventType.Message)
      .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) => {
        // console.log(`pi xid ${m.message.message.header.xid}`);
        t.true(m.message.name === "ofp_packet_in");
        // if (m.message.message.header.xid % 10 === 0) {
        //   console.log(insp(m));
        // }
        if (m.message.message.header.xid === 0x130) {
          t.end();
        }
      });
    const sinks = {
      openflowDriver: sources.openflowDriver.filter(() => false),
      subscribeDriver: err.merge(msg),
    };
    return {sinks, sources};
  };
  const drivers: rxdn.Drivers = {
    openflowDriver: rxdn.makeOpenFlowDriver({port: PI_TEST_PORT}),
    subscribeDriver: identityDriver,
  };
  rxdn.run(main, drivers);
  setTimeout(piClient, CLIENT_DELAY);
});
