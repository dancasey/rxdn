import {Subscription, ReplaySubject} from "rxjs";
import {Collection, Component, Drivers} from "./interfaces";
import {Compose} from "./components/compose";
import {FlowControl} from "./components/flowcontrol";

interface SubjectCollection {
  [name: string]: ReplaySubject<any>;
}

function makeProxies(drivers: Drivers): SubjectCollection {
  const proxies: SubjectCollection = {};
  const names = Object.keys(drivers);
  names.forEach(name => {
    proxies[name] = new ReplaySubject(1);
  });
  return proxies;
}

function callDrivers(drivers: Drivers, proxies: Collection): Collection {
  const sources: Collection = {};
  const names = Object.keys(drivers);
  names.forEach(name => {
    let source = drivers[name](proxies[name]);
    sources[name] = source;
  });
  return sources;
}

function subscribeAll(sinks: Collection, proxies: SubjectCollection): Subscription {
  const subscription = new Subscription();
  const names = Object.keys(sinks);
  names.forEach(name => {
    subscription.add(sinks[name].subscribe(proxies[name]));
  });
  return subscription;
}

function makeMain(main: Component, sources: Collection): Component {
  const newMain = (src: Collection) => {
    return Compose([
      FlowControl,
      main,
    ], sources);
  };
  return newMain;
}

export function run(main: Component, drivers: Drivers): Subscription {
  const proxies = makeProxies(drivers);
  const sources = callDrivers(drivers, proxies);
  const newMain = makeMain(main, sources);
  const {sinks} = newMain(sources);
  const subscription = subscribeAll(sinks, proxies);
  return subscription;
}
