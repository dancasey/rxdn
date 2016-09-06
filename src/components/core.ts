import {Observable} from "rxjs";
import {OFDSource} from "../drivers/openflow";
import {Hello} from "./core/hello";
import {Echo} from "./core/echo";

/**
 * Core OpenFlow component
 *
 * - Sends initial Hello message upon connection
 * - Replies to echo requests
 * - Returns sources.openflowDriver without `EchoRequest`s
 */
export const Core = (source: Observable<OFDSource>) => {
  const reply = Echo(source);
  const hello = Hello(source);
  const openflowDriver = reply.openflowDriver.merge(hello.openflowDriver);
  const next = reply.next;

  return {
    next,
    openflowDriver,
  };
};
