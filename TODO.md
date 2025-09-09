# async-multi-worker

## feature

- [x] allow path url
- [x] enable cjs

## fix

- [x] worker terminated error

## Nodejs support

following places are needed to change

- [x] worker
- [x] init-worker
- [x] worker-pool
- [x] dedicated-worker
- [x] dynamic worker
- [x] add test script in github action

## use Rollup

- [x] build is still importing browser env in dist

## tests

- [ ] queue

## improvements

- [x] rename worker manager to worker pool

### dedicated worker

- [ ] ditch state fulness for the sake of respawn
- [ ] max queue size
- [ ] expose queue length
- [x] respawn worker on error(data transfer helper function might needed)

### elastic worker

- [ ] add call queue
- [ ] support AbortSignal
- [ ] min idle workers
- [ ] hot start min worker on start
- [ ] expose queue length
- [ ] max queue size
- [ ] max workers
- [ ] expose workers length
