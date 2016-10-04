import {OFComponent, OFEventType} from "../drivers/openflow";
import {Compose} from "./compose";
import {SwitchMemory} from "./switch/memory";
import {PacketOut} from "./switch/packetout";
import {FlowMod} from "./switch/flowmod";

/**
 * Layer 2 Switch
 *
 * 1. Accepts PacketIn messages
 * 2. (Temporarily) memorizes source switch, source port, and MAC address of each PacketIn
 * 3. Checks memory for destination MAC address
 *   - If found, sends packet to that specific location
 *   - If not found, floods packet
 * 4. If not flood, installs a temporary FlowMod in source switch
 *
 */
export const Switch: OFComponent = sources => {
  // PacketIn messages
  const packetIn = sources.openflowDriver
    .filter(m => m.event === OFEventType.Message && m.message.name === "ofp_packet_in");

  return Compose([
    SwitchMemory,
    PacketOut,
    FlowMod,
  ], {openflowDriver: packetIn});
};
