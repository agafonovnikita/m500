var express = require('express');
var router = express.Router();
const url = require('url');
// const repository = require('./../data/db/repository');
const basecontroller = require('./../controllers/base.controller');
const dbcontroller = require('./../controllers/db.controller');

const queryRouter = require(process.env.QueryPath);

const entities = require('../data/entities');
const helper = require('./helper');
const ok = helper.ok;
const error500 = helper.error500;
const error401 = helper.error401;
const error403 = helper.error403;

router.post('/legend', (req, res) => {
    dbcontroller
        .getLegend(req)
        .then(ok(res, true))
        .catch(error500(res));
});

router.post('/reference', (req, res) => {
    let data = req.body;
    let entityName = data.id;

    let entity = entities[entityName];

    let displayForm = data.displayForm ? data.displayForm.split(',') : entity.displayForm;

    if (!basecontroller[entityName]) return error500(res)(new Error('Wrong EntityName'));
    basecontroller[entityName]
        .refList(req, data.query, displayForm)
        .then((data) => {
            let result = [];
            data.forEach((item) => {
                result.push({
                    value: item.id,
                    displayname: item.DISPLAYNAME,
                });
            });
            res.send(result);
        })
        .catch((err) => {
            console.error('Error in api.reference:');
            console.error(err);
            res.send(500, { err });
        });
});

//Списки
router.post('/list', function(req, res, next) {
    let data = req.body;
    let entityName = data.id;
    let query = data.query;

    if (!basecontroller[entityName]) return error500(res)(new Error('Wrong EntityName'));
    basecontroller[entityName]
        .getList(req, query)
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            console.error('Error in api.list:');
            console.error(err);
            res.send(err.status || 500, { err });
        });
});

router.post('/superlist', function(req, res, next) {
    let data = req.body;
    let entityName = data.id;
    let query = data.query;
    let refs = data.refs;

    //todo add authorization
    let repo = require('./../data/db/repository');
    repo.superList(entityName, query, refs)
        .then(ok(res, true))
        .catch(error500(res));

    // if (!basecontroller[entityName]) return error500(res)(new Error("Wrong EntityName"));
    // basecontroller[entityName].getList(req, query)
    //     .then(data => {
    //         res.send(data);
    //     })
    //     .catch(err => {
    //         console.error('Error in api.list:');
    //         console.error(err);
    //         res.send(err.status || 500, { err });
    //     });
});

router.post('/updatelist', function(req, res) {
    let data = req.body;
    let entityName = data.id;
    let array = data.array;
    if (!basecontroller[entityName]) return error500(res)(new Error('Wrong EntityName'));
    basecontroller[entityName]
        .updateList(req, array)
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            console.error('Error in api.updatelist:');
            console.error(err);
            res.send(500, { err });
        });
});

// единичные операции
router.post('/update', function(req, res) {
    let data = req.body;
    let entityName = data.id;
    let item = data.item;
    if (!basecontroller[entityName]) return error500(res)(new Error('Wrong EntityName'));
    basecontroller[entityName]
        .update(req, item)
        .then((data) => {
            //console.log(data);
            ok(res, true)(data);
        })
        .catch((err) => {
            console.error('Error in api.update:');
            console.error(err);
            res.send(500, { err });
        });
});

router.post('/delete', function(req, res) {
    let data = req.body;
    let entityName = data.id;
    let itemId = data.itemId;
    if (!basecontroller[entityName]) return error500(res)(new Error('Wrong EntityName'));
    basecontroller[entityName]
        .delete(req, itemId)
        .then((data) => {
            //console.log(data);
            res.send(data);
        })
        .catch((err) => {
            console.error('Error in api.delete:');
            console.error(err);
            res.send(500, { err });
        });
});

//listboxes
router.get('/listboxes', function(req, res, next) {
    dbcontroller
        .getListboxes(req)
        .then(ok(res, true))
        .catch(error500(res));
});

router.post('/query', (req, res) => {
    const data = req.body;
    const url_parts = url.parse(req.url, true);
    const query = url_parts.query.id;

    if (typeof queryRouter[query] !== 'function') return error500(res)('Query no found');

    queryRouter[query](data, req)
        .then(ok(res, true))
        .catch((err) => {
            console.log(err);
            error500(res)(err);
        });
});

module.exports = router;
