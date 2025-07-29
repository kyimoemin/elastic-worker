export type WorkerObject = Record<
  string | number | symbol,
  (...args: any[]) => any
>;

export type RequestPayload<Params extends unknown[]> = {
  func: string | number | symbol;
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

export interface WorkerProxy<T extends WorkerObject> {
  func<K extends keyof T>(
    funcName: K
  ): (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>;
  terminate(): void;
}
