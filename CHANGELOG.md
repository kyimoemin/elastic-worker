# CHANGELOG

## 1.2.2

- CJS support
- Nodejs support
- use rollup

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
