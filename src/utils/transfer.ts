import { UniversalTransferable } from "../types";
/**
 * Transfer class should only have property no methods to be serializable
 * and transferable.
 */

/**
 * A utility class used for transferring Transferable objects.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects | Web Transferable}
 * @see {@link https://nodejs.org/api/worker_threads.html#portpostmessagevalue-transferlist | Node.js Transferable}
 *
 * @example
 * ```ts
 * import { Transfer,ElasticWorker } from "elastic-worker";
 *
 * const ew = new ElasticWorker("./worker.js");
 * const processData = ew.func("processData");
 *
 * const buffer = new ArrayBuffer(8);
 * const num = 1;
 * const str = "hello";
 * const transferData = new Transfer({num,str,buffer}, [buffer]);
 * const result  = await processData(transferData);
 *
 * ```
 */
export class Transfer<T> {
  value: T;
  transferList: UniversalTransferable[];

  readonly __isTransferable = true;

  constructor(value: T, transferList: UniversalTransferable[]) {
    this.value = value;
    this.transferList = transferList;
  }
}

export const isTransfer = (obj: any): obj is Transfer<any> => {
  return Boolean(
    obj && obj.value && obj.transferList && obj.__isTransferable === true
  );
};

export function convertToTransfer<T, U>(obj: Transfer<U>): Transfer<U>;
export function convertToTransfer<T>(obj: T): T;
export function convertToTransfer<T>(obj: T): any {
  if (isTransfer(obj)) return new Transfer(obj.value, obj.transferList);
  return obj;
}
