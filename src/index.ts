import { fast as uuid } from 'fast-unique-id';
import { ChildProcess } from 'child_process';
import { Worker as ClusterWorker } from 'cluster';

type Response = (...args: any) => void;
type Handler = (req: any, res?: Response) => void;
type SendJob = (method: string, req: any, res?: Response) => void;
type Destination = cpcChildProcess | cpcClusterWorker | NodeJS.Process;

declare global {
    interface cpcChildProcess extends ChildProcess {
        sendJob: SendJob;
    }
    interface cpcClusterWorker extends ClusterWorker {
        sendJob: SendJob;
    }
}

export default class CPC {
    private response: {
        [id: string]: Response;
    } = {};
    private handler: {
        M: { [method: string]: Handler };
        W: { [method: string]: Handler };
    } = { M: {}, W: {} };

    constructor() {
        process.on('message', msg => {
            if (msg.t !== 'cpc') return;
            switch (msg.d) {
                case 'M':
                    if (!this.response[msg.i]) return;
                    this.response[msg.i](...msg.a);
                    delete this.response[msg.i];
                    break;
                case 'W':
                    if (this.handler[msg.d][msg.m])
                        this.handler[msg.d][msg.m](msg.r, (...args: any) =>
                            (function send() {
                                process.send({
                                    t: 'cpc',
                                    d: msg.d,
                                    i: msg.i,
                                    a: args
                                }, (err: Error) => {
                                    if (err) setTimeout(send, 500);
                                });
                            })()
                        );
                    break;
            }
        });
    }

    tunnel<T extends ChildProcess | ClusterWorker>(worker: T): T extends ChildProcess ? cpcChildProcess : cpcClusterWorker {
        worker.on('message', (msg: any) => {
            if (msg.t !== 'cpc') return;
            switch (msg.d) {
                case 'M':
                    if (this.handler[msg.d][msg.m])
                        this.handler[msg.d][msg.m](msg.r, (...args: any) =>
                            (function send() {
                                worker.send({
                                    t: 'cpc',
                                    d: msg.d,
                                    i: msg.i,
                                    a: args
                                }, null, (err) => {
                                    if (err) setTimeout(send, 500);
                                });
                            })()
                        );
                    break;
                case 'W':
                    if (!this.response[msg.i]) return;
                    this.response[msg.i](...msg.a);
                    delete this.response[msg.i];
                    break;
            }
        });
        worker['sendJob'] = (method: string, req: any, res?: Response) =>
            this.sendJob(method, req, res, worker as any, 'W');

        return worker as any;
    }

    sendJob(method: string, req: any, res?: Response, destination: Destination = process, to = 'M') {
        if (res) {
            const id = uuid();
            destination.send({
                t: 'cpc',
                d: to,
                m: method,
                i: id,
                r: req
            }, (err: Error) => {
                if (err) setTimeout(() => this.sendJob(method, req, res, destination, to), 500);
                else this.response[id] = res;
            });

        } else destination.send({
            t: 'cpc',
            d: to,
            m: method,
            r: req
        }, (err: Error) => {
            if (err) setTimeout(() => this.sendJob(method, req, res, destination, to), 500);
        });
    }

    onWorker(method: string, handler: Handler) {
        this.handler['M'][method] = handler;
        return this
    }

    onMaster(method: string, handler: Handler) {
        this.handler['W'][method] = handler;
        return this
    }
}