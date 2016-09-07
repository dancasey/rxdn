import {Component, ObservableCollection} from "../interfaces";

/**
 * Takes an array of components and a sources object and composes the components
 * such that sources output from one component flow as input sources to the next,
 * and sinks from each component are merged as returned as a single sink object.
 */
export const Compose = (components: Component[], sources: ObservableCollection) => {
  let outSources = sources;
  let sinks: ObservableCollection = {};

  components.forEach(component => {
    let result = component(outSources);
    outSources = result.sources;

    // If the key of the sink is in the sinks, merge them.
    // Otherwise, add it to the sinks object.
    for (let sink in result.sinks) {
      if (result.sinks.hasOwnProperty(sink)) {
        if (sinks.hasOwnProperty(sink)) {
          sinks[sink].merge(result.sinks[sink]);
        } else {
          sinks[sink] = result.sinks[sink];
        }
      }
    }
  });

  return {
    sources: outSources,
    sinks,
  };
};
