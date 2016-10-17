import * as OF from "@dancasey/node-openflow";
import {Driver, Collection} from "../interfaces";
import {createServer, Socket, ListenOptions} from "net";
import {Observable, Observer} from "rxjs";

export enum OFEventType {
  Connection,
  Disconnection,
  Error,
  Message
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

/** Generate an `id` string for a Socket */
export const socketId = (socket: Socket): string => {
  const address = socket.address();
  return `${address.address}:${address.port}`;
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
      let id = socketId(socket);
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
      socket.on("data", (buffer: Buffer) => {
        // Try to decode the buffer into an OpenFlowMessage
        try {
          let message = OF.decode(buffer);
          observer.next({event: OFEventType.Message, id, message});
        } catch (error) {
          observer.next({event: OFEventType.Error, id, error});
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
            socket.write(buffer);
          } catch (error) {
            console.error(`openFlowDriver: Could not encode: ${error}`);
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
