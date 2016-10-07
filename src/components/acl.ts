import {OFCollection, OFComponent, OFEvent, OFEventType} from "../drivers/openflow";
import {Observable} from "rxjs";
import * as OF from "node-openflow";
import ethdecode from "ethernet";
import * as R from "ramda";

/**
 * Configurable properties:
 * - acl An array of MAC addresses to block in hex string format, e.g. ["aabbccddeeff"]
 */
export interface AclProps {
  acl: Array<string>;
}

export type AclSources = OFCollection & {props: Observable<AclProps>};

/** Applies Access Control List (ACL) as a filter to incoming frames */
export const Acl: OFComponent = (sources: AclSources) => {
  const filtered = sources.openflowDriver
    .withLatestFrom(sources.props)
    .filter(([m, props]: [OFEvent, AclProps]) => {
      if (m.event === OFEventType.Message && m.message instanceof OF.PacketIn) {
        const {source, destination} = ethdecode(m.message.message.data);
        if (R.contains(source, props.acl) || R.contains(destination, props.acl)) {
          return false;
        } else {
          return true;
        }
      } else {
        return true;
      }
    })
    .map(([event]: [OFEvent, AclProps]) => event);

  return {
    sources: {openflowDriver: filtered},
    sinks: {openflowDriver: <Observable<any>> Observable.never()},
  };
};
