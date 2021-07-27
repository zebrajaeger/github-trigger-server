'use strict';
const {Worker} = require("worker_threads");

const tcpPortUsed = require('tcp-port-used');

const bodyParser = require('body-parser');
const app = require('express')();

const cfg = require('../config.json');
console.log(cfg);

const worker = new Worker("./executor.js");
worker.on("message", result => {
    console.log('worker done');
    console.log(JSON.stringify(result,null,2));
});

(async () => {
    const inUse = await tcpPortUsed.check(4444)
    console.log('Port 4444 usage: ' + inUse);
    if (inUse) {
        await tcpPortUsed.waitUntilFree(4444, 500, 120 * 1000)
    }

    const urlencodedParser = bodyParser.urlencoded({extended: false})
    app.use(bodyParser.json());
    app.use(urlencodedParser);
    app.post('/', function (req, res, next) {
        const params = req.body;

        if (cfg.key && cfg.key !== params.key) {
            console.log('key failed')
            next();
            return;
        }

        if (cfg.ref && cfg.ref !== params.ref) {
            console.log('ref failed')
            next();
            return;
        }

        if (cfg.repo && cfg.repo !== params.repo) {
            console.log('repo failed')
            next();
            return;
        }

        const data = {
            ref: params.ref,
            sha: params.sha,
            repo: params.repo
        }

        console.log('send Job')
        worker.postMessage(data);

        res.end();
    })
    app.listen(4444);
})();
