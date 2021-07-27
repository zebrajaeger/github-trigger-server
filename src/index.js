const tcpPortUsed = require('tcp-port-used');

const bodyParser = require('body-parser');
const app = require('express')();

const cfg = require('../config.json');
console.log(cfg);


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

        console.log('TRIGGER')
        // const chunk = JSON.stringify(req.body, null, 2);
        // console.log(chunk);
        res.end();
    })
    app.listen(4444);
})();
