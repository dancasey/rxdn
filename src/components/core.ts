/**
 * Core OpenFlow component. Handles:
 * - Initial Hello messages upon connection (version negotiation)
 * - Replies to echo requests
 *
 */

import {Observable} from "rxjs";
import {ObservableCollection} from "../interfaces";
import {OFDSource, OFDEvent, OFDSink} from "../drivers/openflow";
import * as OF from "node-openflow";

export interface CoreSources extends ObservableCollection {
  openflowDriver: Observable<OFDSource>;
}

export interface CoreSinks extends ObservableCollection {
  next: Observable<OFDSource>;
  openflowDriver: Observable<OFDSink>;
}

export let Core: (sources: CoreSources) => CoreSinks;
Core = (sources) => {
  // Send a `Hello` message upon connection
  const Hello: Observable<OFDSink> = sources.openflowDriver
    .filter(ev => ev.event === OFDEvent.Connection)
    .map(ev => ({id: ev.id, message: new OF.Hello()}));

  // Send an `EchoReply` whenever an `EchoRequest` is received
  const EchoReply: Observable<OFDSink> = sources.openflowDriver
    .filter(({event}) => event === OFDEvent.Message)
    .filter(({message}) => (message as OF.OpenFlowMessage).name === "ofp_echo_request")
    .map(({id, message}) => {
      const reply = new OF.EchoReply();
      // TODO fix upstream so type assertion isn't necessary
      if (message && (<OF.EchoRequest> message).data) {
        reply.data = (<OF.EchoRequest> message).data;
      }
      reply.message.header.xid = (<OF.EchoRequest> message).message.header.xid;
      return {id, message: reply};
    });

  // For chained components, filter out EchoRequest messages
  const next: Observable<OFDSource> = sources.openflowDriver
    .filter(ev => {
      if (ev.event === OFDEvent.Message && ev.message) {
        if (ev.message.name === "ofp_echo_request") {
          return false;
        }
      }
      return true;
    });

  const openflowDriver: Observable<OFDSink> = Observable.merge(
    Hello,
    EchoReply
  );

  return {
    next,
    openflowDriver,
  };
};
