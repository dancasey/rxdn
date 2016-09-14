import {Driver} from "../interfaces";
import {Observable} from "rxjs";

/**
 * Generic state driver
 * @param {T} initialState The initial state to use
 * @returns {Driver<T, T>}
 *
 * @example
 *     const updateState = otherObservable
 *       .map(value => state => state.set("key", value));
 */
export const makeStateDriver: <T>(initialState: T) => Driver<T, T> = <T>(initialState: T) =>
  (sinks: Observable<T>) =>
    sinks
      .scan((state: T, changeFn: any) => changeFn(state), initialState)
      .startWith(initialState);
