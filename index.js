"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fast_unique_id_1 = require("fast-unique-id");
class CPC {
    constructor() {
        this.response = {};
        this.handler = { M: {}, W: {} };
        process.on('message', msg => {
            if (msg.t !== 'cpc')
                return;
            switch (msg.d) {
                case 'M':
                    if (!this.response[msg.i])
                        return;
                    this.response[msg.i](...msg.a);
                    delete this.response[msg.i];
                    break;
                case 'W':
                    if (this.handler[msg.d][msg.m])
                        this.handler[msg.d][msg.m](msg.r, (...args) => (function send() {
                            process.send({
                                t: 'cpc',
                                d: msg.d,
                                i: msg.i,
                                a: args
                            }, (err) => {
                                if (err)
                                    setTimeout(send, 500);
                            });
                        })());
                    break;
            }
        });
    }
    tunnel(worker) {
        worker.on('message', (msg) => {
            if (msg.t !== 'cpc')
                return;
            switch (msg.d) {
                case 'M':
                    if (this.handler[msg.d][msg.m])
                        this.handler[msg.d][msg.m](msg.r, (...args) => (function send() {
                            worker.send({
                                t: 'cpc',
                                d: msg.d,
                                i: msg.i,
                                a: args
                            }, null, (err) => {
                                if (err)
                                    setTimeout(send, 500);
                            });
                        })());
                    break;
                case 'W':
                    if (!this.response[msg.i])
                        return;
                    this.response[msg.i](...msg.a);
                    delete this.response[msg.i];
                    break;
            }
        });
        worker['sendJob'] = (method, req, res) => this.sendJob(method, req, res, worker, 'W');
        return worker;
    }
    sendJob(method, req, res, destination = process, to = 'M') {
        if (res) {
            const id = fast_unique_id_1.fast();
            destination.send({
                t: 'cpc',
                d: to,
                m: method,
                i: id,
                r: req
            }, (err) => {
                if (err)
                    setTimeout(() => this.sendJob(method, req, res, destination, to), 500);
                else
                    this.response[id] = res;
            });
        }
        else
            destination.send({
                t: 'cpc',
                d: to,
                m: method,
                r: req
            }, (err) => {
                if (err)
                    setTimeout(() => this.sendJob(method, req, res, destination, to), 500);
            });
    }
    onWorker(method, handler) {
        this.handler['M'][method] = handler;
        return this;
    }
    onMaster(method, handler) {
        this.handler['W'][method] = handler;
        return this;
    }
}
exports.default = CPC;
//# sourceMappingURL=index.js.map