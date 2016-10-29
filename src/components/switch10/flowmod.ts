import {OFCollection, OFEvent, OFEventType} from "../../drivers/openflow";
import {PIEvent, SMEvent, SMCollection} from "./memory";
import {Observable} from "rxjs";
import {of10} from "@dancasey/node-openflow";

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

type FMCombined = {
  pi: PIEvent,
  p: FlowModProps,
  sm: SMEvent
}

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

  const flowmod = sources.openflowDriver // Observable
    .withLatestFrom(props, sources.switchMemory, (pi, p, sm) => ({pi, p, sm}))
    .map(({pi, p, sm}: FMCombined) => {
      let fm = new of10.FlowMod();
      fm.message.header.xid = pi.message.message.header.xid;
      fm.message.buffer_id = pi.message.message.buffer_id;
      fm.commandVal = of10.OFPFC_ADD;
      fm.flagsVal = of10.OFPFF_SEND_FLOW_REM;
      fm.message.hard_timeout = p.hardTimeout;
      fm.message.idle_timeout = p.idleTimeout;
      fm.message.priority = p.priority;

      let ma = new of10.Match();
      ma.wildcards = [
        "OFPFW_IN_PORT",
        "OFPFW_DL_VLAN",
        "OFPFW_DL_SRC",
        // "OFPFW_DL_DST",
        "OFPFW_DL_TYPE",
        "OFPFW_NW_PROTO",
        "OFPFW_TP_SRC",
        "OFPFW_TP_DST",
        "OFPFW_NW_SRC_SHIFT",
        "OFPFW_NW_SRC_BITS",
        "OFPFW_NW_SRC_MASK",
        "OFPFW_NW_SRC_ALL",
        "OFPFW_NW_DST_SHIFT",
        "OFPFW_NW_DST_BITS",
        "OFPFW_NW_DST_MASK",
        "OFPFW_NW_DST_ALL",
        "OFPFW_DL_VLAN_PCP",
        "OFPFW_NW_TOS",
      ];
      ma.dl_dst = sm.dstmac;
      fm.message.match = ma;

      let act = new of10.Action();
      act.typeVal = of10.OFPAT_OUTPUT;
      act.port = sm.dstport;
      // Set max_len: OFPCML_NO_BUFFER to work around OVS bug, as reported in Ryu:
      // github.com/osrg/ryu/blob/master/ryu/app/simple_switch_13.py#L41-L45
      // But, should not matter, as port is not set to controller.
      act.max_len = 0xffff;
      fm.message.actions = [act];

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
