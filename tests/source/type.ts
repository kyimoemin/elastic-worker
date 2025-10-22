import { Transfer } from "../../src/utils/transfer";

export type Calculator = {
  add(a: number, b: number): number;
  subtract(a: number, b: number): number;
  fibonacci(n: number): number;
  error(a: number, b: number): number;
  transfer(buffer: Transfer<any>): Transfer<any>;
};
