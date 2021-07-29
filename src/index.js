'use strict';
const {Worker} = require("worker_threads");

const tcpPortUsed = require('tcp-port-used');

const bodyParser = require('body-parser');
const app = require('express')();

// load config, set defaults
const cfg = require('../config.json');
if (cfg.onlyLastTrigger === undefined || cfg.onlyLastTrigger == null) {
    cfg.onlyLastTrigger = true;
}

const port = cfg.port | 4444;

// prepare excutor thread
const worker = new Worker("./src/executor.js");
worker.on("message", result => {
    console.log('###################################################');
    console.log('worker done');
    console.log(JSON.stringify(result, null, 2));
});

worker.on("exit", exitCode => {
    console.log('Worker exit code:', exitCode);
});

worker.on("error", error => {
    console.log('Worker error:', error);
});

// -----------------------------------------
// app itself
(async () => {
    // check port
    const inUse = await tcpPortUsed.check(port)
    if (inUse) {
        console.log(`Port ${port} in use, wait 120 seconds for release`);
        await tcpPortUsed.waitUntilFree(port, 500, 120 * 1000)
    }

    // set up webserver
    const urlencodedParser = bodyParser.urlencoded({extended: false})
    app.use(bodyParser.json());
    app.use(urlencodedParser);
    app.post('/', function (req, res, next) {
        const params = req.body;

        // check matching values
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

        // send message with new job to worker thread
        const data = {
            cfg,
            job: {
                ref: params.ref,
                sha: params.sha,
                repo: params.repo
            }
        }

        console.log('send Job')
        worker.postMessage(data);

        res.end();
    })
    app.listen(4444);
})();
