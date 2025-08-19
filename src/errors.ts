export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Worker call timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}
