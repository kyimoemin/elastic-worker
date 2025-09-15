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

---

## improvements

- [x] rename worker manager to worker pool
- [x] add remove message listener in both dedicated/elastic worker

### dedicated worker

- [x] use queue for calls, it will solve needing to remove the call that make the worker crash
- [x] expose readonly queue
- [x] put some flag for terminated worker
- [x] max queue size
- [x] expose queue length
- [x] respawn worker on error(data transfer helper function might needed)

### elastic worker

- [x] min workers
- [x] max workers
- [x] expose readonly workers
- [x] hot start min worker on start
- [x] add call queue
- [x] expose readonly queue
- [x] max queue size
- [x] make shrinking pool on idle worker in timeout so it won't happen terminate and start process happen
- [x] support AbortSignal to function, make the second param object

## tests

- [ ] queue
