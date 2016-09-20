import {Observable} from "rxjs";

/** A collection of Observables indexed by key */
export interface Collection {
  [name: string]: Observable<any>;
}

/**
 * A Component is a function which accepts a source of Observables indexed by key (a Collection)
 * and returns sources as inputs to composed Components and sinks as inputs to Drivers.
 * A Component should not create side-effects, as this is the function of a Driver.
 */
export interface Component {
  (sources: Collection): {sources: Collection, sinks: Collection};
}

/**
 * A Driver is a function which takes an Observable (a Sink) and returns an Observable (a Source).
 * The Driver is the place to acquire events or data from external sources and to create side-effects.
 */
export interface Driver<Sink, Source> {
  (sink: Observable<Sink>): Observable<Source>;
}

/** A collection of Drivers indexed by key */
export interface Drivers {
  [name: string]: Driver<any, any>;
}
