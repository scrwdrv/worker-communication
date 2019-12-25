# worker-communication
 This module provide bilateral communication with callback between cluster worker and master, node.js child process is supported too.


## Installation
```sh
npm i worker-communication
```

## Usage

### Master
```js
import CPC from 'worker-communication';
import * as cluster from 'cluster';
// or       childProcess from 'child_process'

const cpc = new CPC();

const worker = cpc.tunnel(cluster.fork())
// or          cpc.tunnel(childProcess.fork('./worker.js'));

cpc.onWorker('requestJob', (req, res) => {
    res({
        reqHeader: req,
        timestamp: Date.now()
    }, null);
});

worker.sendJob('idle', 'just relax...');
```

### Worker (cluster worker or ```child_process.fork()```)
```js
import CPC from 'worker-communication';

const cpc = new CPC(); 

cpc.onMaster('idle', (req) => {
    console.log(req);
    // output: just relax...
});

let reqHeader = [123, 456];

cpc.sendJob('requestJob', reqHeader, (jobHeader, job) => {
    console.log(jobHeader);
    // output: { reqHeader: [123, 456], timestamp: 1577252484830 }
    console.log(job);
    // output: null
});
```

> Master & worker is relative, a worker can also be a master to the process it forks.
> So in this scenario, ```onMater()``` and ```onWorker()``` can be used at the same time to communicate its master and worker.