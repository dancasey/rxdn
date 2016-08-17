import {createRxServer} from "node-rx-server";
import {Socket, ListenOptions} from "net";
import {OpenFlowMessage, decode} from "node-openflow";
import {Driver} from "../interfaces";
import {Observable} from "rxjs";

const defaults: ListenOptions = {
  port: 6653,
  host: "localhost",
};

interface MessageStream {
  socket: Socket;
  message: OpenFlowMessage;
}

interface ErrorStream {
  function: string;
  error: Error;
}

type switchSource = Observable<MessageStream | ErrorStream>;

function makeSwitchDriver(options?: ListenOptions) {
  if (!options) {
    options = defaults;
  }

  // set up the server its source observable
  const server = createRxServer(options);
  const source: switchSource = server.map(connection => {
    const decodeOrError = connection.map(({socket, buffer}) => {
      let message: OpenFlowMessage;
      try {
        message = decode(buffer);
      } catch (error) {
        return ({function: "decode", error});
      }
      return {socket, message};
    });
    return decodeOrError;
  }).mergeAll();

  const switchDriver: Driver<MessageStream, MessageStream | ErrorStream> = function(sink) {
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

export {MessageStream, ErrorStream, switchSource, makeSwitchDriver};
