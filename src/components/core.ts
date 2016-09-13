import {OFComponent, OFCollection} from "../drivers/openflow";
import {Hello} from "./core/hello";
import {Echo} from "./core/echo";
import {Features} from "./core/features";
import {Compose} from "./compose";

/**
 * Core OpenFlow component
 *
 * - Sends initial Hello message upon connection
 * - Replies to EchoRequests; removes from sources
 * - Sends FeaturesRequests; removes replies from sources
 *
 */
export const Core: OFComponent = sources => {
  return <{sources: OFCollection, sinks: OFCollection}> Compose([
    Echo,
    Hello,
    Features,
  ], sources);
};
