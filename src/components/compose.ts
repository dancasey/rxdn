import {Collection} from "../interfaces";

/**
 * Takes an array of components and a sources object and composes the components
 * such that sources output from one component flow as input sources to the next,
 * and sinks from each component are merged as returned as a single sink object.
 */
export const Compose = <T extends Collection>
(components: Array<(sources: T) => {sources: T, sinks: T}>, sources: T) => {
  let nextSources: T = sources;
  let componentSinks: T;
  let sinks = <T> {};
  let result: {sources: T, sinks: T};

  components.forEach(component => {
    result = component(nextSources);
    nextSources = result.sources as T;
    componentSinks = result.sinks;

    // For any key of the nextSinks that is in the sinks, merge them.
    // Otherwise, add the new `key: stream` to sinks
    for (let sink in componentSinks) {
      if (sinks.hasOwnProperty(sink)) {
        sinks[sink] = sinks[sink].merge(componentSinks[sink]);
      } else {
        sinks[sink] = componentSinks[sink];
      }
    }
  });

  return {sources: nextSources, sinks};
};
