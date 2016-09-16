import {Driver} from "../interfaces";
import {Observable} from "rxjs";

/**
 * Logs sink to the console
 */
export const consoleDriver: Driver<string, void> = sink => {
  /* tslint:disable-next-line:no-console */
  sink.subscribe(msg => console.log(msg));
  return <Observable<any>> Observable.never();
};
