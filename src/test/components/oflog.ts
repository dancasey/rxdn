import test from "ava";
import * as rxdn from "../../rxdn";
import {Observable} from "rxjs";

interface ConsoleCollection extends rxdn.Collection {
  consoleDriver: Observable<string>;
}

test("Does not output `sinks.openflowDriver`", t => {
  t.plan(1);
  const openflowDriver = Observable.of({
    id: "1.2.3.4:1111",
    event: rxdn.OFEventType.Message,
    message: new rxdn.of13.Hello(),
  } as rxdn.OFEvent);
  const result = rxdn.OFLog({openflowDriver});
  t.false(result.sinks.hasOwnProperty("openflowDriver"));
});

test("Logs Message events to sinks.consoleDriver", t => {
  t.plan(1);
  const openflowDriver = Observable.of({
    id: "1.2.3.4:1111",
    event: rxdn.OFEventType.Message,
    message: new rxdn.of13.Hello(),
  } as rxdn.OFEvent);
  const result = rxdn.OFLog({openflowDriver});
  return <Observable<any>> (<{consoleDriver: Observable<string>}> result.sinks).consoleDriver
    .map(m => t.true(typeof m === "string"));
});

test("Logs Connection events to sinks.consoleDriver", t => {
  t.plan(1);
  const openflowDriver = Observable.of({
    id: "1.2.3.4:1111",
    event: rxdn.OFEventType.Connection,
  } as rxdn.OFEvent);
  const result = rxdn.OFLog({openflowDriver});
  return <Observable<any>> (<{consoleDriver: Observable<string>}> result.sinks).consoleDriver
    .map(m => t.true(typeof m === "string"));
});

test("Logs Error events to sinks.consoleDriver", t => {
  t.plan(1);
  const openflowDriver = Observable.of({
    id: "1.2.3.4:1111",
    event: rxdn.OFEventType.Error,
    error: new Error("error"),
  } as rxdn.OFEvent);
  const result = rxdn.OFLog({openflowDriver});
  return <Observable<any>> (<{consoleDriver: Observable<string>}> result.sinks).consoleDriver
    .map(m => t.true(typeof m === "string"));
});

test("Logs unknown events to sinks.consoleDriver", t => {
  t.plan(1);
  const openflowDriver = Observable.of({
    id: "1.2.3.4:1111",
    event: 4,
  } as rxdn.OFEvent);
  const result = rxdn.OFLog({openflowDriver});
  return <Observable<any>> (<{consoleDriver: Observable<string>}> result.sinks).consoleDriver
    .map(m => t.true(typeof m === "string"));
});
