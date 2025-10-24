# CHANGELOG

## 1.4.1

- update document

## 1.4.0

- added `Transfer` class, support for [Transferable Objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)
- soft remove DedicatedWorker class

## 1.3.3

- rename `initWorker` to `registerWorker`
- rename package to `elastic-worker`

## 1.3.0

- bug fixes

### WorkerPool

- added delay before terminating idle worker

### DedicatedWorker

- used queue for pending calls
- expose readonly queue
- added isTerminated flag and respawn function

### ElasticWorker

- added min/max worker
- added pending queue
- added max queue size
- expose readonly worker pool
- expose readonly pending queue
- AbortSignal support

## 1.2.2

- CJS support
- Nodejs support
- use rollup
