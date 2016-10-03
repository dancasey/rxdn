import {OFComponent, OFEventType} from "../../drivers/openflow";
import {Observable} from "rxjs";
import * as OF from "node-openflow";

/**
 * FlowMod
 * -
 * -
 *
 */

export const FlowMod: OFComponent = sources => {
  return {sources, sinks: sources};
};
