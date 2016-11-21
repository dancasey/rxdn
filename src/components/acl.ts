import {OFCollection, OFComponent, OFEvent, OFEventType} from "../drivers/openflow";
import {Observable} from "rxjs";
import {of10, of13} from "@dancasey/node-openflow";
import ethdecode from "ethernet";
import * as R from "ramda";

/**
 * Configurable properties:
 * - acl An array of MAC addresses to block in hex string format, e.g. ["aabbccddeeff"]
 */
export interface AclProps {
  acl: string[];
}

export type AclSources = OFCollection & {props: Observable<AclProps>};

const filterAcl = (data: string, acl: string[]): boolean => {
    const {source, destination} = ethdecode(data);
    if (R.contains(source, acl) || R.contains(destination, acl)) {
      return false;
    } else {
      return true;
    }
};

/** Applies Access Control List (ACL) as a filter to incoming frames */
export const Acl: OFComponent = (sources: AclSources) => {
  const filtered = sources.openflowDriver
    .withLatestFrom(sources.props)
    .filter(([m, props]: [OFEvent, AclProps]) => {
      if (m.event === OFEventType.Message && m.message instanceof of13.PacketIn) {
        return filterAcl(m.message.message.data, props.acl);
      } else if (m.event === OFEventType.Message && m.message instanceof of10.PacketIn) {
        return filterAcl(m.message.message.data, props.acl);
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
