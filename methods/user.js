const controllers = require('../agcore/controllers/base.controller');
const location = require('./location');
const repository = require('../agcore/data/db/repository');
const Op = repository.Sequelize.Op;
const core = require('../agcore/core/core');
const moment = core.moment;
const bcrypt = require('bcryptjs');

const access = require('../agcore/auth/access');

class User {
    static async create(req, data) {
        const { name, surname, patronymic, email, phone, password, language } = data;
        // TODO check req parameters
        // TODO check data parameters

        // create account
        const salt = await bcrypt.genSalt();
        const cryptPassword = await bcrypt.hash(password, salt);

        const account = await repository.update('Account', { email: email.toLowerCase(), password: cryptPassword });

        // create user

        const user = await repository.update('User', {
            name,
            surname,
            email: email.toLowerCase(),
            phone,
            patronymic,
            language,
            account_id: account.id,
        });

        return user;
    }

    static async update(req, data) {
        const { id, name, surname, patronymic, email, phone, password, language } = data;
        // TODO check req parameters
        // TODO check data parameters

        const users = await repository.getList('User', { id });
        if (users.length === 0) throw new Error({ message: 'User not found' });
        const user = users[0];

        // update account
        if (email !== user.email && password && password !== user.password) {
            const salt = await bcrypt.genSalt();
            const cryptPassword = await bcrypt.hash(password, salt);

            await repository.update('Account', {
                id: user.account_id,
                email: email.toLowerCase(),
                password: cryptPassword,
            });
        } else if (email !== user.email) {
            await repository.update('Account', {
                id: user.account_id,
                email: email.toLowerCase(),
            });
        } else if (password && password !== user.password) {
            const salt = await bcrypt.genSalt();
            const cryptPassword = await bcrypt.hash(password, salt);

            await repository.update('Account', {
                id: user.account_id,
                email: email.toLowerCase(),
                password: cryptPassword,
            });
        }

        // update user
        const result = await repository.update('User', {
            id: user.id,
            name,
            surname,
            patronymic,
            email: email.toLowerCase(),
            phone,
            language,
        });

        return result;
    }

    static async delete(req, data) {
        const { id } = data;

        await repository.delete('User', id);

        await repository.deleteByQuery('UserRight', { user_id });

        return { status: 'success' };
    }

    static async set_rights(req, data) {
        // TODO check req parameters
        // TODO check data parameters

        const { rights, user_id } = data;

        await repository.deleteByQuery('UserRight', { user_id });

        await repository.updateList(
            'UserRight',
            rights.map((x) => ({ ...x, user_id })),
        );

        await access.refresh();

        return { status: 'success' };
    }

    static async log(req, data) {

    }
}

module.exports = User;
