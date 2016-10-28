import {OFComponent, OFCollection, OFEventType} from "../drivers/openflow";
import {Compose} from "./compose";
import {SwitchMemory, SwitchMemoryProps} from "./switch10/memory";
import {PacketOut} from "./switch10/packetout";
import {FlowMod, FlowModProps} from "./switch10/flowmod";
import {Observable} from "rxjs";
import {of10} from "@dancasey/node-openflow";

type SwitchProps = SwitchMemoryProps & FlowModProps;
type SwitchSources = OFCollection & {props?: Observable<SwitchProps>};

/**
 * Layer 2 Switch, OpenFlow 1.0
 *
 * 1. Accepts PacketIn messages
 * 2. (Temporarily) memorizes source switch, source port, and MAC address of each PacketIn
 * 3. Checks memory for destination MAC address
 *   - If found, sends packet to that specific location
 *   - If not found, floods packet
 * 4. If not flood, installs a temporary FlowMod in source switch
 *
 */
export const Switch10: OFComponent = (sources: SwitchSources) => {
  // PacketIn messages
  const packetIn = sources.openflowDriver
    .filter(m =>
      m.event === OFEventType.Message &&
      m.message.name === "ofp_packet_in" &&
      m.message.message.header.version === of10.OFP_VERSION);

  const outSources = Object.assign({}, sources, {openflowDriver: packetIn});

  return Compose<SwitchSources>([
    SwitchMemory,
    PacketOut,
    FlowMod,
  ], outSources);
};
