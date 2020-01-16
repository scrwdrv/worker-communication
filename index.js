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
                        this.handler[msg.d][msg.m](msg.r, (...args) => process.send({
                            t: 'cpc',
                            d: msg.d,
                            i: msg.i,
                            a: args
                        }));
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
                        this.handler[msg.d][msg.m](msg.r, (...args) => worker.send({
                            t: 'cpc',
                            d: msg.d,
                            i: msg.i,
                            a: args
                        }));
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
            this.response[id] = res;
            destination.send({
                t: 'cpc',
                d: to,
                m: method,
                i: id,
                r: req
            });
        }
        else
            destination.send({
                t: 'cpc',
                d: to,
                m: method,
                r: req
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