export type FunctionsRecord = Record<string, any>;

export type Calls = {
  resolve: (result?: any) => void;
  reject: (error: Error) => void;
  func: string;
  id: string;
};

export type RequestPayload<Params extends unknown[]> = {
  func: any; // function name
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

export type FuncOptions = {
  timeoutMs?: number; // timeout in milliseconds
  signal?: AbortSignal; // abort signal to cancel the request
};

export interface WorkerProxy<T extends FunctionsRecord> {
  func<K extends keyof T>(
    funcName: K,
    options?: FuncOptions
  ): (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>;
  terminate(): void;
}

export interface UniversalWorkerInterface {
  postMessage(message: RequestPayload<any>): void;

  onmessage(message: ResponsePayload<any>): void;

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
