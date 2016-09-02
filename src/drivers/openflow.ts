/**
 * OpenFlow driver
 */

import {OpenFlowMessage, decode} from "node-openflow";
import {Driver} from "../interfaces";
import {createServer, Socket, ListenOptions} from "net";
import {Observable, Observer} from "rxjs";


export enum OFDEvent {
  Connection,
  Disconnection,
  Error,
  Message
}

/**
 * The Object type that is returned in an Observable from openFlowDriver to main
 * @typedef {Object}
 * @param {number} event Enumerated event type
 * @param {string} id Socket id
 * @param {OpenFlowMessage} [message] The decoded message received
 * @param {Error} [error] The error
 */
export interface OFDSource {
  event: OFDEvent;
  id: string;
  message?: OpenFlowMessage;
  error?: Error;
}

/**
 * The Object type that is returned in an Observable from main to openFlowDriver
 * @typedef {Object}
 * @param {string} id
 * @param {OpenFlowMessage} message Message to send
 */
export interface OFDSink {
  id: string;
  message: OpenFlowMessage;
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
  const source = new Observable<OFDSource>((observer: Observer<OFDSource>) => {
    server.listen(options);
    server.on("connection", (socket: Socket) => {
      // Add socket to map
      let id = socketId(socket);
      sockets.set(id, socket);
      // Tell the observer about the new connection
      observer.next({event: OFDEvent.Connection, id});

      // Set up listeners on the socket
      socket.on("close", () => {
        observer.next({event: OFDEvent.Disconnection, id});
        sockets.delete(id);
      });
      socket.on("end", () => {
        observer.next({event: OFDEvent.Disconnection, id});
        sockets.delete(id);
      });
      socket.on("error", (error: Error) => observer.next({event: OFDEvent.Error, id, error}));
      socket.on("data", (buffer: Buffer) => {
        // Try to decode the buffer into an OpenFlowMessage
        try {
          let message = decode(buffer);
          observer.next({event: OFDEvent.Message, id, message});
        } catch (error) {
          observer.next({event: OFDEvent.Error, id, error});
        }
      });

    });
    server.on("close", () => observer.complete());
    server.on("error", (error: Error) => observer.error(error));
  }).share();

  const openFlowDriver: Driver<OFDSink, OFDSource> = (sink) => {
    // Send outgoing message
    let buffer: Buffer;
    if (sink) {
      sink.subscribe({
        next: outgoing => {
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
        },
        error: (err) => server.close(),
        complete: () => server.close(),
      });
    } else {
      throw new Error("openFlowDriver: No sink given");
    }
    return source;
  };
  return openFlowDriver;
};
