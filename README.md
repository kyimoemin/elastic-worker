# async-multi-worker

## Table of Content

- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [DedicatedWorker](#dedicatedworker)
- [DynamicWorker](#dynamicworker)
- [License](#license)

## Overview

`async-multi-worker` enables simple, async multithreading using workers, without needing to deal with worker code directly. This package exports two worker classes: [DedicatedWorker](#dedicatedworker) and [DynamicWorker](#dynamicworker). Each has its own pros and cons—choose the one that best fits your needs.

| Worker          | Pros                                                | Cons                                                          |
| --------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| DedicatedWorker | Can maintain persistent state across calls          | Function calls are queued; only one runs at a time (blocking) |
| DynamicWorker   | Non-blocking; can handle multiple tasks in parallel | Cannot maintain state between calls (stateless)               |

## Installation

```bash
npm i async-multi-worker
```

## Usage

You need to create a separate file for the worker context. For example, let's assume you have the following folder structure:

```
src/
  worker.ts
  main.ts
```

In `worker.ts`, write your functions, combine them in an object, and pass that object to the `initWorker` function.

worker.ts

```ts
import { initWorker } from "async-multi-worker";

const add = (a, b) => a + b;
const sub = (a, b) => a - b;

const calc = { add, sub };

export type Calculator = typeof calc;

initWorker(calc);
```

That's it—you've created a worker file that will run in a worker thread.

Now you can use it in your code. The package provides two types of workers: [DedicatedWorker](#dedicatedworker) and [DynamicWorker](#dynamicworker), depending on your needs. For example:

main.ts

```ts
import { DynamicWorker } from "async-multi-worker";
import type { Calculator } from "./worker.ts";

const workerUrl = new URL("./worker.ts", import.meta.url);

const dedicatedWorker = new DynamicWorker(workerUrl);

const addition = dedicatedWorker.func("add");
const subtract = dedicatedWorker.func("sub");

const addResult = await addition(1, 2); // runs `add` function of `worker.ts` in worker thread
const subResult = await subtract(1, 2); // runs `sub` function of `worker.ts` in worker thread
```

---

## DedicatedWorker

Runs in a single worker thread. Since it always uses the same worker, you can store state in this worker. However, it does not spawn new worker threads on demand—new function calls must wait until the previous execution is finished.

### Properties

| Property    | Type     | Params     | Return   | Description                                                  |
| ----------- | -------- | ---------- | -------- | ------------------------------------------------------------ |
| `busy`      | boolean  | -          | -        | Indicates if the worker thread is currently busy             |
| `func`      | function | `funcName` | function | Returns a callable function from the worker by name          |
| `terminate` | function | -          | -        | Terminates the worker thread and stops any ongoing execution |

### Example

worker.ts

```ts
import { initWorker } from "async-multi-worker";

export class Calculator {
  result: number;

  add = (a, b) => {
    this.result = a + b;
    return this.result;
  };
  sub = (a, b) => {
    this.result = a - b;
    return this.result;
  };
  lastResult = () => this.result;
}

const calculator = new Calculator();

initWorker(calculator);
```

Alternatively, you can implement it like this, depending on your preference:

worker.ts

```ts
let result;
const add = (a, b) => {
  result = a + b;
  return result;
};
const sub = (a, b) => {
  result = a - b;
  return result;
};
const lastResult = () => result;

const calculator = { add, sub, lastResult };

initWorker(calculator);
export type Calculator = typeof calculator;
```

In this example, we store the last calculation result in the `result` variable. You can retrieve this in the main thread using the `lastResult` function.

main.ts

```ts
import { DedicatedWorker } from "async-multi-worker";
import type { Calculator } from "./worker.ts";

const workerUrl = new URL("./worker.ts", import.meta.url);

const dedicatedWorker = new DedicatedWorker(workerUrl);

const addition = dedicatedWorker.func("add");
const subtract = dedicatedWorker.func("sub");

const addResult = await addition(1, 2); // runs `add` function of `worker.ts` in worker thread
const subResult = await subtract(1, 2); // runs `sub` function of `worker.ts` in worker thread
```

---

## DynamicWorker

[DynamicWorker](#dynamicworker) can spawn multiple workers on demand, making it suitable for non-blocking tasks. Since it spawns and terminates workers as needed, it cannot store state in the worker. There is no upper bound for spawning new workers—a new worker thread will spawn if all existing workers are busy. However, there is a maximum limit for non-busy workers: if a worker is not busy anymore and there are more worker threads than the maximum limit, it will self-terminate. You can set the maximum non-busy worker limit when creating a new DynamicWorker (default is 5). Another advantage is that you can set a timeout on a function call; if the execution exceeds the timeout, it will terminate and return a timeout error .

### Properties

| Property    | Type     | Params                  | Return   | Description                                                                                                       |
| ----------- | -------- | ----------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `func`      | function | `funcName`, `timeoutMs` | function | Returns a callable function from the worker by name, with optional timeout (default: 5000ms, `Infinity` disables) |
| `terminate` | function | -                       | -        | Terminates all active worker threads                                                                              |

### Example

This example focuses on the additional features of the DynamicWorker class.
Let's use the same code for `worker.ts` as in [Usage](#usage):

main.ts

```ts
import { DynamicWorker, TimeoutError } from "async-multi-worker";

const workerURL = new URL("./worker.ts", import.meta.url);

const dynamicWorker = new DynamicWorker(workerURL, 1); // DynamicWorker with 1 max non-busy worker

const addition = dynamicWorker.func("add", 2000); // use 2000ms as timeout

try {
  const result = await addition(1, 2);
} catch (error) {
  if (error instanceof TimeoutError)
    console.log("Addition function execution has timed out", error);
  else console.log("Unknown error", error);
}
```

---

## License

MIT
