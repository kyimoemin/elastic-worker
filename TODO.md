# async-multi-worker

## feature

- [ ] respawn new worker thread and carry data when DedicatedWorker is terminated
- [ ] use SharedBufferArray for ElasticWorker
- [x] allow path url
- [x] enable cjs

## fix

- [x] worker terminated error

## Nodejs support

following places are needed to change

- [x] worker
- [x] init-worker
- [x] worker-manager
- [x] dedicated-worker
- [x] dynamic worker
- [x] add test script in github action

## use Rollup

- [x] build is still importing browser env in dist
