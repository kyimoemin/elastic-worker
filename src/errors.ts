export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Worker call timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}

export class QueueOverflowError extends Error {
  constructor(maxQueueSize: number) {
    super(`Queue limit of ${maxQueueSize} reached`);
    this.name = "QueueOverflowError";
  }
}

export class AbortedError extends Error {
  constructor() {
    super(`Worker call was aborted`);
    this.name = "AbortedError";
  }
}

export class WorkerTerminatedError extends Error {
  constructor() {
    super(`Worker was terminated`);
    this.name = "WorkerTerminatedError";
  }
}

export class FunctionNotFoundError extends Error {
  constructor(functionName: string) {
    super(`Function '${functionName}' not found in worker.`);
    this.name = "FunctionNotFoundError";
  }
}
