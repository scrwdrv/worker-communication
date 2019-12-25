/// <reference types="node" />
import { ChildProcess } from 'child_process';
import { Worker as ClusterWorker } from 'cluster';
declare type Response = (...args: any) => void;
declare type Handler = (req: any, res?: Response) => void;
declare type SendJob = (method: string, req: any, res?: Response) => void;
declare type Destination = cpcChildProcess | cpcClusterWorker | NodeJS.Process;
declare global {
    interface cpcChildProcess extends ChildProcess {
        sendJob: SendJob;
    }
    interface cpcClusterWorker extends ClusterWorker {
        sendJob: SendJob;
    }
}
export default class CPC {
    private response;
    private handler;
    constructor();
    tunnel<T extends ChildProcess | ClusterWorker>(worker: T): T extends ChildProcess ? cpcChildProcess : cpcClusterWorker;
    sendJob(method: string, req: any, res?: Response, destination?: Destination, to?: string): void;
    onWorker(method: string, handler: Handler): this;
    onMaster(method: string, handler: Handler): this;
}
export {};
