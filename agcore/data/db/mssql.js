const common = require('./common');
const Sequelize = require('sequelize');
const config = require('../config');
const entities = require('./../entities');
const consolecolor = require('cli-color');
const LISTBOXES = require('./../listboxes');

let sequelize = new Sequelize(config.DBNAME, config.DBUSER, config.DBPASSWORD, {
    host: config.DBHOST,
    dialect: 'mssql',
    port: 1433,
    pool: {
        max: 50,
        min: 0,
        idle: 120000,
    },
    logging: false,
    'dialectOptions': {
        requestTimeout: 360000,
        maxConnections: 15,
        instanceName: config.DBINSTANCE ? config.DBINSTANCE : null
    }
});

const nothing = {};
Object.freeze(nothing);
let repository = {
    models: {},
    fields: {},
    prepareLegend: common.prepareLegend,
    getField: common.getField,
    init: function () {
        for (let entityKey in entities) {
            let entityModel = entities[entityKey];

            let dbAttributes = {};
            let tableAttributes = { timestamps: false };
            //Имя таблицы
            if (entityModel.collection === entityKey) {
                tableAttributes.freezeTableName = true;
            }

            dbAttributes.Id = {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            };
            //Информация по полям
            for (let field of entityModel.fields) {
                let type = Sequelize.STRING(4000);
                let defaultValue = '';
                switch (field.type.name.toLowerCase()) {
                    case 'photo':
                    case 'image':
                        type = Sequelize.STRING(100);
                        defaultValue = '';
                        break;
                    case 'string':
                        type = Sequelize.STRING(500);
                        defaultValue = '';
                        break;
                    case 'object':
                    case 'int':
                    case 'number':
                        type = Sequelize.INTEGER;
                        defaultValue = 0;
                        break;
                    case 'float':
                    case 'real':
                        type = Sequelize.DOUBLE;
                        defaultValue = field.defaultValue ? field.defaultValue : 0.0;
                        break;
                    case 'date':
                    case 'datetime':
                        type = Sequelize.DATE;
                        defaultValue = new Date();
                        break;
                    case 'bool':
                    case 'boolean':
                    case 'bit':
                        type = Sequelize.BOOLEAN;
                        defaultValue = false;
                        break;
                    case 'long':
                    case 'bigint':
                        type = Sequelize.BIGINT;
                        defaultValue = 0;
                        break;
                    case 'text':
                        type = Sequelize.TEXT;
                        defaultValue = '';
                        break;
                }
                dbAttributes[field.name] = {
                    type: type,
                    defaultValue: defaultValue,
                    allowNull: field.allowNull === true
                };
            }
            this.models[entityKey] = sequelize.define(
                entityKey,
                dbAttributes,
                tableAttributes
            );
        }
        console.log(consolecolor.green('Init repository successfull'));
    },
    superList: function (entityName, query, _displayForm, full = false) {
        let listboxes = [];
        let references = [];
        let entity = entities[entityName];
        let displayForm = _displayForm || entity.displayForm;

        return new Promise((resolve, reject) => {
            this.models[entityName].findAll(query)
                .then((data) => {
                    result = data.map(x => x.dataValues);
                    if (data.length === 0) return resolve(data);
                    displayForm.forEach(form => {
                        for (let field of entity.fields) {
                            switch (true) {
                                case field.name === form:
                                    return;
                                case field.reference === form:
                                    references.push(field);
                                    return;
                                case field.listbox === form:
                                    listboxes.push(field);
                                    return;
                            }
                        }
                    })
                    // references
                    let promiseStack = [];
                    for (let field of references) {
                        let $in = new Set(result.map(x => x[field.name]));
                        promiseStack.push(this.superList(field.reference, { $in: $in }));
                    }

                    return Promise.all(promiseStack);
                })
                .then(lists => {
                    for (let i = 0; i < references.length; i++) {
                        result.forEach(item => item[references[i].reference] = lists[i].find(x => x.id === item[references[i].name]));
                    }
                    //listboxes
                    listboxes.forEach(lbField => {
                        result.forEach(item => {
                            item[lbField.listbox] = LISTBOXES[lbField.listbox][item[lbField.name]]
                        });
                    })

                    result.forEach(item => {
                        for (let displayform of displayForm) {
                            let displayitem = typeof item[displayform] === 'object' ? item[displayform].DISPLAYNAME : item[displayform];
                            item.DISPLAYNAME = item.DISPLAYNAME ? `${item.DISPLAYNAME} ${displayitem}` : displayitem;
                        }
                    })
                    resolve(result);
                })
                .catch(err => {
                    console.log(err);
                    reject(err)
                });
        });
    },
    getList: function (entity, query = {}, fields = null, order = null) {
        if (fields || order) throw new Error('comming soon');
        return this.models[entity].findAll({
            where: query,
            // raw: true,
            // limit: limit,
            // offset: offset
        });
    },
    getOne: function (entity, id) {
        if (fields || order) throw new Error('comming soon');
        return this.models[entity].findAll({
            where: { Id: id },
        });
    },
    updateList: function (entity, array) {
        throw new Error('comming soon');
    },
    update: function (entity, obj) {
        let model = this.models[entity];
        if (obj.Id) {
            return new Promise((resolve, reject) => {
                model.update(obj, { where: { Id: obj.Id } })
                    .then(function () {
                        resolve(obj);
                    })
                    .catch(reject);
            });
        }

        return new Promise((resolve, reject) => {
            model
                .create(obj, { raw: true })
                .then(data => {
                    resolve(data.dataValues);
                })
                .catch(reject);
        });
    },
    delete: function (entity, id) {
        return new Promise((resolve, reject) => {
            this.models[entity]
                .destroy({
                    where: {
                        Id: id
                    }
                })
                .then(data => {
                    resolve({count: data});
                })
                .catch(err => {
                    reject(err);
                });
        });
    },
    deleteByQuery: function (entity, query) {
        return new Promise((resolve, reject) => {
            this.models[entity]
                .destroy({
                    where: query
                })
                .then(data => {
                    resolve({count: data});
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

}

repository.init();

module.exports = repository;