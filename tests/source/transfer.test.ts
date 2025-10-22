import { describe, it, expect } from "vitest";
import {
  Transfer,
  isTransfer,
  convertToTransfer,
} from "../../src/utils/transfer";

describe("Transfer", () => {
  it("should create a Transfer instance with value and transferList", () => {
    const buffer = new ArrayBuffer(8);
    const value = { num: 1, str: "hello", buffer };
    const transferList = [buffer];
    const transfer = new Transfer(value, transferList);
    expect(transfer.value).toEqual(value);
    expect(transfer.transferList).toEqual(transferList);
    expect(transfer.__isTransferable).toBe(true);
  });

  it("isTransfer should return true for Transfer instance", () => {
    const buffer = new ArrayBuffer(8);
    const transfer = new Transfer({ buffer }, [buffer]);
    expect(isTransfer(transfer)).toBe(true);
  });

  it("isTransfer should return false for non-Transfer object", () => {
    expect(isTransfer({})).toBe(false);
    expect(isTransfer(null)).toBe(false);
    expect(isTransfer(undefined)).toBe(false);
    expect(isTransfer({ value: 1, transferList: [] })).toBe(false);
  });

  it("convertToTransfer should return a new Transfer instance if input is Transfer", () => {
    const buffer = new ArrayBuffer(8);
    const transfer = new Transfer({ buffer }, [buffer]);
    const result = convertToTransfer(transfer);
    expect(result).not.toBe(transfer);
    expect(result.value).toEqual(transfer.value);
    expect(result.transferList).toEqual(transfer.transferList);
    expect(result.__isTransferable).toBe(true);
  });

  it("convertToTransfer should return undefined for non-Transfer input (overload)", () => {
    const obj = { foo: "bar" };
    expect(convertToTransfer(obj)).toBeUndefined();
  });
});
