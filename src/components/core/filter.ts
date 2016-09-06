
import {Observable} from "rxjs";
import {OFDSource, OFDEvent} from "../../drivers/openflow";

/**
 * Filters out a type of OpenFlow message from the stream
 * @param {Observable<OFDSource>} source
 * @param {string} name The name of the message type to filter out, e.g., "ofp_echo_request"
 * @returns {Observable<OFDSource>}
 */
export const Filter = (source: Observable<OFDSource>, name: string): Observable<OFDSource> => {
  return source
    .filter(ev => {
      if (ev.event === OFDEvent.Message && ev.message) {
        if (ev.message.name === name) {
          return false;
        }
      }
      return true;
    });
};
