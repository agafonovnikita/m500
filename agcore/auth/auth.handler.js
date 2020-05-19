const repository = require('../data/db/repository');
const bcrypt = require('bcrypt');
const config = require('../data/config');
const ID = config.ID || 'Id';
const uuid = require('uuid/v4');
const emailNotify = require('../notify/email');
const moment = require('moment');
const ENUMS = require('./../data/enums');
const Op = repository.Sequelize.Op;

let auth = {
    usingfields: ['email', 'name', 'surname', 'status', 'id', 'role', 'confirmGuid'],
    getSubAccount: function (account) {
        let subAccount = {};
        this.usingfields.forEach(key => subAccount[key] = account[key]);
        return subAccount;
    },
    userBase: {},
    registration: function (email, password, notify = true) {
        return new Promise((resolve, reject) => {
            let guid = uuid();
            let confirmGuid = uuid();
            let account;
            repository.getList('Account', { email: email })
                .then(data => {
                    if (data.length !== 0) return Promise.reject({ agMessage: 'Такой email уже зарегистрирован' });
                    let cryptPassword = bcrypt.hashSync(password, config.salt);
                    return repository.update('Account', {
                        email: email, status: 0, password: cryptPassword, guid: guid,
                        role: ENUMS.Role.PUBLIC, confirmGuid: confirmGuid
                    });
                })
                .then(data => {
                    account = data;
                    return notify ? emailNotify.confirmEmail({ email: email, guid: confirmGuid }) : Promise.resolve({});
                })
                .then(data => {
                    resolve(this.getSubAccount(account));

                })
                .catch(err => {
                    console.error(err);
                    reject(err);
                });
        });
    },
    createAccount: async function (email, password, role = ENUMS.Role.NONE) {
        let guid = uuid();
        let confirmGuid = uuid();
        let cryptPassword = bcrypt.hashSync(password, config.salt);
        let account = await repository.update('Account', {
            email: email, status: ENUMS.AccountStatus.Confirmed, password: cryptPassword, guid: guid,
            role: role,
            confirmGuid: confirmGuid
        });
        return account;
    },
    login: function (email, password) {
        let self = this;
        return new Promise((resolve, reject) => {
            let userid = uuid();
            let account;
            repository.getList('Account', {
                email: email
            })
                .then(data => {
                    if (data.length === 0) return Promise.reject({ agMessage: 'Аккаунт не найден' });
                    account = data[0];
                    if (account.status === 0) return Promise.reject({ agMessage: 'Email не подтвержден' });
                    let doesMatch = bcrypt.compareSync(password, account.password);
                    if (doesMatch) {
                        return repository.update('Session',
                            {
                                email: email,
                                userid: userid,
                                userguid: account.guid,
                                expire: moment().add(1, 'month').toDate(),
                                role: account.role
                            });
                    }
                    else {
                        return Promise.reject({ agMessage: 'Неверно введен пароль' });
                    }
                })
                .then(data => {

                    self.userBase[userid] = { session: data, account: self.getSubAccount(account) };
                    resolve(data);
                })
                .catch(err => {
                    console.error(err);
                    reject(err);
                });
        });
    },
    logout: async function (userid) {
        if (this.userBase[userid]) delete this.userBase[userid];
        let obj = { userid: userid };
        return await repository.deleteByQuery('Session', obj);
    },
    confirm: function (guid) {
        return new Promise((resolve, reject) => {
            repository.getList('Account', { confirmGuid: guid })
                .then(data => {
                    if (data.length === 0) return Promise.reject({ agMessage: 'Аккаунт не найден' });
                    let account = data[0];
                    account.status = 1;
                    delete account.__v;
                    let obj = { status: 1 }; obj[ID] = account[ID];
                    return repository.update('Account', obj);
                })
                .then(data => {
                    resolve({ email: data.email, guid: data.guid, status: data.status });
                })
                .catch(err => {
                    console.error(err);
                    reject(err);
                })
        });
    },
    getuser: function ({ userid }) {
        let self = this;
        if (this.userBase[userid]) {
            if (this.userBase[userid].expire < new Date()) return Promise.reject('Сессия завершена');
            return Promise.resolve(this.userBase[userid]);
        } else {
            return new Promise((resolve, reject) => {
                let session, account;
                let q = { expire: { $gt: moment().toDate() }, userid: userid };
                //let q = { userid: userid };
                repository.getList('Session', q)
                    .then(data => {
                        if (data.length === 0) throw new Error('Не зарегистрирован');
                        session = data[0];
                        return repository.getList('Account', { guid: session.userguid, status: { [Op.ne]: 0 } });
                    })
                    .then(data => {
                        if (data.length === 0) throw new Error('Account error');
                        account = data[0];
                        let result = { session: session, account: self.getSubAccount(account) };
                        self.userBase[userid] = result;
                        resolve(result);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            })
        }
    },
    getUserFromReq: async function (req) {
        try {
            let userid = req.cookies['userid'];
            if(!userid) return null;
            let user = await this.getuser({ userid: userid });
            return user;
        }
        catch (e) {
            console.error(e);
        }
        return null;
    },
    deleteUser: function () {
    }
}

module.exports = auth;