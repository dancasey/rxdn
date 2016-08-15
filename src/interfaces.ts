import {Observable, ReplaySubject} from "rxjs";

export interface ObservableCollection {
  [name: string]: Observable<any>;
}

export interface SubjectCollection {
  [name: string]: ReplaySubject<any>;
}

export interface MainFn {
  (sources: ObservableCollection): ObservableCollection;
}

export interface Driver<Sink, Source> {
  (sinks?: Observable<Sink>): void | Observable<Source>;
}

export interface Drivers {
  [name: string]: Driver<any, any>;
}
