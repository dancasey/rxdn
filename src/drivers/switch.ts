import {createRxServer} from "node-rx-server";
import {Socket, ListenOptions} from "net";
import {OpenFlowMessage, decode} from "node-openflow";
import {Driver} from "../interfaces";
import {Observable} from "rxjs";

const defaults: ListenOptions = {
  port: 6653,
  host: "localhost",
};

export interface SwitchInput {
  socket: Socket;
  message: OpenFlowMessage;
}

export enum SwitchOutputType {
  error, message, connection, disconnection
}

export interface SwitchOutput {
  type: SwitchOutputType;
  socket?: Socket;
  message?: OpenFlowMessage;
  error?: Error;
}

export function makeSwitchDriver(options?: ListenOptions) {
  if (!options) {
    options = defaults;
  }

  // set up the server as main's source observable
  const server = createRxServer(options);
  const connections: Observable<SwitchOutput> = server
    .map(connection => ({type: SwitchOutputType.connection, socket: connection.socket}));
  const data: SwitchOutput = server
    .map(connection => connection.data)
    .map(buffer => {
      let message: OpenFlowMessage;
      try {
        message = decode(buffer);
      } catch (error) {
        return ({type: "error", socket, error});
      }
      return {type: "message", socket, message};
    });
  });

  const switchDriver: Driver<SwitchInput, SwitchOutput> = function(sink) {
    // Encode and write sink messages to its socket
    if (sink) {
      sink
        .map(({socket, message}) => ({socket, buffer: (message as OpenFlowMessage).encode()}))
        .catch((err, obs) => {
          console.error(`Could not encode: ${err}`);
          return Observable.empty();
        })
        .subscribe(irxs => irxs.socket.write(irxs.buffer));
    }
    // Return decoded source messages
    return source;
  };
  return switchDriver;
};
