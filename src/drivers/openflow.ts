import * as OF from "@dancasey/node-openflow";
import {Driver, Collection} from "../interfaces";
import {createServer, Socket} from "net";
import {Observable, Observer} from "rxjs";

export enum OFEventType {
  Connection,
  Disconnection,
  Error,
  Message,
}

export type OFEvent =
  {id: string, event: OFEventType.Connection} |
  {id: string, event: OFEventType.Disconnection} |
  {id: string, event: OFEventType.Error, error: Error} |
  {id: string, event: OFEventType.Message, message: OF.OpenFlowMessage};

export interface OFCollection extends Collection {
  openflowDriver: Observable<OFEvent>;
}

export interface OFComponent {
  (sources: OFCollection): {sources: OFCollection, sinks: OFCollection};
}

export interface OFOptions {
  port?: number;
  host?: string;
  debug?: boolean;
}

const defaultOptions: OFOptions = {
  port: 6653,
  host: "localhost",
  debug: false,
};

const decodeBuffer = (id: string, observer: Observer<OFEvent>, buffer: Buffer) => {
  function decodeEach(buf: Buffer) {
    // check minimum length
    if (buf.length < 8) {
      observer.next({
        id,
        event: OFEventType.Error,
        error: new Error(`decodeEach buffer length ${buf.length}`),
      });
      return;
    }
    // Read header (xid not needed)
    let version: number;
    let type: number;
    let length: number;
    version = buf.readUInt8(0);
    type = buf.readUInt8(1);
    length = buf.readUInt16BE(2);

    // check length
    if (buf.length < length) {
      observer.next({
        id,
        event: OFEventType.Error,
        error: new Error(`decodeEach buffer length ${buf.length} < ${length}`),
      });
      return;
    }

    // check version
    let messages: any[];
    if (version === OF.of10.OFP_VERSION) {
      messages = OF.of10.messagesByIndex;
    } else if (version === OF.of13.OFP_VERSION) {
      messages = OF.of13.messagesByIndex;
    } else {
      observer.next({
        id,
        event: OFEventType.Error,
        error: new RangeError(`Unsupported OpenFlow version ${version}`),
      });
      return;
    }

    // try decode
    try {
      let message = messages[type].decode(buf.slice(0, length));
      observer.next({
        id,
        event: OFEventType.Message,
        message,
      });
    } catch (error) {
      observer.next({
        id,
        event: OFEventType.Error,
        error: new RangeError(`Unable to decode buffer: ${error}`),
      });
    }

    // decode again if there is more
    if (buf.length > length) {
      setImmediate(() => decodeEach(buf.slice(length)));
    }

  }
  decodeEach(buffer);
};

/**
 * OpenFlow driver
 * @param {OFOptions} [options=defaultOptions] Server options for net.Server
 * @return {Driver<OpenFlow, OpenFlow>} openFlowDriver
 */
export function makeOpenFlowDriver(options = defaultOptions) {
  const sockets: Map<string, Socket> = new Map();
  const server = createServer();

  const openFlowDriver: Driver<OFEvent, OFEvent> = sink => {
    // Send incoming messages to encoder; pause readable side when writable is overwhelmed
    sink.subscribe({
      next: msg => {
        let socket = sockets.get(msg.id);
        if (!socket) {
          if (options.debug) {
            console.error(`No matching socket found: ${msg.id}`);
          }
          return;
        }
        if (msg.event === OFEventType.Message) {
          let buffer: Buffer;
          try {
            buffer = msg.message.encode();
          } catch (error) {
            if (options.debug) {
              console.error(`Unable to encode message ${msg.message.name}`);
            }
            return;
          }
          let ok = socket.write(buffer);
          if (!ok) {
            socket.pause();
            socket.once("drain", socket.resume);
          }
        }
      },
      error: err => {
        if (options.debug) {
          console.error(`Error from sink, closing: ${err}`);
        }
        server.close();
      },
      complete: () => server.close(),
    });

    // Decode incoming data and send to observer
    return new Observable<OFEvent>((observer: Observer<OFEvent>) => {
      server.listen({port: options.port, host: options.host});
      server.on("connection", (socket: Socket) => {
        // create string id for storing socket in map
        const id = `${socket.remoteAddress}:${socket.remotePort}`;

        // Tell the observer about the new connection
        setImmediate(() => observer.next({event: OFEventType.Connection, id}));

        // Decode messages and send to observer
        socket.on("data", data => setImmediate(() => decodeBuffer(id, observer, data)));

        // Set up listeners for end, error
        socket.on("end", () => {
          setImmediate(() => observer.next({event: OFEventType.Disconnection, id}));
          sockets.delete(id);
        });
        socket.on("error", (error: Error) => setImmediate(() => observer.next({event: OFEventType.Error, id, error})));

        // Add socket to map
        sockets.set(id, socket);
      });
      server.on("close", () => observer.complete());
      server.on("error", (error: Error) => observer.error(error));
    }).share();
  };
  return openFlowDriver;
};
