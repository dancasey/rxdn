import test from "ava";
import * as rxdn from "../../../rxdn";
import {Observable} from "rxjs";

test("Sends 1.0 `FeaturesRequest` on session establishment", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Message,
    message: new rxdn.of10.Hello(),
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core10({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.is(m.message.name, "ofp_features_request"));
  return result;
});

test("Removes 1.0 `FeaturesReply` from sources", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Message,
    message: new rxdn.of10.FeaturesReply(),
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core10({openflowDriver}).sources.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.fail());
  return result;
});

test("Does not remove other 1.0 messages from sources", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Message,
    message: new rxdn.of10.Hello(),
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core10({openflowDriver}).sources.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.true(m.message instanceof rxdn.of10.Hello));
  return result;
});

test("Does not remove other 1.0 events from sources", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Connection,
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core10({openflowDriver}).sources.openflowDriver
    .map(m => t.is(m.event, rxdn.OFEventType.Connection));
  return result;
});

test("Sends 1.3 `FeaturesRequest` on session establishment", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Message,
    message: new rxdn.of13.Hello(),
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core13({openflowDriver}).sinks.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.is(m.message.name, "ofp_features_request"));
  return result;
});

test("Removes 1.3 `FeaturesReply` from sources", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Message,
    message: new rxdn.of13.FeaturesReply(),
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core13({openflowDriver}).sources.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.fail());
  return result;
});

test("Does not remove other 1.3 messages from sources", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Message,
    message: new rxdn.of13.Hello(),
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core13({openflowDriver}).sources.openflowDriver
    .map((m: {id: string, event: rxdn.OFEventType.Message, message: rxdn.OpenFlowMessage}) =>
      t.true(m.message instanceof rxdn.of13.Hello));
  return result;
});

test("Does not remove other 1.3 events from sources", t => {
  const openflowDriver = Observable.of({
    id: "1.1.1.1:1234",
    event: rxdn.OFEventType.Connection,
  } as rxdn.OFEvent);
  const result: Observable<any> = rxdn.Core13({openflowDriver}).sources.openflowDriver
    .map(m => t.is(m.event, rxdn.OFEventType.Connection));
  return result;
});
