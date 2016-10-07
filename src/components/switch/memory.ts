import {OFEventType, OFCollection} from "../../drivers/openflow";
import {Observable} from "rxjs";
import ethdecode from "ethernet";
import * as OF from "node-openflow";

/**
 * Configurable properties:
 * - timeout: How long should switch remember flows (ms)
 */
export interface SwitchMemoryProps {
  timeout: number;
}

const defaultProps: Observable<SwitchMemoryProps> = Observable.of({
  timeout: 30 * 1000,
});

/** An OFEvent that is always a PacketIn Message */
export type PIEvent = {id: string, event: OFEventType.Message, message: OF.PacketIn};

export interface SMEvent {
  id: string;
  srcport: number;
  dstport: number;
  srcmac: string;
  dstmac: string;
}

export interface SMCollection extends OFCollection {
  switchMemory: Observable<SMEvent>;
}

export interface SMComponent {
  (sources: OFCollection): {sources: OFCollection & SMCollection, sinks: OFCollection};
}

/**
 * Switch Memory
 * - Stores the source MAC address switch and port
 * - Looks for the destination MAC address switch and port
 *
 */
export const SwitchMemory: SMComponent = (sources: OFCollection & {props?: Observable<SwitchMemoryProps>}) => {
  let props: Observable<SwitchMemoryProps>;
  if (sources.props instanceof Observable) {
    props = sources.props.withLatestFrom(
      defaultProps,
      (s: Observable<SwitchMemoryProps>, d: Observable<SwitchMemoryProps>) =>
        Object.assign(<SwitchMemoryProps> {}, d, s)
    );
  } else {
    props = defaultProps;
  }

  // Source MAC address, switch id, and switch port
  const source = sources.openflowDriver
    .map((m: PIEvent) => {
      let oxm = m.message.message.match.getOxm("OFPXMT_OFB_IN_PORT");
      let srcport = -1;
      if (oxm) { srcport = parseInt(oxm.oxm_value, 10); }
      let eth = ethdecode(m.message.message.data);
      const srcmac = eth.source;
      const dstmac = eth.destination;
      return {
        id: m.id,
        srcport,
        srcmac,
        dstmac,
      };
    });

  // (Short-term) Memory
  interface Location {
    id: string;
    srcport: number;
  }
  type State = Map<string, Location>;
  const remember = source
    .map(({id, srcport, srcmac}) => (state: State) => state.set(srcmac, {id, srcport}));
  const forget = source
    .withLatestFrom(props)
    .switchMap(([s, p]) => Observable.of(s).delay(p.timeout))
    .map(({srcmac}) => (state: State) => { state.delete(srcmac); return state; });
  const state: Observable<State> = Observable
    .merge(remember, forget)
    .scan((st, action) => action(st), new Map<string, Location>());

  // Look for destination MAC in the memory
  const switchMemory = source
    .withLatestFrom(state, (src, st) => {
      let r = (<State> st).get(src.dstmac);
      // If srcport is on a different switch (if `id`s don't match), we don't want it
      if (r && r.id === src.id) {
        return Object.assign({}, src, {dstport: r.srcport});
      } else {
        return Object.assign({}, src, {dstport: -1});
      }
    });

  // Outputs
  const outSources = Object.assign({}, sources, {switchMemory});
  const sinks = {openflowDriver: <Observable<any>> Observable.never()};

  return {
    sources: outSources,
    sinks,
  };
};
