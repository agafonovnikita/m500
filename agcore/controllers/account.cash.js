const repository = require('../data/db/repository');
const bcrypt = require('bcrypt');
const config = require('../data/config');
const ID = config.ID || 'Id';
const uuid = require('uuid/v4');
const moment = require('moment');
const ENUMS = require('../data/enums');
const entities = require('./../data/entities');
const cashitem = require('./helpers/account.cash.item');

let DATA = {};

let getReads = async function (accountId, eName) {
    if (!DATA[accountId] || !DATA[accountId][eName]) await initAccountEntity(accountId, eName);

    return new Set(
        [
            ...DATA[accountId][eName].read,
            ...DATA[accountId][eName].write
        ]
    );
}

let getWrites = async function (accountId, eName) {
    if (!DATA[accountId] || !DATA[accountId][eName]) await initAccountEntity(accountId, eName);
    return DATA[accountId][eName].write;
}

let getRW = async function (accountId, eName) {
    if (!DATA[accountId] || !DATA[accountId][eName]) await initAccountEntity(accountId, eName);
    return DATA[accountId][eName];
}

async function initAccountEntity(accountId, eName) {
    let entity = entities[eName];
    let read = new Set();
    let write = new Set();

    for (let authmethod of entity.authorize) {
        switch (authmethod.type) {
            case ENUMS.AuthRight.relation:
                let field = repository.getField(eName, authmethod.table);
                let parentRW = await getRW(accountId, authmethod.table);
                let q = {};
                q[field.name] = {
                    $in: [...parentRW.read, ...parentRW.write]
                };
                let rw = await repository.getList(eName, q, [ID, field.name]);
                write = new Set([...rw.filter(x => parentRW.write.has(x[field.name])).map(x => x[ID].toString())]);
                read = new Set([...rw.filter(x => parentRW.read.has(x[field.name])).map(x => x[ID].toString())]);
                break;
            case ENUMS.AuthRight.byAccount:
                let ids = (await repository.getList(eName, { accountId: accountId }, [ID])).map(x => x[ID].toString());
                ids.forEach(id => write.add(id));
                break;
        }
    }
    if (!DATA[accountId]) DATA[accountId] = {};
    DATA[accountId][eName] = { write: write, read: read };
    return DATA[accountId][eName];
}


let init = async function () {
    DATA = {};
}

//загружаем все
init().then().catch(err => console.error(err));

module.exports = {
    getReadList: async function (accountId, eName) {
        //console.log('getReadList: ' + eName);
        return await getReads(accountId, eName);
    },
    getWriteList: async function (accountId, eName) {
        //console.log('getWriteList: ' + eName);
        return await getWrites(accountId, eName);
    },
    deleteItem: async function (accountId, eName) { },
    addItem: async function (accountId, eName, item) {
        if (!DATA[accountId]) await initAccountEntity(accountId, eName);
        if (!DATA[accountId][eName]) DATA[accountId][eName] = { write: new Set(), read: new Set() };
        DATA[accountId][eName].write.add(item[ID].toString());
    }
};