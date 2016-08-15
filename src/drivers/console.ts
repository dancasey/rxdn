import {Driver} from "../interfaces";

let consoleDriver: Driver<string, void>;
consoleDriver = msg$ => {
  if (msg$) {
    /* tslint:disable-next-line:no-console */
    msg$.subscribe(msg => console.log(msg));
  }
};

export {consoleDriver};
