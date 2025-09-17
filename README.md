# async-multi-worker

![npm version](https://img.shields.io/npm/v/async-multi-worker)
![npm downloads](https://img.shields.io/npm/dm/async-multi-worker)
![license](https://img.shields.io/npm/l/async-multi-worker)

## Table of Content

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [initWorker](#initworker)
- [ElasticWorker](#elasticworker)
- [DedicatedWorker](#dedicatedworker)
- [Errors](#errors)
- [Contributing](#contributing)
- [License](#license)

## Overview

`async-multi-worker` provides a simple abstraction over **Web Workers** (browser) and **Worker Threads** (Node.js).
It lets you offload CPU‑intensive or blocking tasks to workers **without manually handling worker setup or lifecycle**.

This package exports two worker classes: [DedicatedWorker](#dedicatedworker) and [ElasticWorker](#elasticworker). and [initWorker](#initworker) function

## Installation

```bash
npm i async-multi-worker
```

## Quick Start

Create a separate file for the worker context.

```
src/
  worker.ts
  main.ts
```

Define your functions and pass them to `initWorker` in your `worker.ts`.

##### worker.ts

```ts
import { initWorker } from "async-multi-worker";

const add = (a: number, b: number) => a + b;
const sub = (a: number, b: number) => a - b;

const calc = { add, sub };

export type Calculator = typeof calc;

// load worker functions
initWorker(calc);
```

Use `ElasticWorker` in your `main.ts`

##### main.ts

```ts
import { ElasticWorker } from "async-multi-worker";
import type { Calculator } from "./worker.ts";

const workerUrl = new URL("./worker.ts", import.meta.url);
const elasticWorker = new ElasticWorker<Calculator>(workerUrl);

const addition = elasticWorker.func("add");
const subtract = elasticWorker.func("sub");

const addResult = await addition(1, 2); // runs `add` in a worker thread
const subResult = await subtract(5, 3); // runs `sub` in a worker thread
```

**Flow (at a glance):**

```diagram
main.ts → ElasticWorker/DedicatedWorker → worker.ts (your functions)
```

---

## initWorker

This function is used to load worker functions of your [worker](#workerts) file.

> [!CAUTION]
> Functions and variables of [worker](#workerts) file where `initWorker` is called cannot be exported and used in main thread.

```js
initWorker(funcWrapperObj);
```

---

## ElasticWorker

A `ElasticWorker` can **spawn multiple workers on demand**, making it ideal for parallel tasks.

### Constructor

ElasticWorker constructor accept two parameters, `url` and `options`. It can accept the object type of a worker that is set in `initWorker` of a worker file. see [Quick Start](#quick-start) example.

```js
new ElasticWorker(url, options);
```

#### Parameters

##### `url`

An [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL) object of worker file.

```js
const workerUrl = new URL("./worker.ts", import.meta.url);
const ew = new ElasticWorker(workerUrl, {
  minWorkers: 2,
  maxWorkers: 4,
  maxQueueSize: 1000,
  terminateIdleDelay: 1000,
});
```

or you can write this way if you are using CJS module.

```js
import path from "path";
import { pathToFileURL } from "url";

const workerUrl = pathToFileURL(path.resolve("./worker.js"));
const elasticWorker = new ElasticWorker(workerUrl);
```

#### `options`

An object containing option properties that can be set when creating ElasticWorker instance. Available properties are follows:

- `minWorkers` (default `1`) — Minimum number of idle workers to keep alive. It is recommended to set at least 1 minimum worker to prevent any hot start when worker function is called.

- `maxWorkers` (default `4`) — Maximum number of busy worker allowed. **ElasticWorker** spawn workers on demand so to prevent from spawning unlimited worker and taking too much resources we should set some limit for the maximum spawnable workers.
- `maxQueueSize` (default `Infinity`) — Maximum number of tasks allow in the call queue. If all available workers are busy and already at the `maxWorker`limit, the upcoming calls will be wait in a call queue, you can set a maximum limit to that call queue.
- `terminateIdleDelay` (default `500`ms) — Time to wait in milliseconds before terminating an idle worker. If number idle workers exceed the limit of `minWorker` will be terminated after a delay of `terminatedIdleDelay`.

### Properties

- `pool` — A pool of workers. _This property is exposed for debugging purpose only do not use it to manage worker pool._
- `queue` — A list of all pending calls waiting in a call queue to be process by available workers. _This property is exposed for debugging purpose only do not use it to manage call queue._

### Methods

#### `func`

A function that returns a callable function of a worker. It accept 2 parameters.

```js
const controller = new AbortController();

elasticWorker.func("add", { timeoutMs: 10000, signal: controller.signal });
```

##### Function Parameters

- `funcName` — function name in a worker that will be called from main thread.
- `options` — object options for that function call
  - `timeoutMs` (default `5000`ms) — timeout of a function in milliseconds
  - `signal` (optional) — [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) for the function

#### `terminate`

Terminate all worker in the worker poll and clear the pending call queue. _Only use this function when you are sure that you no longer needed that worker and doesn't care about pending calls anymore_

```js
await elasticWorker.terminate();
```

---

## DedicatedWorker

A `DedicatedWorker` runs in a **single worker thread**.
It can maintain **state** since it is using single worker thead, but the state can be lost if that worker is crashed or terminated. I recommend to use **ElasticWorker** with managing state in main thread.

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

// export this class so it can be imported as a type in main.ts
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

---

## Errors

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
