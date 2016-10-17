import {OFComponent, OFEventType, OFEvent} from "../../drivers/openflow";
import * as OF from "@dancasey/node-openflow";

/**
 * Sends FeaturesRequest and handles FeaturesReply messages
 *
 * From specification, section 7.3.1 Handshake:
 * > The OFPT_FEATURES_REQUEST message is used by the controller to identify the
 * > switch and read its basic capabilities. Upon session establishment (see
 * > 6.3.3), the controller should send an OFPT_FEATURES_REQUEST message. This
 * > message does not contain a body beyond the OpenFlow header. The switch must
 * > respond with an OFPT_FEATURES_REPLY message.
 *
 */
export const Features: OFComponent = sources => {
  const [/* featureReplies */, noFeaturesReplies] = sources.openflowDriver.partition(m => {
    if (m.event === OFEventType.Message) {
      return m.message.name === "ofp_features_reply" ? true : false;
    } else {
      return false;
    }
  });

  const featuresRequest = sources.openflowDriver
    .filter(m => m.event === OFEventType.Message && m.message.name === "ofp_hello")
    .map((m: {id: string, event: OFEventType.Message, message: OF.Hello}) => {
      const request = new OF.FeaturesRequest();
      request.message.header.xid = m.message.message.header.xid + 1;
      return <OFEvent> {
        event: OFEventType.Message,
        id: m.id,
        message: request,
      };
    });

  return {
    sources: {openflowDriver: noFeaturesReplies},
    sinks: {openflowDriver: featuresRequest},
  };
};
