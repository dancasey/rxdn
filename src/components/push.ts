import {OFComponent, OFEventType, OFEvent} from "../drivers/openflow";
import * as OF from "node-openflow";

// Length of Ethernet header
const ETH_LEN = 14;

// Priority level of this rule
const PRIORITY = 0;

/** Installs FlowMod to push all new flows to controller */
export const Push: OFComponent = sources => {
  const flowmod = sources.openflowDriver
    .filter(m => m.event === OFEventType.Message && m.message.name === "ofp_hello")
    .map((m: {id: string, event: OFEventType.Message, message: OF.Hello}) => {
      // Build the Action to send flows to the controller
      let action = new OF.Action();

      // Three ways to set type, since type is stored as string, but can be set as value:
      action.type = OF.ofp_action_type[OF.OFPAT_OUTPUT]; // set string via enum
      // action.typeVal = OF.ofp_action_type.OFPAT_OUTPUT; // set number via enum
      // action.typeVal = OF.OFPAT_OUTPUT; // set number directly

      // Send flows to the "controller" port
      action.port = OF.OFPP_CONTROLLER;

      // Send the whole packet to the controller instead of buffering it
      // action.max_len = OF.OFPCML_NO_BUFFER;
      // Send only the Ethernet header
      action.max_len = ETH_LEN;

      // Build the instruction to apply the Action
      let ins = new OF.Instruction();
      ins.typeVal = OF.OFPIT_APPLY_ACTIONS;
      ins.actions.push(action);

      // Build the FlowMod message to add the Instruction
      let fm = new OF.FlowMod();
      fm.commandVal = OF.OFPFC_ADD;
      fm.message.buffer_id = OF.OFP_NO_BUFFER;
      fm.message.out_port = OF.OFPP_ANY;
      fm.message.out_group = OF.OFPG_ANY;
      fm.message.flags = [];
      fm.message.priority = PRIORITY;
      fm.message.instructions.push(ins);

      return <OFEvent> {
        event: OFEventType.Message,
        id: m.id,
        message: fm,
      };
    });

  return {sources, sinks: {openflowDriver: flowmod}};
};
