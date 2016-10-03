import {OFComponent, OFEventType} from "../../drivers/openflow";
import {Observable} from "rxjs";
import * as OF from "node-openflow";

/**
 * PacketOut
 * -
 * -
 *
 */

export const PacketOut: OFComponent = sources => {
  return {sources, sinks: sources};
};
