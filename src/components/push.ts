import {OFComponent, OFEventType, OFEvent} from "../drivers/openflow";
import {of13} from "@dancasey/node-openflow";

// Length of Ethernet header
const ETH_LEN = 14;

// Priority level of this rule
const PRIORITY = 0;

/**
 * Installs FlowMod to push all new flows to controller.
 *
 * This should not be needed for OpenFlow 1.0, so those messages are ignored.
 */
export const Push: OFComponent = sources => {
  const flowmod = sources.openflowDriver
    .filter(m =>
      m.event === OFEventType.Message &&
      m.message.name === "ofp_hello" &&
      m.message.message.header.version === of13.OFP_VERSION,
    )
    .map((m: {id: string, event: OFEventType.Message, message: of13.Hello}) => {
      // Build the Action to send flows to the controller
      let action = new of13.Action();

      // Three ways to set type, since type is stored as string, but can be set as value:
      action.type = of13.ofp_action_type[of13.OFPAT_OUTPUT]; // set string via enum
      // action.typeVal = of13.ofp_action_type.OFPAT_OUTPUT; // set number via enum
      // action.typeVal = of13.OFPAT_OUTPUT; // set number directly

      // Send flows to the "controller" port
      action.port = of13.OFPP_CONTROLLER;

      // Send the whole packet to the controller instead of buffering it
      // action.max_len = of13.OFPCML_NO_BUFFER;
      // Send only the Ethernet header
      action.max_len = ETH_LEN;

      // Build the instruction to apply the Action
      let ins = new of13.Instruction();
      ins.typeVal = of13.OFPIT_APPLY_ACTIONS;
      ins.actions = [action];

      // Build the FlowMod message to add the Instruction
      let fm = new of13.FlowMod();
      fm.commandVal = of13.OFPFC_ADD;
      fm.message.buffer_id = of13.OFP_NO_BUFFER;
      fm.message.out_port = of13.OFPP_ANY;
      fm.message.out_group = of13.OFPG_ANY;
      fm.message.flags = [];
      fm.message.priority = PRIORITY;
      fm.message.instructions = [ins];

      return <OFEvent> {
        event: OFEventType.Message,
        id: m.id,
        message: fm,
      };
    });

  return {sources, sinks: {openflowDriver: flowmod}};
};
