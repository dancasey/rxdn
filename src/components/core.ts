import {OFComponent} from "../drivers/openflow";
import {Hello} from "./core/hello";
import {Echo} from "./core/echo";
import {Compose} from "./compose";

/**
 * Core OpenFlow component
 *
 * - Sends initial Hello message upon connection
 * - Replies to echo requests
 * - Returns sources.openflowDriver without `EchoRequest`s
 */
export const Core: OFComponent = sources => {
  return Compose([
    Echo,
    Hello,
  ], sources);
};
