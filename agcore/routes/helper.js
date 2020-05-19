let helper = {
    error401: function error401(res) {
        return function (err) { res.send(401, 'Не авторизован'); }
    },



    error403: function error403(res) {
        return function (err) { res.send(403, 'Доступ запрещен'); }
    },

    error500: function error500(res) {
        return function (err) {
            let status = 500;
            if (err && err.status) status = err.status;
            res.send(status, { message: 'Внутренняя ошибка сервера', error: err });
        }
    },

    ok: function ok(res, f) {
        return function (data) {
            if (!f)
                res.send({ ok: 'ok' });
            else res.send(data);
        }
    }
}

module.exports = helper;