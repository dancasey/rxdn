import {Observable, Subscription, ReplaySubject} from "rxjs";
import {ObservableCollection, SubjectCollection, MainFn, Drivers} from "./interfaces";

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
  let source: void | Observable<any>;
  names.forEach(name => {
    source = drivers[name](proxies[name]);
    // only attach result to sources if it is not null
    if (source) {
      sources[name] = source;
    }
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

export function run(main: MainFn, drivers: Drivers): Subscription {
  const proxies = makeProxies(drivers);
  const sources = callDrivers(drivers, proxies);
  const sinks = main(sources);
  const subscription = subscribeAll(sinks, proxies);
  return subscription;
}
