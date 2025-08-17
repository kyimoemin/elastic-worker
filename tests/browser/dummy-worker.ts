import { initWorker } from "../../dist/browser/init-worker.js";

const add = (a, b) => a + b;

const subtract = (a, b) => a - b;

initWorker({ add, subtract });
