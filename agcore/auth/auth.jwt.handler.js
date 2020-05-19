const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const config = require('../data/config');
const repository = require('./../data/db/repository');
const Errors = require('../core/errors');

const { access, awaitAccess } = require('./access');

const login = async (username, password) => {
    const accounts = await repository.getList('Account', { email: username.toLowerCase() });

    if (accounts.length === 0) throw new Errors.UserNotFound();

    const users = await repository.getList('User', { account_id: accounts[0].id });

    const account = accounts[0];
    const user = users[0];

    const isValid = bcrypt.compareSync(password, account.password);

    if (isValid) {
        const token = jwt.sign(user ? user : { email: account.username }, config.jwtSecret, { expiresIn: '60d' });

        const userAccess = await awaitAccess(user.id);

        return { token, user, isAdmin: users[0].is_admin, access: userAccess };
    } else {
        throw new Errors.AuthError();
    }
};

const check = async ({ token }) => {
    const decodedUser = jwt.verify(token, config.jwtSecret);

    const users = await repository.getList('User', { account_id: decodedUser.account_id });
    const accounts = await repository.getList('Account', { id: decodedUser.account_id });

    const userAccess = access(users[0].id);

    return { user: users[0], isAdmin: users[0].is_admin, access: userAccess };
}

const getUserFromReq = async (req) => {
    const authToken = req.headers.authorization;
    const token = authToken.replace('Bearer ', '');

    const { user } = await check({ token });
    return user;
}



module.exports = { login, check, getUserFromReq };
