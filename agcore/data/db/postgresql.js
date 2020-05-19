const common = require('./common');
const Sequelize = require('sequelize');
const config = require('../config');
const entities = require('./../entities');
const consolecolor = require('cli-color');
const LISTBOXES = require('./../listboxes');

let sequelize = new Sequelize(config.DBNAME, config.DBUSER, config.DBPASSWORD, {
    host: config.DBHOST,
    dialect: 'postgres',
    logging: config.DBLOG === true ? console.log : false,
});

const nothing = {};
Object.freeze(nothing);
let repository = {
    Sequelize: Sequelize,
    models: {},
    fields: {},
    prepareLegend: common.prepareLegend,
    convertQuery: common.convertQuery,
    getField: common.getField,
    sync: function () {
        sequelize.sync({
            //force: true
        });
    },
    init: function () {
        for (let entityKey in entities) {
            let entityModel = entities[entityKey];

            let dbAttributes = {};
            let tableAttributes = {
                timestamps: false,
                tableName: entityModel.collection,
            };
            //Имя таблицы
            if (entityModel.collection === entityKey) {
                tableAttributes.freezeTableName = true;
            }

            dbAttributes[config.ID] = {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            };
            //Информация по полям
            for (let field of entityModel.fields) {
                let type = Sequelize.STRING(4000);
                let defaultValue = '';
                let fieldTypeName = typeof field.type === 'string' ? field.type : field.type.name;
                switch (fieldTypeName.toLowerCase()) {
                    case 'photo':
                    case 'image':
                        type = Sequelize.STRING(100);
                        defaultValue = field.defaultValue !== undefined ? field.defaultValue : '';
                        break;
                    case 'string':
                        type = Sequelize.STRING(500);
                        defaultValue = field.defaultValue !== undefined ? field.defaultValue : '';
                        break;
                    case 'object':
                    case 'int':
                    case 'number':
                        type = Sequelize.INTEGER;
                        defaultValue = field.defaultValue !== undefined ? field.defaultValue : 0;
                        break;
                    case 'float':
                    case 'real':
                        type = Sequelize.DOUBLE;
                        defaultValue = field.defaultValue !== undefined ? field.defaultValue : 0.0;
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
                        defaultValue = field.defaultValue ? field.defaultValue : false;
                        break;
                    case 'long':
                    case 'bigint':
                        type = Sequelize.BIGINT;
                        defaultValue = field.defaultValue ? field.defaultValue : 0;
                        break;
                    case 'text':
                        type = Sequelize.TEXT;
                        defaultValue = field.defaultValue ? field.defaultValue : '';
                        break;
                }
                dbAttributes[field.name] = {
                    type: type,
                    defaultValue: defaultValue,
                    allowNull: field.allowNull === true,
                };
            }
            this.models[entityKey] = sequelize.define(entityKey, dbAttributes, tableAttributes);
        }
        for (let entityKey in entities) {
            let entityModel = entities[entityKey];

            for (let field of entityModel.fields) {
                if (field.reference) {
                    //console.log(entityKey + ' --- ' + field.reference);
                    try {
                        this.models[entityKey].belongsTo(this.models[field.reference], {
                            foreignKey: field.name,
                        });
                    } catch (e) {
                        console.error(`Ошибка связывания ${entityKey} и ${field.reference}`);
                        process.exit(500);
                    }
                    this.models[field.reference].hasMany(this.models[entityKey], {
                        foreignKey: field.name,
                    });
                }

                //User.hasMany(Post, {foreignKey: 'user_id'})
                //Post.belongsTo(User, {foreignKey: 'user_id'})
            }
        }
        console.log(consolecolor.green('Init repository successfull'));
    },
    superList: function (entityName, query, refs) {
        //todo
        let include = [];
        for (let ref of refs) {
            let entitiyNames = ref.split('.');
            include.push(this.models[entitiyNames[0]]);
        }
        return new Promise((resolve, reject) => {
            this.models[entityName]
                .findAll({
                    where: query,
                    include: include,
                })
                .then((data) => {
                    resolve(data);
                })
                .catch((err) => {
                    console.error(err);
                    reject(err);
                });
        });
    },
    refList: function (entityName, query, _displayForm, full = false) {
        let listboxes = [];
        let references = [];
        let entity = entities[entityName];
        let displayForm = _displayForm || entity.displayForm;

        return new Promise((resolve, reject) => {
            let result;
            this.models[entityName]
                .findAll(query)
                .then((data) => {
                    result = data.map((x) => x.dataValues);
                    if (data.length === 0) return resolve(data);
                    displayForm.forEach((form) => {
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
                    });
                    // references
                    let promiseStack = [];
                    for (let field of references) {
                        let $in = new Set(result.map((x) => x[field.name]));
                        promiseStack.push(
                            this.refList(field.reference, {
                                $in: $in,
                            }),
                        );
                    }

                    return Promise.all(promiseStack);
                })
                .then((lists) => {
                    for (let i = 0; i < references.length; i++) {
                        result.forEach(
                            (item) =>
                                (item[references[i].reference] = lists[i].find(
                                    (x) => x[config.ID] === item[references[i].name],
                                )),
                        );
                    }
                    //listboxes
                    listboxes.forEach((lbField) => {
                        result.forEach((item) => {
                            item[lbField.listbox] = LISTBOXES[lbField.listbox][item[lbField.name]];
                        });
                    });

                    result.forEach((item) => {
                        for (let displayform of displayForm) {
                            let displayitem = '';
                            if (item[displayform] !== null)
                                displayitem =
                                    typeof item[displayform] === 'object'
                                        ? item[displayform].DISPLAYNAME
                                        : item[displayform];
                            item.DISPLAYNAME = item.DISPLAYNAME ? `${item.DISPLAYNAME} ${displayitem}` : displayitem;
                        }
                    });
                    resolve(result);
                })
                .catch((err) => {
                    console.log(err);
                    reject(err);
                });
        });
    },
    getList: function (entity, query = {}, order = null) {
        this.convertQuery(query);

        return this.models[entity].findAll({
            where: query,
            raw: true,
            order
        });
    },
    getOne: function (entity, id) {
        throw new Error('comming soon');
    },
    updateList: async function (entity, array) {
        let result = [];
        for (let item of array) {
            let updated = await this.update(entity, item);
            result.push(updated);
        }
        return result;
    },
    update: function (entity, obj) {
        let model = this.models[entity];
        if (obj[config.ID]) {
            let q = {};
            q[config.ID] = obj[config.ID];
            return new Promise((resolve, reject) => {
                model
                    .update(obj, {
                        where: q,
                    })
                    .then(function () {
                        resolve(obj);
                    })
                    .catch(reject);
            });
        }

        return new Promise((resolve, reject) => {
            model
                .create(obj, {
                    raw: true,
                })
                .then((data) => {
                    resolve(data.dataValues);
                })
                .catch(reject);
        });
    },
    // updateQuery: (entity, query, obj) => {
    //     const model = this.models[entity];
    //     return model.upsert(obj, {
    //         where: query
    //     })
    // },
    delete: function (entity, id) {
        let q = {};
        q[config.ID] = id;
        return new Promise((resolve, reject) => {
            this.models[entity]
                .destroy({
                    where: q,
                })
                .then((data) => {
                    resolve({
                        count: data,
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },
    deleteByQuery: function (entity, query) {
        return new Promise((resolve, reject) => {
            this.models[entity]
                .destroy({
                    where: query,
                })
                .then((data) => {
                    resolve({
                        count: data,
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },

    query: function (func_name, args) {
        let param = Array.isArray(args) ? args.join(',') : '';
        return new Promise((resolve, reject) => {
            sequelize
                .query(`select * from ${func_name}(${param});`)
                .then((data) => {
                    resolve(data[0]);
                })
                .catch(reject);
        });
    },
};

repository.init();

// let Op = sequelize.Op;

// repository.getList('ServerModemDevice', { id: [1, 2, 3] })
//     .then(data => console.log(data))
//     .catch(err => console.error(err));

module.exports = repository;
