import {Component} from "../interfaces";
import {Hello} from "./core/hello";
import {Echo} from "./core/echo";
import {Compose} from "../util/compose";

/**
 * Core OpenFlow component
 *
 * - Sends initial Hello message upon connection
 * - Replies to echo requests
 * - Returns sources.openflowDriver without `EchoRequest`s
 */
export const Core: Component = sources => {
  return Compose([
    Echo,
    Hello,
  ], sources);
};
