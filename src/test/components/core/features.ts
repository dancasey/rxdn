import test from "ava";
import * as rxdn from "../../../rxdn";
import {Observable} from "rxjs";

test("Sends `FeaturesRequest` on session establishment", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Message,
    message: new rxdn.Hello(),
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.is(m.message.name, "ofp_features_request"));
  return result;
});

test("Removes `FeaturesReply` from sources", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Message,
    message: new rxdn.FeaturesReply(),
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core({openflowDriver}).sources.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.fail());
  return result;
});
