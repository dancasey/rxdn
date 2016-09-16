import {Subscription, ReplaySubject} from "rxjs";
import {ObservableCollection, Component, Drivers} from "./interfaces";

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

function callDrivers(drivers: Drivers, proxies: ObservableCollection): ObservableCollection {
  const sources: ObservableCollection = {};
  const names = Object.keys(drivers);
  names.forEach(name => {
    let source = drivers[name](proxies[name]);
    sources[name] = source;
  });
  return sources;
}

function subscribeAll(sinks: ObservableCollection, proxies: SubjectCollection): Subscription {
  const subscription = new Subscription();
  const names = Object.keys(sinks);
  names.forEach(name => {
    subscription.add(sinks[name].subscribe(proxies[name]));
  });
  return subscription;
}

export function run(main: Component, drivers: Drivers): Subscription {
  const proxies = makeProxies(drivers);
  const sources = callDrivers(drivers, proxies);
  const {sinks} = main(sources);
  const subscription = subscribeAll(sinks, proxies);
  return subscription;
}
