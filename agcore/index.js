let configPath = null;
let app = null;

const config = require('./data/config');

const File = require('./routes/file');
const Api = require('./routes/api');
const Auth = require('./routes/auth.jwt');
const Captcha = require('./routes/captcha');
const Index = require('./routes/index');

class agcore {
    constructor({ app }) {
        this.app = app;

        this.initRoutes();
    }

    initRoutes() {
        this.app.use('/file', File);
        this.app.use('/api', Api);
        this.app.use('/auth', Auth);
        this.app.use('/captcha', Captcha);
        this.app.use('/*', Index);
    }
}

module.exports = agcore;
