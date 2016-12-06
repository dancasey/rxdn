import {Component, Collection} from "../interfaces";

/**
 * In the monad, call the source openflow callback method.
 * This signals the stream's flow control to accept more data.
 * It uses a side-effect to signal the underlying stream, and attaches
 * this side-effect to the sink so it will be executed.
 */
export const FlowControl: Component = sources => {
  let sinks: Collection = {};
  if (sources.hasOwnProperty("openflowDriver")) {
    const openflowDriver = sources["openflowDriver"].do((x: any) => {
      let cb: () => void = x.cb;
      if (cb) {
        cb();
      }
    });
    sinks = {openflowDriver};
  }
  return {sources, sinks};
};
