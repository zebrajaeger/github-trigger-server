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

function setRunning(isRunning){
    console.log('setRunning()', isRunning)
    running = isRunning;
}

function isRunning(){
    return running;
}

function trigger() {
    console.log('trigger()', isRunning())
    if (isRunning()) {
        console.log('trigger() * already running')
        return;
    }
    console.log('trigger() * start executor')

    setRunning(true);
    setTimeout(() => jobExecutor())
}

async function jobExecutor() {
    console.log('executor()')

    if (todo.length === 0) {
        console.log('  * no job');
        setRunning(false);
        return;
    }

    console.log('executor() * start job')
    const data = todo.shift();
    try {
        const result = await runJob(data);
        console.log('executor() * finished job, post result')
         parentPort.postMessage({data, result});
    } catch (error) {
        console.log('executor() * job failed with error, post result')
        parentPort.postMessage({data, result: {error}});
    } finally {
        console.log('set running = false')
        setRunning(false);
    }

    trigger();
}

async function runJob(data) {
    return new Promise((resolve, reject) => {

        try {
            console.log('runJob()')
            const result = {};

            const cmd = data.cfg.command
            const env = {
                GH_REF: data.job.ref,
                GH_REPO: data.job.repo,
                GH_SHA: data.job.sha,
                ...process.env
            };

            exec(cmd, {env}, (error, stdout, stderr) => {
                result.error = error;
                result.stderr = stderr;
                result.out = stdout;

                if (error) {
                    console.log(`runJob() * error: ${error.message}`);
                    resolve(result)
                    return;
                }
                if (stderr) {
                    console.log(`runJob() * stderr: ${stderr}`);
                    resolve(result)
                    return;
                }

                if (stdout) {
                    console.log(`runJob() * stdout: ${stdout}`);
                }
                resolve(result);
            });
        } catch (e) {
            console.log(`runJob() * EXCEPTION: ${e}`);
            reject(e)
        }
    })
}
