import { loggerFunction } from "./logger";

export let logger: any;

if (process.env.NODE_ENV === 'production') {
    logger = loggerFunction()
  }