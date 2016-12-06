import * as OF from "@dancasey/node-openflow";
import {Driver, Collection} from "../interfaces";
import {createServer, Socket, ListenOptions} from "net";
import {Observable, Observer} from "rxjs";
import {Transform} from "stream";

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

const defaultOptions: ListenOptions = {
  port: 6653,
  host: "localhost",
};

/**
 * OpenFlow driver
 * @param {ListenOptions} [options=defaultOptions] Server options for net.Server
 * @return {Driver<OpenFlow, OpenFlow>} openFlowDriver
 */
export function makeOpenFlowDriver(options = defaultOptions) {
  const sockets: Map<string, {socket: Socket, decoder: Transform, encoder: Transform}> = new Map();
  const server = createServer();

  const openFlowDriver: Driver<OFEvent, OFEvent> = sink => {
    // Send incoming messages to encoder
    sink.subscribe({
      next: msg => {
        let socketTuple = sockets.get(msg.id);
        if (!socketTuple) {
          console.error(`No matching socket found: ${msg.id}`);
          return;
        }
        let {encoder, decoder} = socketTuple;
        if (msg.event === OFEventType.Message) {
          let ok = encoder.write(msg.message);
          if (!ok) {
            decoder.pause();
            encoder.once("drain", decoder.resume);
          }
        }
      },
      error: err => {
        console.error(`Error from sink, closing: ${err}`);
        server.close();
      },
      complete: () => server.close(),
    });

    // Decode incoming data and send to observer
    return new Observable<OFEvent>((observer: Observer<OFEvent>) => {
      server.listen(options);
      server.on("connection", (socket: Socket) => {
        const id = `${socket.remoteAddress}:${socket.remotePort}`;

        // Make socket pipe into decoder
        const decodeStream = new OF.DecodeStream();
        const decoder = socket.pipe(decodeStream);

        // Forward errors to observable
        decoder.on("error", (error: Error) =>
          setImmediate(() => observer.next({event: OFEventType.Error, id, error})));

        // Make encoder pipe into socket
        const encoder = new OF.EncodeStream();
        encoder.pipe(socket);

        // Send messages from decoder into observer
        decoder.on("data", (message: OF.OpenFlowMessage) =>
          setImmediate(() => observer.next({event: OFEventType.Message, id, message})));

        // Tell the observer about the new connection
        setImmediate(() => observer.next({event: OFEventType.Connection, id}));

        // Set up listeners for end, error
        decoder.on("end", () => {
          setImmediate(() => observer.next({event: OFEventType.Disconnection, id}));
          socket.unpipe(decoder);
          encoder.unpipe(socket);
          sockets.delete(id);
        });

        // Add socket and encoder to `sockets` map
        sockets.set(id, {socket, decoder, encoder});
      });
      server.on("close", () => observer.complete());
      server.on("error", (error: Error) => observer.error(error));
    }).share();
  };
  return openFlowDriver;
};
