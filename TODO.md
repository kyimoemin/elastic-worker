# elastic-worker

## 1.3.3

- [x] rename initWorker to registerWorker
- [x] rename package

## 1.4.0

- [x] add transferList option
  - [x] main thread to worker
  - [x] worker to main thread
- [x] remove dedicated worker from the doc
- [x] add doc for transferable
- [x] add example for transferable

## 2.0.0

- [x] remove dedicated worker

## 2.0.2

- [x] changed terminateIdleDelay to idleTimeout
- [x] stop allowing infinity timeout

## 3.0.0

- [x] accept `TaskStore` option
- rename `terminateIdleDelay` to `idleTimeout`
- rename `maxQueueSize` to `maxTasks`

## next version

- [ ] add Highest Priority First queue
  - keep current FIFO, add HPF, let user choose their prefer method in the option e.g., `scheduler:"FIFO"|"HPF"`
