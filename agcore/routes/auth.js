var express = require('express');
var router = express.Router();
const url = require('url');
const repository = require('./../data/db/repository');
const listboxes = require('./../data/listboxes');
const authHandler = require('../auth/auth.handler');
const helper = require('./helper');

router.post('/logout', (req, res, next) => {
    let data = req.body;
    let userid = req.cookies['userid'];
    authHandler.logout(userid)
        .then(data => {
            res.clearCookie("userid");
            helper.ok(res)();
        })
        .catch(err => {
            res.send(500, err);
        });
});

router.post('/login', (req, res, next) => {
    let data = req.body;
    authHandler.login(data.username, data.password)
        .then(data => {
            res.cookie("userid", data.userid, { maxAge: data.remember ? 60000 * 24 * 30 : 60000 * 60 * 24 });
            helper.ok(res)();
        })
        .catch(err => {
            res.send(500, err);
        });
});

router.post('/registration', (req, res, next) => {
    let data = req.body;
    authHandler.registration(data.username, data.password)
        .then(helper.ok(res, true))
        .catch(helper.error401(res));
});

router.post('/confirm', (req, res, next) => {
    let data = req.body;
    authHandler.confirm(data.guid)
        .then(helper.ok(res, true))
        .catch(helper.error401(res));
});

router.post('/getuser', (req, res) => {
    let data = req.body;
    authHandler.getuser(data)
        .then(helper.ok(res, true))
        .catch(helper.error401(res));
});


module.exports = router;