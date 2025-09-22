# elastic-worker

![npm version](https://img.shields.io/npm/v/elastic-worker)
![npm downloads](https://img.shields.io/npm/dm/elastic-worker)
![license](https://img.shields.io/npm/l/elastic-worker)

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [registerWorker](#registerworker)
- [ElasticWorker](#elasticworker)
- [DedicatedWorker](#dedicatedworker)
- [Errors](#errors)
- [Benchmark](#benchmark)
- [License](#license)

## Overview

`elastic-worker` provides a simple and unified abstraction over **Web Workers** (browser) and **Worker Threads** (Node.js).

It enables developers to run CPU-intensive or blocking tasks in worker threads **without manually handling worker setup, messaging, or lifecycle management**.

This package exports:

- [`registerWorker`](#registerworker) — register functions inside a worker context
- [`ElasticWorker`](#elasticworker) — scalable worker pool for parallel execution
- [`DedicatedWorker`](#dedicatedworker) — single persistent worker that can maintain state

## Installation

```bash
npm install elastic-worker
```

## Quick Start

Organize your project with a **separated worker file**:

```
src/
 worker.ts
 main.ts
```

#### 1. Define worker functions (`worker.ts`)

```ts
import { registerWorker } from "elastic-worker";

const add = (a: number, b: number) => a + b;
const sub = (a: number, b: number) => a - b;

const calc = { add, sub };

export type Calculator = typeof calc;

// Register functions for worker usage
registerWorker(calc);
```

#### 2. Use them from the main thread (`main.ts`)

```ts
import { ElasticWorker } from "elastic-worker";
import type { Calculator } from "./worker.ts";

const workerUrl = new URL("./worker.ts", import.meta.url);
const elasticWorker = new ElasticWorker<Calculator>(workerUrl);

const add = elasticWorker.func("add");
const subtract = elasticWorker.func("sub");

const addResult = await add(1, 2); // runs in worker
const subResult = await subtract(5, 3); // runs in worker
```

### Flow at a Glance

```
main.ts  →  ElasticWorker / DedicatedWorker  →  worker.ts (your functions)
```

## Architecture

- **Main thread**: Creates and manages worker instances.
- **Worker thread**: Contains your registered functions. Communication happens via `postMessage` under the hood.
- **ElasticWorker**: Spawns multiple workers on demand, scales up/down based on load.
- **DedicatedWorker**: Runs a single worker, useful for stateful tasks.

## registerWorker

Registers functions inside a worker context.

> [!CAUTION]  
> Functions and variables defined in the worker file where `registerWorker` is called **cannot** be directly imported into the main thread.  
> They must be accessed through a worker wrapper (`ElasticWorker` or `DedicatedWorker`).

```ts
registerWorker(functionsObject);
```

## ElasticWorker

An `ElasticWorker` can **scale horizontally** by spawning multiple workers.  
It is ideal for parallel, independent tasks (e.g., CPU-bound batch jobs).

### Constructor

```ts
new ElasticWorker(url, options);
```

- `url` — URL to the worker file
- `options` — configuration object (see below)

**Example (ESM):**

```ts
const workerUrl = new URL("./worker.ts", import.meta.url);
const elasticWorker = new ElasticWorker(workerUrl, {
  minWorkers: 2,
  maxWorkers: 4,
  maxQueueSize: 1000,
  terminateIdleDelay: 1000,
});
```

**Example (CJS):**

```ts
import path from "path";
import { pathToFileURL } from "url";

const workerUrl = pathToFileURL(path.resolve("./worker.js"));
const elasticWorker = new ElasticWorker(workerUrl);
```

### Options

- **minWorkers** (default: `1`) — Minimum idle workers to keep alive, prevents cold starts.
- **maxWorkers** (default: `4`) — Maximum worker instances allowed.
- **maxQueueSize** (default: `Infinity`) — Maximum tasks queued while workers are busy.
- **terminateIdleDelay** (default: `500` ms) — Idle timeout before terminating extra workers.

### Properties

- **pool** _(read-only)_ — Current worker pool.
- **queue** _(read-only)_ — Pending task queue.

### Methods

#### `func`

Creates a callable wrapper around a worker function.

```ts
const controller = new AbortController();

const add = elasticWorker.func("add", {
  timeoutMs: 10000,
  signal: controller.signal,
});
```

Parameters:

- `funcName` — Registered worker function name
- `options`:
  - `timeoutMs` (default: `5000`) — Call timeout
  - `signal` — [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) for cancellation

#### `terminate`

Gracefully terminates all workers and clears the queue.  
Use this if you’re finished with the worker pool.

```ts
await elasticWorker.terminate();
```

## DedicatedWorker

A `DedicatedWorker` runs in a **single worker thread**.  
Unlike `ElasticWorker`, it can maintain **internal state** across calls, but state is lost if the worker crashes or is terminated.

### Constructor

```ts
new DedicatedWorker(url, options);
```

- `url` — URL to the worker file
- `options`:
  - `maxQueueSize` (default: `Infinity`) — Max queued tasks

### Properties

- **busy** _(read-only)_ — Worker is currently executing a task
- **queue** _(read-only)_ — Pending tasks
- **isTerminated** _(read-only)_ — Worker termination status

### Methods

#### `func`

Creates a callable function mapped to a worker function.

```ts
const add = dedicatedWorker.func("add");
```

#### `terminate`

Stops the worker and clears queued tasks.

```ts
await dedicatedWorker.terminate();
```

#### `respawn`

Restarts a terminated worker.

```ts
dedicatedWorker.respawn();
```

### Example

**worker.ts**

```ts
import { registerWorker } from "elastic-worker";

export class Calculator {
  result: number;

  add = (a, b) => (this.result = a + b);
  sub = (a, b) => (this.result = a - b);
  lastResult = () => this.result;
}

const calculator = new Calculator();
registerWorker(calculator);
```

**main.ts**

```ts
import { DedicatedWorker } from "elastic-worker";
import type { Calculator } from "./worker.ts";

const workerUrl = new URL("./worker.ts", import.meta.url);
const dedicatedWorker = new DedicatedWorker(workerUrl);

const add = dedicatedWorker.func("add");
const lastResult = dedicatedWorker.func("lastResult");

await add(10, 20);
console.log(await lastResult()); // 30
```

## Errors

- **TimeoutError** — Worker call exceeded timeout
- **QueueOverflowError** — Task queue limit reached
- **AbortedError** — Worker call was cancelled
- **WorkerTerminatedError** — Worker was terminated
- **FunctionNotFoundError** — Function not registered in worker

## Benchmark

Comparison of **main thread**, **ElasticWorker**, and **DedicatedWorker** (Fibonacci benchmark).

```log
Main thread:     597.24 ms
Elastic worker:   81.62 ms
Dedicated worker: 605.02 ms
```

- **Elastic vs Main** → ~7.3× faster
- **Dedicated vs Main** → ~1.3% slower (but non-blocking)

Benchmark may vary depending on the number of threads allowed and the type of task being executed.
See [`examples/js/benchmark.js`](./examples/js/benchmark.js) for details.

## License

MIT
