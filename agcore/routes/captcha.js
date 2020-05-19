var express = require('express');
var router = express.Router();

const captchaHelper = require('./../helpers/captcha');;


router.get('/', (req, res, next) => {
    res.send(captchaHelper.generate());
});


function error401(res) {
    return function (err) { res.send(401, 'Не авторизован'); }
}

function error500(res) {
    return function (err) { res.send(500, { message: 'Внутренняя ошибка сервера', error: err }); }
}

function ok(res, f) {
    return function (data) {
        if (!f)
            res.send({ ok: 'ok' });
        else res.send(data);
    }
}

module.exports = router;
