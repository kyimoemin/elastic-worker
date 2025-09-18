export class TimeoutError extends Error {
  constructor(func: string) {
    super(`Worker call '${func}' timed out`);
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
  constructor(funcName: string) {
    super(`Worker call '${funcName}' has been aborted`);
    this.name = "AbortedError";
  }
}

export class WorkerTerminatedError extends Error {
  constructor() {
    super(`Worker has been terminated`);
    this.name = "WorkerTerminatedError";
  }
}

export class FunctionNotFoundError extends Error {
  constructor(functionName: string) {
    super(`Function '${functionName}' not found in worker.`);
    this.name = "FunctionNotFoundError";
  }
}
