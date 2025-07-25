import { greeting } from "../src/index";

describe("greeting function", () => {
  it('should return "hello world"', () => {
    expect(greeting()).toBe("hello world");
  });
});
