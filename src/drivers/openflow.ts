/**
 * OpenFlow driver
 */

import {OpenFlowMessage, decode} from "node-openflow";
import {Driver, ObservableCollection} from "../interfaces";
import {createServer, Socket, ListenOptions} from "net";
import {Observable, Observer} from "rxjs";


export enum OFEvent {
  Connection,
  Disconnection,
  Error,
  Message
}

export type OpenFlow =
  {id: string, event: OFEvent.Connection} |
  {id: string, event: OFEvent.Disconnection} |
  {id: string, event: OFEvent.Error, error: Error} |
  {id: string, event: OFEvent.Message, message: OpenFlowMessage};

export interface OFCollection extends ObservableCollection {
  openflowDriver: Observable<OpenFlow>;
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
 * @return {function} openFlowDriver
 */
export function makeOpenFlowDriver(options = defaultOptions) {
  const sockets: Map<string, Socket> = new Map();
  const server = createServer();
  const source = new Observable<OpenFlow>((observer: Observer<OpenFlow>) => {
    server.listen(options);
    server.on("connection", (socket: Socket) => {
      // Add socket to map
      let id = socketId(socket);
      sockets.set(id, socket);
      // Tell the observer about the new connection
      observer.next({event: OFEvent.Connection, id});

      // Set up listeners on the socket
      socket.on("close", () => {
        observer.next({event: OFEvent.Disconnection, id});
        sockets.delete(id);
      });
      socket.on("end", () => {
        observer.next({event: OFEvent.Disconnection, id});
        sockets.delete(id);
      });
      socket.on("error", (error: Error) => observer.next({event: OFEvent.Error, id, error}));
      socket.on("data", (buffer: Buffer) => {
        // Try to decode the buffer into an OpenFlowMessage
        try {
          let message = decode(buffer);
          observer.next({event: OFEvent.Message, id, message});
        } catch (error) {
          observer.next({event: OFEvent.Error, id, error});
        }
      });

    });
    server.on("close", () => observer.complete());
    server.on("error", (error: Error) => observer.error(error));
  }).share();

  const openFlowDriver: Driver<OpenFlow, OpenFlow> = sink => {
    // Send outgoing message
    let buffer: Buffer;
    sink.subscribe({
      next: outgoing => {
        // Ignore anything that is not type `Message`
        if (outgoing.event === OFEvent.Message) {
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
