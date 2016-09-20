import test from "ava";
import * as rxdn from "../rxdn";
import {Observable} from "rxjs";

test("Sends a FlowMod", t => {
  const openflowDriver = Observable.of({
    id: "1.2.3.4:1111",
    event: rxdn.OFEventType.Message,
    message: new rxdn.Hello(),
  } as rxdn.OFEvent);
  return <Observable<any>> rxdn.Push({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.is(m.message.name, "ofp_flow_mod"));
});
