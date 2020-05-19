const express = require('express');
const router = express.Router();

const authHandler = require('../auth/auth.jwt.handler');

router.post('/login', (req, res, next) => {
    const { username, password } = req.body;

    authHandler
        .login(username, password)
        .then((data) => res.send(data))
        .catch((err) => {
            console.error(err);
            res.status(err.status || 500).send(err);
        });
});

router.post('/check', (req, res, next) => {
    const authToken = req.headers.authorization;
    const token = authToken.replace('Bearer ', '');

    authHandler
        .check({ token })
        .then((data) => res.send(data))
        .catch((err) => {
            console.error(err);
            res.status(err.status || 500).send(err);
        });
});


module.exports = router;
