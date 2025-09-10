export type FunctionsRecord = Record<string, any>;

export type RequestPayload<Params extends unknown[]> = {
  func: string | number;
  args: Params;
  id: string;
};

export type ResponsePayload<R = void> = {
  id: string;
  result?: R;
  error?: ErrorPayload;
};

export type ErrorPayload = {
  message: string;
  stack?: string;
  name: string;
};

export interface WorkerProxy<T extends FunctionsRecord> {
  func<K extends keyof T>(
    funcName: K
  ): (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>;
  terminate(): void;
}

export interface UniversalWorkerInterface {
  postMessage(message: any): void;

  onmessage(message: any): void;

  onerror(error: Error): void;

  onexit(exitCode: number): void;

  /**
   * @returns void in browser, exit code or void in node
   */
  terminate(): Promise<void | number>;
}

export interface HostInterface {
  postMessage: (message: any) => void;
  onmessage: (data: any) => void;
}
