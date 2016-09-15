import {Observable} from "rxjs";

/** A collection of Observables indexed by key */
export interface ObservableCollection {
  [name: string]: Observable<any>;
}

/**
 * A Component is a function which accepts a source of Observables indexed by key (an ObservableCollection)
 * and returns sources as inputs to composed Components and sinks as inputs to Drivers.
 * A Component should not create side-effects, as this is the function of a Driver.
 */
export interface Component {
  (sources: ObservableCollection): {sources: ObservableCollection, sinks: ObservableCollection};
}

/**
 * A Driver is a function which *may* accept an Observable (a Sink) and *may* return
 * an Observable (a Source); it should at least do one of these, or it is pointless.
 * The Driver is the place to acquire events or data from external sources and to create side-effects.
 */
export interface Driver<Sink, Source> {
  (sink?: Observable<Sink>): void | Observable<Source>;
}

/** A collection of Drivers indexed by key */
export interface Drivers {
  [name: string]: Driver<any, any>;
}
