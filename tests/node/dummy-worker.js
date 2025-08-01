// Minimal dummy worker for Node.js worker_threads (ESM)
import { parentPort } from "worker_threads";
if (parentPort) {
  parentPort.on("message", (msg) => {
    // Echo back the message
    parentPort?.postMessage({ result: msg });
  });
}
