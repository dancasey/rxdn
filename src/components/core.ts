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
export const Core = (sources: {openflowDriver: Observable<OFDSource>}) => {
  const reply = Echo(sources.openflowDriver);
  const hello = Hello(sources.openflowDriver);
  const openflowDriver = reply.openflowDriver.merge(hello.openflowDriver);

  return {
    sources: {openflowDriver: reply.next},
    sinks: {openflowDriver},
  };
};
