# async-multi-worker

![npm version](https://img.shields.io/npm/v/async-multi-worker)
![npm downloads](https://img.shields.io/npm/dm/async-multi-worker)
![license](https://img.shields.io/npm/l/async-multi-worker)

## Table of Content

- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [DedicatedWorker](#dedicatedworker)
- [ElasticWorker](#elasticworker)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Overview

`async-multi-worker` provides a simple abstraction over **Web Workers** (browser) and **Worker Threads** (Node.js).
It lets you offload CPU‑intensive or blocking tasks to workers **without manually handling worker setup or lifecycle**.

This package exports two worker classes: [DedicatedWorker](#dedicatedworker) and [ElasticWorker](#elasticworker).
Each has its pros and cons:

| Worker          | Pros                                                | Cons                                                         |
| --------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| DedicatedWorker | Can maintain persistent state across calls          | Queues calls; only one runs at a time (sequential execution) |
| ElasticWorker   | Non-blocking; can handle multiple tasks in parallel | Cannot maintain state between calls (stateless)              |

> **Compatibility:** Works in modern browsers (Web Worker) and Node.js (worker_threads). ESM import is recommended.

## Installation

```bash
npm i async-multi-worker
```

## Usage

Create a separate file for the worker context.

```
src/
  worker.ts
  main.ts
```

### worker.ts

Define your functions and pass them to `initWorker`.

```ts
import { initWorker } from "async-multi-worker";

const add = (a: number, b: number) => a + b;
const sub = (a: number, b: number) => a - b;

const calc = { add, sub };

export type Calculator = typeof calc;

initWorker(calc);
```

### main.ts

Use `DedicatedWorker` or `ElasticWorker` depending on your needs.

```ts
import { ElasticWorker } from "async-multi-worker";
import type { Calculator } from "./worker.ts";

const workerUrl = new URL("./worker.ts", import.meta.url);
const elasticWorker = new ElasticWorker(workerUrl);

const addition = elasticWorker.func("add");
const subtract = elasticWorker.func("sub");

const addResult = await addition(1, 2); // runs `add` in a worker thread
const subResult = await subtract(5, 3); // runs `sub` in a worker thread
```

**Flow (at a glance):**

```
main.ts → DedicatedWorker/ElasticWorker → worker.ts (your functions)
```

> **Bundler notes:** The `new URL("./worker.ts", import.meta.url)` pattern works in ESM-aware bundlers (Vite/Rollup) and Node ESM. For other setups, ensure your bundler handles worker assets accordingly.

---

## DedicatedWorker

A `DedicatedWorker` runs in a **single worker thread**.
It can maintain **persistent state**, but tasks are executed sequentially (queued).

### API

| Property    | Type     | Params     | Return   | Description                                   |
| ----------- | -------- | ---------- | -------- | --------------------------------------------- |
| `busy`      | boolean  | –          | –        | Indicates if the worker is currently busy     |
| `func`      | function | `funcName` | function | Returns a callable function by name           |
| `terminate` | function | –          | –        | Terminates the worker and stops any execution |

### Example

**worker.ts**

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

Alternatively, you can implement it like below, depending on your preference:

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

**main.ts**

```ts
import { DedicatedWorker } from "async-multi-worker";
import type { Calculator } from "./worker.ts";

const workerUrl = new URL("./worker.ts", import.meta.url);
const dedicatedWorker = new DedicatedWorker(workerUrl);

const add = dedicatedWorker.func("add");
const lastResult = dedicatedWorker.func("lastResult");

await add(10, 20);
console.log(await lastResult()); // 30
```

---

## ElasticWorker

A `ElasticWorker` can **spawn multiple workers on demand**, making it ideal for parallel tasks.
Workers are terminated automatically when idle (beyond your configured idle limit).

### Features

- Non-blocking: spawns workers as needed.
- Auto-terminates extra idle workers (configurable).
- Per-call timeout support (default `5000ms`, use `Infinity` to disable).

### API

| Property    | Type     | Params                  | Return   | Description                                                                |
| ----------- | -------- | ----------------------- | -------- | -------------------------------------------------------------------------- |
| `func`      | function | `funcName`, `timeoutMs` | function | Returns a callable function by name, with optional timeout in milliseconds |
| `terminate` | function | –                       | –        | Terminates all active worker threads                                       |

### Example

This example focuses on the additional features of the ElasticWorker class.
Let's use the same code for `worker.ts` as in [Usage](#usage):

**main.ts**

```ts
import { ElasticWorker, TimeoutError } from "async-multi-worker";

const workerUrl = new URL("./worker.ts", import.meta.url);
const elasticWorker = new ElasticWorker(workerUrl, 2); // keep up to 2 idle workers

const add = elasticWorker.func("add", 2000); // 2000ms timeout

try {
  const result = await add(1, 2);
  console.log("Result:", result);
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error("Function execution timed out", error);
  } else {
    console.error("Unexpected error", error);
  }
}
```

---

## Configuration

`ElasticWorker` constructor:

```ts
new ElasticWorker(workerUrl: URL, maxIdleWorkers?: number)
```

| Option           | Default | Description                                  |
| ---------------- | ------- | -------------------------------------------- |
| `maxIdleWorkers` | `5`     | Max number of non-busy workers to keep alive |

Per-call timeout (optional) is set when obtaining a function:

```ts
const fn = elasticWorker.func(
  "taskName",
  timeoutMs /* default 5000; use Infinity to disable */
);
```

---

## Contributing

Contributions are welcome!

1. Fork the repo
2. Create a feature branch
3. Run tests with `npm test`
4. Open a Pull Request

---

## License

MIT
