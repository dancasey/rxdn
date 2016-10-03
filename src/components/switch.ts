import {OFComponent} from "../drivers/openflow";
import {Compose} from "./compose";
import {SwitchMemory} from "./switch/memory";
import {PacketOut} from "./switch/packetout";
import {FlowMod} from "./switch/flowmod";

/**
 * Layer 2 Switch
 *
 * 1. Accepts PacketIn messages
 * 2. Memorizes source switch, source port, and MAC address of each PacketIn
 * 3. Checks memory for destination MAC address
 *   - If found, sends packet to that specific location
 *   - If not found, floods packet
 * 4. Installs a temporary FlowMod with results of #3 in target switch
 *
 */
export const Switch: OFComponent = sources => {
  return Compose([
    SwitchMemory,
    PacketOut,
    FlowMod,
  ], sources);
};
