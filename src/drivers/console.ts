import {Driver} from "../interfaces";

/**
 * Logs inputs to the console
 */
export const consoleDriver: Driver<string, void> = (message) => {
  if (message) {
    /* tslint:disable-next-line:no-console */
    message.subscribe(msg => console.log(msg));
  }
};
