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

export interface UniversalWorker {
  postMessage(message: any): void;

  onmessage(message: any): void;

  onerror(error: Error): void;

  onexit(exitCode: number): void;

  terminate(): void;
}

export interface Host {
  postMessage: (message: any) => void;
  onmessage: (event: { data: any }) => void;
}
