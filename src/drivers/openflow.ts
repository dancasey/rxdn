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

  // Decode incoming data and send to observer
  const source = new Observable<OFEvent>((observer: Observer<OFEvent>) => {
    server.listen(options);
    server.on("connection", (socket: Socket) => {
      // Make socket pipe into decoder
      const decodeStream = new OF.DecodeStream();
      const decoder = socket.pipe(decodeStream);

      // Set up listeners on decoder to forward to observer
      decoder.on("data", (message: OF.OpenFlowMessage) =>
        setImmediate(() => observer.next({event: OFEventType.Message, id, message})));
      decoder.on("error", (error: Error) =>
        setImmediate(() => observer.next({event: OFEventType.Error, id, error})));

      // Make encoder pipe into socket
      const id = `${socket.remoteAddress}:${socket.remotePort}`;
      const encoder = new OF.EncodeStream();
      encoder.pipe(socket);

      // Tell the observer about the new connection
      setImmediate(() => observer.next({event: OFEventType.Connection, id}));

      // Set up listeners for end, error
      socket.on("end", () => {
        setImmediate(() => observer.next({event: OFEventType.Disconnection, id}));
        socket.unpipe();
        encoder.unpipe();
        sockets.delete(id);
      });
      socket.on("error", (error: Error) =>
        setImmediate(() => observer.next({event: OFEventType.Error, id, error})));

      // Add socket and encoder to `sockets` map
      sockets.set(id, {socket, decoder, encoder});
    });
    server.on("close", () => observer.complete());
    server.on("error", (error: Error) => observer.error(error));
  }).share();

  const openFlowDriver: Driver<OFEvent, OFEvent> = sink => {
    // Send outgoing message
    sink.subscribe({
      next: outgoing => {
        // Ignore anything that is not type `Message`
        if (outgoing.event === OFEventType.Message) {
          // Get the socket
          const socket = sockets.get(outgoing.id);
          if (!socket) {
            console.error(`openFlowDriver: No socket ${outgoing.id}`);
            return;
          }
          let ok = socket.encoder.write(outgoing.message);
          // If not `ok`, then it's buffering; pause readable side until `drain`
          if (!ok) {
            socket.decoder.pause();
            socket.encoder.once("drain", () => socket.decoder.resume());
          }
        }
      },
      error: (err) => server.close(),
      complete: () => server.close(),
    });
    return source;
  };
  return openFlowDriver;
};
