import {OFComponent, OFCollection} from "../drivers/openflow";
import {Hello10, Hello13} from "./core/hello";
import {Echo} from "./core/echo";
import {Features} from "./core/features";
import {Compose} from "./compose";

/**
 * Core OpenFlow 1.0 component
 *
 * - Sends initial Hello message upon connection
 * - Replies to EchoRequests; removes from sources
 * - Sends FeaturesRequests; removes replies from sources
 *
 */
export const Core10: OFComponent = sources => {
  return <{sources: OFCollection, sinks: OFCollection}> Compose([
    Echo,
    Hello10,
    Features,
  ], sources);
};

/**
 * Core OpenFlow 1.3 component
 *
 * - Sends initial Hello message upon connection
 * - Replies to EchoRequests; removes from sources
 * - Sends FeaturesRequests; removes replies from sources
 *
 */
export const Core13: OFComponent = sources => {
  return <{sources: OFCollection, sinks: OFCollection}> Compose([
    Echo,
    Hello13,
    Features,
  ], sources);
};
