import {OFCollection, OFEvent, OFEventType} from "../../drivers/openflow";
import {PIEvent, SMEvent, SMCollection} from "./memory";
import {Observable} from "rxjs";
import * as OF from "node-openflow";

/**
 * Configurable properties:
 * - hardTimeout: seconds after which rule will be removed by switch
 * - idleTimeout: seconds after which unused rule will be removed by switch
 * - priority: priority level of rule: higher number equals higher priority
 */
export interface FlowModProps {
  hardTimeout: number;
  idleTimeout: number;
  priority: number;
}

const defaultProps: Observable<FlowModProps> = Observable.of({
  hardTimeout: 10,
  idleTimeout: 5,
  priority: 10,
});

export type FlowModSources = OFCollection & SMCollection & {props?: Observable<FlowModProps>};

/** Sends FlowMod to source switch, referencing `buffer_id` of PacketIn */
export const FlowMod = (sources: FlowModSources) => {
  let props: Observable<FlowModProps>;
  if (sources.props) {
    props = sources.props.withLatestFrom(
      defaultProps,
      (s: Observable<FlowModProps>, d: Observable<FlowModProps>) =>
      Object.assign(<FlowModProps> {}, d, s));
  } else {
    props = defaultProps;
  }

  const flowmod: Observable<OFEvent> = Observable
    .zip(sources.openflowDriver, sources.switchMemory)
    .withLatestFrom(props, ([pi, sm], p) => [pi, sm, p])
    .map(([pi, sm, p]: [PIEvent, SMEvent, FlowModProps]) => {
      let fm = new OF.FlowMod();
      fm.message.header.xid = pi.message.message.header.xid;
      fm.message.buffer_id = pi.message.message.buffer_id;
      fm.commandVal = OF.OFPFC_ADD;
      fm.flagsVal = OF.OFPFF_SEND_FLOW_REM;
      fm.message.hard_timeout = p.hardTimeout;
      fm.message.idle_timeout = p.idleTimeout;
      fm.message.priority = p.priority;

      let ma = new OF.Match();
      ma.oxm_fields.push(new OF.Oxm({
        oxm_field: "OFPXMT_OFB_ETH_DST",
        oxm_value: sm.dstmac,
      }));
      fm.message.match = ma;

      let ins = new OF.Instruction();
      ins.typeVal = OF.OFPIT_APPLY_ACTIONS;
      let act = new OF.Action();
      act.typeVal = OF.OFPAT_OUTPUT;
      act.port = sm.dstport;
      // Set max_len: OFPCML_NO_BUFFER to work around OVS bug, as reported in Ryu:
      // github.com/osrg/ryu/blob/master/ryu/app/simple_switch_13.py#L41-L45
      // But, should not matter, as port is not set to controller.
      act.max_len = OF.OFPCML_NO_BUFFER;
      ins.actions.push(act);
      fm.message.instructions.push(ins);

      return <OFEvent> {
        id: pi.id,
        event: OFEventType.Message,
        message: fm,
      };
    });

  return {
    sources,
    sinks: {openflowDriver: flowmod},
  };
};
