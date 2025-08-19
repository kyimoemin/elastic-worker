# async-multi-worker

## Table of Content

- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [DedicatedWorker](#dedicatedworker)
- [DynamicWorker](#dynamicworker)

## Overview

`async-multi-worker` is for using the feature multithreading of a worker, to be able to use in a simple async way without needing to deal with worker code directly. this package exported two worker class, [DedicatedWorker](#dedicatedworker) and [DynamicWorker](#dynamicworker). Both has pros and cons choose one of them depending on your need.

| Worker          | Pros             | Cons                 |
| --------------- | ---------------- | -------------------- |
| DedicatedWorker | persistent state | blocking             |
| DynamicWorker   | non-blocking     | non-persistent state |

## Installation

```bash
 npm i async-multi-worker
```

## Usage

You have to create separate file for worker context to be able to use it. e.g., let assume we have this folder structure.

```tree
src /
	├─ worker.ts
	└─  main.ts
```

In `worker.ts` file you write functions and combine them in an object and pass that object to `initWorker` function.

worker.ts

```ts
import { initWorker } from "async-multi-worker";

const add = (a, b) => a + b;
const sub = (a, b) => a - b;

const calc = { add, sub };

export type Calculator = typeof calc;

initWorker(calc);
```

and that's it you created a worker file that will be run in worker thread.

and now we will use it in our code, the package provided two type of worker that we can use. [DedicatedWorker](#dedicatedworker) or [DynamicWorker](#dynamicworker) depending on your need. e.g.,

main.ts

```ts
import { DynamicWorker } from "async-multi-worker";
import type { Calculator } from "./worker.ts";

const workerUrl = new URL("./worker.ts", import.meta.url);

const dedicatedWorker = new DynamicWorker(workerUrl);

const addition = dedicatedWorker.func("add");
const subtract = dedicatedWorker.func("sub");

const addResult = await addition(1, 2); // run `add` function of `worker.ts` in worker thread
const subResult = await subtract(1, 2); // run `sub` function of `worker.ts` in worker thread
```

## Two Worker

[DedicatedWorker](#dedicatedworker)

---

## DedicatedWorker

runs in single worker thread, since it always using single worker you can store state in this worker, cons it don't spawn a new worker thread on demand, the new function calls will have to wait until previous execution is finished.

### Properties

| Property    | Type     | Params     | Return   | Description                                                                                                                                                                                 |
| ----------- | -------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `busy`      | boolean  | -          | -        | to check if the worker thread is busy or not                                                                                                                                                |
| `func`      | function | `funcName` | function | to get the function of worker thread, you can pass function name of a worker as `funcName` and it will return a function that can be used to invoke the function of a worker with that name |
| `terminate` | function | -          | -        | terminate the worker thread, it will stop ongoing function execution                                                                                                                        |

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

or you can implement it like this too depending on your preference

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

in this example we are storing the last calculation result in `result` variable. and you can get this in the main thread using `lastResult` function.

main.ts

```ts
import { DedicatedWorker } from "async-multi-worker";
import type { Calculator } from "./worker.ts";

const workerUrl = new URL("./worker.ts", import.meta.url);

const dedicatedWorker = new DedicatedWorker(workerUrl);

const addition = dedicatedWorker.func("add");
const subtract = dedicatedWorker.func("sub");

const addResult = await addition(1, 2); // run `add` function of `worker.ts` in worker thread
const subResult = await subtract(1, 2); // run `sub` function of `worker.ts` in worker thread
```

---

## DynamicWorker

[DynamicWorker](#dynamicworker) can spawn multiple worker on demand, so it can be used for non-blocking works, since it spawns and terminates worker depending on the situation, it cannot store the state in the worker.
it does not have upper bound limit for spawning a new worker, mean a new worker thread will spawn if existing workers are busy. but it has maximum limit for non-busy workers, if the worker is not busy anymore it will be self terminated if there are more worker threads then maximum limit. you can set the maximum non-busy worker limit when creating new DynamicWorker, the default limit is 5. One more advantage with DynamicWorker is you can set timeout on a function call, and it will terminate the execution when timeout and returns timeout error message.

### Properties

| Property    | Type     | Params                  | Return   | Description                                                                                                                       |
| ----------- | -------- | ----------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `func`      | function | `funcName`, `timeoutMs` | function | same as `DedicatedWorker`'s func with extra `timeoutMs` param default is `5000 ms`, you can use `Infinity` to disable the timeout |
| `terminate` | function | -                       | -        | terminate all working worker threads                                                                                              |

### Example

This example focus on additional feature of DynamicWorker class.
lets use the same code for `worker.ts` as [Usage](#usage)

main.ts

```ts
import { DynamicWorker,TimeoutError } from "async-multi-worker";

const workerURL = new URL("./worker.ts",meta.import.);

const dynamicWorker = new DynamicWorker(workerURL,1); // DynamicWorker with 1 max non-busy worker

const addition = dynamicWorker.func("add",2000); // use 2000ms as timeout

try{
 const result = await addition(1,2);
}catch(error){
if(error instanceof TimeoutError)
 console.log(" addition function execution has bee timeout",error);
 else console.log("Unknown error",error)
}

```

---
