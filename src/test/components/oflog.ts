import test from "ava";
import * as rxdn from "../../rxdn";
import {Observable} from "rxjs";

test("Does not output `sinks.openflowDriver`", t => {
  const openflowDriver = Observable.of({
    id: "1.2.3.4:1111",
    event: rxdn.OFEventType.Message,
    message: new rxdn.Hello(),
  } as rxdn.OFEvent);
  const result = rxdn.OFLog({openflowDriver});
  t.false(result.sinks.hasOwnProperty("openflowDriver"));
});
