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

function makeSwitchDriver(options?: ListenOptions) {
  if (!options) {
    options = defaults;
  }
  const server = createRxServer(options);
  const source = server
    .map(obs => obs.map(({socket, buffer}) => ({socket, message: decode(buffer)})))
    .catch(({socket, buffer}));
  // const source$: Observable<MessageStream> = server
  //   .mergeAll()
  //   .map(({socket, buffer}) => ({socket, message: decode(buffer)}))

  const switchDriver: Driver<MessageStream, MessageStream> = function(sink$) {
    // Encode and write sink messages to its socket
    if (sink$) {
      sink$
        .map(({socket, message}) => ({socket, buffer: message.encode()}))
        .subscribe(irxs => irxs.socket.write(irxs.buffer));
    }
    // Return decoded source messages
    return source$;
  };
  return switchDriver;
};

export {MessageStream, makeSwitchDriver};
