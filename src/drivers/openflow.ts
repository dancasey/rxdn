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

class Codec extends Transform {
  constructor(private id: string, private source: Observer<OFEvent>, private sink: Observable<OFEvent>) {
    super({objectMode: true});
    this.sink.filter(ev => ev.id === this.id).subscribe({
      next: outgoing => {
        if (outgoing.event === OFEventType.Message) {
          this.push(outgoing.message);
        }
      },
      error: err => this.emit("error", err),
      complete: () => this.push(null),
    });
  }
  public _transform(chunk: any, encoding: string, cb: (err?: Error | null, res?: any) => any) {
    this.source.next({
      event: OFEventType.Message,
      id: this.id,
      message: chunk,
    });
    setImmediate(cb);
  }
  public _flush(cb: (err?: Error | null, res?: any) => any) {
    cb();
  }
}

/**
 * OpenFlow driver
 * @param {ListenOptions} [options=defaultOptions] Server options for net.Server
 * @return {Driver<OpenFlow, OpenFlow>} openFlowDriver
 */
export function makeOpenFlowDriver(options = defaultOptions) {
  const sockets: Map<string, {socket: Socket, decoder: Transform, encoder: Transform}> = new Map();
  const server = createServer();

  const openFlowDriver: Driver<OFEvent, OFEvent> = sink => {
    // Decode incoming data and send to observer
    return new Observable<OFEvent>((observer: Observer<OFEvent>) => {
      server.listen(options);
      server.on("connection", (socket: Socket) => {
        // Make socket pipe into decoder
        const decodeStream = new OF.DecodeStream();
        const decoder = socket.pipe(decodeStream);

        // Forward errors to observable
        decoder.on("error", (error: Error) =>
          setImmediate(() => observer.next({event: OFEventType.Error, id, error})));

        // Make encoder pipe into socket
        const id = `${socket.remoteAddress}:${socket.remotePort}`;
        const encoder = new OF.EncodeStream();
        encoder.pipe(socket);

        // Pipe data
        const codec = new Codec(id, observer, sink);
        decoder.pipe(codec).pipe(encoder);

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
  };
  return openFlowDriver;
};
