// const MongoClient  = require('mongodb').MongoClient;

// let url = "mongodb://localhost:27017/Monitoring";
const config = require('../config');
const mongoose = require('mongoose');
const url = 'mongodb://localhost/' + config.DBNAME;
const entities = require('./../entities');
const modelNames = Object.keys(entities);
const consolecolor = require('cli-color');
const common = require('./common');
const moment = require('moment');

let repository = {
    engine: {
        mongoose: mongoose,
        schema: null
    },
    models: {},
    fields: {},
    prepareLegend: common.prepareLegend,

    getField: common.getField,

    init: function () {
        mongoose.connect(url);

        mongoose.Promise = global.Promise;

        let db = mongoose.connection;

        db.on('error', console.error.bind(console, 'connection error:'));

        //Define a schema
        let Schema = mongoose.Schema;
        this.engine.schema = Schema;

        for (let i = 0; i < modelNames.length; i++) {
            let schema = {};
            let model = entities[modelNames[i]];
            model.fields.forEach(field => {
                schema[field.name] = field.type;
            });
            this.fields[modelNames[i]] = model.fields;
            let mongooseSchema = new Schema(schema);
            this.models[modelNames[i]] = mongoose.model(model.name, mongooseSchema, model.collection || model.name.toLowerCase());
        }
        // let deviceSchema = new Schema({
        //     name: String,
        //     address: String
        // });

        // this.models.Device = mongoose.model('Device', deviceSchema, 'devices');
        // this.models.Device.create({name:'1', address: '2'}, function(err, item){
        //     if(err) console.log(err);
        //     console.log(item);
        // });
        console.log(consolecolor.green('Init repository successfull'));
    },
    superList: function (entityName, query, refs) {
        //todo
        return this.refList(entityName, query, refs);
    },
    refList: function (entityName, query, _displayForm, full = false) {
        let listboxes = [];
        let references = [];
        let entity = entities[entityName];
        let displayForm = _displayForm || entity.displayForm;

        return new Promise((resolve, reject) => {
            this.models[entityName].find(query, (err, data) => {
                if (err) return reject(err);
                if (data.length === 0) return resolve(data);
                let result = data;
                if (!displayForm) return reject({ message: 'DisplayForm is not defined', error: 'Внутреняя ошибка структуры' })
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
                    let in1 = new Set(result.map(x => x[field.name]));
                    let in2 = Array.from(in1).map(x => mongoose.Types.ObjectId(x));
                    promiseStack.push(this.superList(field.reference, { _id: { $in: Array.from(in1) } }));
                    //promiseStack.push(this.superList(field.reference, { _id: { $in: in2 } }));
                }

                Promise.all(promiseStack)
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
                                let displayitem = typeof item[displayform] === 'object'
                                    ? item[displayform] instanceof Date
                                        ? moment(item[displayform]).format('DD.MM.YY HH:mm')
                                        : item[displayform].DISPLAYNAME
                                    : item[displayform];

                                if (displayitem === undefined || displayitem === null) displayitem = "";
                                item.DISPLAYNAME = item.DISPLAYNAME ? `${item.DISPLAYNAME} ${displayitem}` : displayitem;
                            }
                        })

                        resolve(result);
                    })
                    .catch(resolve);
            });
        });
    },
    getList: function (entity, query = {}, fields = null, order = null) {
        return new Promise((resolve, reject) => {

            let q = this.models[entity].find(query);
            if (Array.isArray(fields) && fields.length !== 0) q.select(fields);
            if (order) {
                q.sort(order)
            }

            q.exec((err, data) => {
                if (err) return reject({ message: 'error db getList', error: err });
                resolve(data);
            })
        });
    },
    getOne: function (entity, id) {
        return new Promise((resolve, reject) => {
            this.models[entity].findById(id, (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        });
    },
    updateList: function (entity, array) {
        let self = this;
        return new Promise((resolve, reject) => {
            if (array.length === 0) return resolve([]);
            let i = 0;
            let preBulk = [];
            array.forEach(item => {
                let upitem = {};
                this.fields[entity].forEach(field => {
                    upitem[field.name] = item[field.name];
                });
                if (item._id) {
                    preBulk.push({
                        updateOne: {
                            filter: { _id: item._id },
                            update: upitem
                        }
                    });
                }
                else {
                    preBulk.push({
                        insertOne: {
                            document: upitem
                        }
                    })
                }

            })

            this.models[entity].bulkWrite(preBulk, function (err, data) {
                if (err) return reject({ message: 'error db updatelist', error: err });
                let ids = array.filter(item => item._id).map(x => x._id.toString());
                Object.keys(data.insertedIds).forEach(key => ids.push(data.insertedIds[key].toString()));
                self.models[entity].find({ _id: { $in: ids } }, function (err, data) {
                    if (err) return reject({ message: 'error db getList after updatelist', error: err });
                    resolve(data);
                });
            });
        });
    },

    update: function (entity, item) {
        if (item.__v || item.__v === 0) delete item.__v;
        return new Promise((resolve, reject) => {
            if (item._id) {
                this.models[entity].findOneAndUpdate({ _id: item._id }, item, { upsert: true, setDefaultsOnInsert: true, new: true }, function (err, data) {
                    if (err) return reject(err);
                    resolve(data);
                })
            }
            else {
                let obj = new this.models[entity](item);
                obj.save(function (err) {
                    if (err) reject(err);
                    else resolve(obj);
                });
            }
        });
    },
    delete: function (entity, id) {
        return new Promise((resolve, reject) => {
            this.models[entity].remove({ _id: id }, function (err) {
                if (err) return reject(err);
                else return resolve({ message: 'deleted', _id: id });
            });
        })
    },
    deleteByQuery: function (entity, query) {
        return new Promise((resolve, reject) => {
            this.models[entity].remove(query, function (err) {
                if (err) return reject(err);
                else return resolve({ message: 'deleted', query });
            });
        })
    }

}



repository.init();

// let inn = ["5d35d67ec5e0680af9c205e7","5d35d689c5e0680af9c205e9"];
// repository.getList('Revision', {_id: {$in: inn }})
//     .then(data=> console.log(data))
//     .catch(err=> console.error(err));

module.exports = repository;