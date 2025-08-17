export * from "./host";
export * from "./universal-worker";
import { randomUUID } from "crypto";

export const getUUID = () => randomUUID();
