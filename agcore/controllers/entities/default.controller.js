const repository = require('../../data/db/repository');
const auth = require('../../auth/auth.handler');
const ID = require('./../../data/config').ID;
const error = require('./../../core/errors');
const enums = require('./../../data/enums');
const accountCash = require('./../account.cash');
const entities = require('./../../data/entities');
const config = require('../../data/config');

let def = function defaultController(entityName) {
    this.entityName = entityName;
    this.entity = require('./../../data/entities')[entityName];
    this.authorize = config.auth? this.entity.authorize : null;
};

def.prototype.getList = async function (req, query = {}, fields, order) {
    try {
        if (!this.authorize) return await repository.getList(this.entityName, query, fields, order);
        let user = await auth.getUserFromReq(req);
        //console.log(user);
        if (!user) throw new error.AuthError();
        // если админ, то ему можно все
        if ((user.account.role & enums.Role.ADMIN) !== 0) return await repository.getList(this.entityName, query, fields, order);
        // если кривая авторизация в сущности, то выбрасываем
        if (!Array.isArray(this.authorize)) throw new error.InsideError('Entity ' + this.entityName + ' has wrong autorize');

        let idlist = await accountCash.getReadList(user.account.id, this.entityName);

        // for (let auth of this.authorize) {
        //     switch (auth.type) {
        //         case enums.AuthRight.byAccount:
        //             let newset = accountCash(user, this.entity);
        //             for (let id of newset) idlist.add(id.toString());
        //             break;
        //         case enums.AuthRight.byRole:
        //             break;
        //     }
        // }

        let q = Object.assign({}, query);
        //если в query нет ID , то вставляем id: $in
        if (!q[ID]) q[ID] = { $in: [...idlist] };
        else {
            // let qid = { $and: [{}, { $in: [...idlist] }] }
            // q[ID] = { $and: [{ $eq: q[ID] }, { $in: [...idlist] }] };
            //if (idlist.has(q[ID])) 
            let dirtyList = await repository.getList(this.entityName, query, fields, order);
            return dirtyList.filter(x => idlist.has(x[ID].toString()));
        }

        return await repository.getList(this.entityName, q, fields, order);
    }
    catch (err) {
        console.error(err);
        throw err;
    }
};

def.prototype.superList = async function (req, query, displayForm) {
    return await repository.superList(this.entityName, query, displayForm);
};

def.prototype.refList = async function (req, query, displayForm) {
    return await repository.refList(this.entityName, query, displayForm);
};

def.prototype.updateList = async function (req, list) {
    try {
        if (!this.authorize) return await repository.updateList(this.entityName, list);
        let user = await auth.getUserFromReq(req);
        if (!user) throw new error.AuthError();
        // если админ, то ему можно все
        if ((user.account.role & enums.Role.ADMIN) !== 0) return await repository.updateList(this.entityName, list);
        // если кривая авторизация в сущности, то выбрасываем
        if (!Array.isArray(this.authorize)) throw new error.InsideError('Entity ' + this.entityName + ' has wrong autorize');
        let listForCreate = list.filter(x => !x[ID]);
        let listForUpdate = list.filter(x => x[ID]);
        for (let item of listForCreate) {
            let check = await checkInsertRegulation(user.account.id, this.entityName, item);
            if (!check) throw new error.ForbiddenError();
        }

        for (let item of listForUpdate) {
            let check = await checkUpdateRegulation(user.account.id, this.entityName, item);
            if (!check) throw new error.ForbiddenError();
        }
        let result = await repository.updateList(this.entityName, list);

        for (let item of result) {
            await accountCash.addItem(user.account.id, this.entityName, item);
        }

        return result;
    }
    catch (err) {
        throw err;
    }
    //return repository.updateList(this.entityName, list);
};

def.prototype.update = async function (req, item) {
    try {
        if (!this.authorize) return await repository.update(this.entityName, item);
        let user = await auth.getUserFromReq(req);
        //console.log(user);
        if (!user) throw new error.AuthError();
        // если админ, то ему можно все
        if ((user.account.role & enums.Role.ADMIN) !== 0) return await repository.update(this.entityName, item);
        // если кривая авторизация в сущности, то выбрасываем
        if (!Array.isArray(this.authorize)) throw new error.InsideError('Entity ' + this.entityName + ' has wrong autorize');

        //если ID не существует - значит insert.
        if (!item[ID]) {
            //ищем правило
            if (await checkInsertRegulation(user.account.id, this.entityName, item)) {
                let createdItem = await repository.update(this.entityName, item);
                await accountCash.addItem(user.account.id, this.entityName, createdItem);
                return createdItem;
            }
            else throw new error.ForbiddenError();
        }

        if (await checkUpdateRegulation(user.account.id, this.entityName, item)) return await repository.update(this.entityName, item);
        else throw new error.ForbiddenError();
    }
    catch (err) {
        throw err;
    }
};

def.prototype.delete = function (req, id) {
    return repository.delete(this.entityName, id);
};


async function checkUpdateRegulation(accountId, eName, item) {
    let idlist = await accountCash.getWriteList(accountId, eName);
    if (!idlist.has(item[ID])) {
        consoleerror(item, this.entityName, 'Нет прав');
        return false;    // не можем изменять
    }
    // можем изменять, тогда еще проверяем на поля
    return await _checkUpdateInsertFields(accountId, eName, item);
}

async function checkInsertRegulation(accountId, eName, item) {
    return await _checkUpdateInsertFields(accountId, eName, item);
}

async function _checkUpdateInsertFields(accountId, eName, item) {
    let entity = entities[eName];
    for (let authmethod of entity.authorize) {
        switch (authmethod.type) {
            case enums.AuthRight.relation:  //если связь с другой таблице
                let field = repository.getField(eName, authmethod.table);
                //если такого поля в item нет - выходим
                if (!item[field.name]) {
                    consoleerror(item, eName, 'Ошибка зависимости. Отсуствие поля ' + field.name);
                    return false;
                }
                let idlist = await accountCash.getWriteList(accountId, authmethod.table);
                if (!idlist.has(item[field.name])) {
                    consoleerror(item, eName, 'Ошибка зависимости по полю ' + field.name);
                    return false;
                }
                break;
            case enums.AuthRight.byAccount:
                if (!item.accountId || item.accountId !== accountId) {
                    consoleerror(item, eName, 'Ошибка поля accountId');
                    return false;
                }
                break;
        }
    }
    return true;
}

function consoleerror(item, eName, msg) {
    console.error(`Ошибка контроллера авторизации. Entity: ${eName}. ${msg}`);
    console.error(item);
}

module.exports = def;