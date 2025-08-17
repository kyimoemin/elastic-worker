import { isBrowser, isNode } from "../constants";

export const getUUID = () => {
  if (isNode()) {
    const crypto = require("crypto");
    return crypto.randomUUID();
  } else if (isBrowser()) {
    return crypto.randomUUID();
  }
};
