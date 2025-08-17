export * from "./host";
export * from "./worker";
import { randomUUID } from "crypto";

export const getUUID = () => randomUUID();
