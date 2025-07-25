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
