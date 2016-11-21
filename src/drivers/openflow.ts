import * as OF from "@dancasey/node-openflow";
import {Driver, Collection} from "../interfaces";
import {createServer, Socket, ListenOptions} from "net";
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
  const sockets: Map<string, Socket> = new Map();
  const server = createServer();
  const source = new Observable<OFEvent>((observer: Observer<OFEvent>) => {
    server.listen(options);
    server.on("connection", (socket: Socket) => {
      // Add socket to map
      const id = `${socket.remoteAddress}:${socket.remotePort}`;
      sockets.set(id, socket);

      // Tell the observer about the new connection
      observer.next({event: OFEventType.Connection, id});

      // Set up listeners on the socket
      socket.on("close", () => {
        observer.next({event: OFEventType.Disconnection, id});
        sockets.delete(id);
      });
      socket.on("end", () => {
        observer.next({event: OFEventType.Disconnection, id});
        sockets.delete(id);
      });
      socket.on("error", (error: Error) => observer.next({event: OFEventType.Error, id, error}));
      let decoder = OF.decodeObservable(Observable.fromEvent(socket, "data"));
      decoder.subscribe(result => {
        if (result.type === OF.DecodeType.Error) {
          observer.next({
            event: OFEventType.Error,
            id,
            error: result.error,
          });
        } else if (result.type === OF.DecodeType.Message) {
          observer.next({
            event: OFEventType.Message,
            id,
            message: result.message,
          });
        } else {
          observer.next({
            event: OFEventType.Error,
            id,
            error: new Error("Unknown decoding error"),
          });
        }
      });

    });
    server.on("close", () => observer.complete());
    server.on("error", (error: Error) => observer.error(error));
  }).share();

  const openFlowDriver: Driver<OFEvent, OFEvent> = sink => {
    // Send outgoing message
    let buffer: Buffer;
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
          // Try to encode the message
          try {
            buffer = outgoing.message.encode();
            // console.log(`openFlowDriver: sending ${outgoing.message.name} to ${outgoing.id}`);
            socket.write(buffer);
          } catch (error) {
            console.error(`openFlowDriver: Could not encode ${outgoing.message.name}: ${error}`);
            console.error(error.stack);
          }
        } else {
          console.error(`openFlowDriver: non-message ${outgoing.event}`);
        }
      },
      error: (err) => server.close(),
      complete: () => server.close(),
    });
    return source;
  };
  return openFlowDriver;
};
