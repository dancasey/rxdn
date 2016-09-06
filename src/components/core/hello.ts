import {Observable} from "rxjs";
import {OFDSource, OFDEvent, OFDSink} from "../../drivers/openflow";
import * as OF from "node-openflow";

/**
 * Sends a Hello message upon connection
 * @param {Observable<OFDSource>} source
 * @returns {ObservableCollection}
 */
export let Hello = (source: Observable<OFDSource>) => {
  // Send a `Hello` message upon connection
  const openflowDriver: Observable<OFDSink> = source
    .filter(ev => ev.event === OFDEvent.Connection)
    .map(ev => ({id: ev.id, message: new OF.Hello()}));
  return {openflowDriver};
};
