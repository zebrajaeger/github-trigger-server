'use strict';

const {parentPort} = require("worker_threads");
const {exec} = require("child_process");

const todo = [];
let running = false;

parentPort.on("message", data => {
    console.log('message()')

    if (data.cfg.onlyLastTrigger && todo.length > 0) {
        console.log('message() * clean queue')
        todo.length = 0;
    }

    console.log('message() * add to queue')
    todo.push(data);

    trigger();
});

function trigger() {
    console.log('trigger()')
    if (running) {
        console.log('trigger() * already running')
        return;
    }
    console.log('trigger() * start executor')

    running = true;
    setTimeout(() => exec())
}

function exec() {
    console.log('executor()')

    if (todo.length === 0) {
        console.log('  * no job')
        return;
    }

    console.log('executor() * start job')
    const data = todo.shift();
    const result = runJob(data);
    console.log('executor() * finished job, post result')

    parentPort.postMessage({data, result});

    running = false;
    trigger();
}

function runJob(data) {
    console.log('runJob()')
    const result = {};

    const cmd = data.cfg.command
    const env = {GH_REF: data.job.ref, GH_REPO: data.job.repo, GH_SHA: data.job.sha};
    exec(cmd, env, (error, stdout, stderr) => {
        result.error = error;
        result.stderr = stderr;
        result.out = stdout;

        if (error) {
            console.log(`runJob() * error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`runJob() * stderr: ${stderr}`);
            return;
        }

        if (stdout) {
            console.log(`runJob() * stdout: ${stdout}`);
        }
    });
}
