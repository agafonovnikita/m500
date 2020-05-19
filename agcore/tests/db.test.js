const repository = require('../data/db/repository');
const uuid = require('uuid');
const ID = require('../data/config').ID;

let name1 = uuid(), name2 = uuid();
let obj1, obj2;

let assert = require('assert');


it('create rows into table', async function () {
    try {
        obj1 = await repository.update('Test', { name: name1, index: 2 });
        obj2 = await repository.update('Test', { name: name2, index: 1 });
        assert.notEqual(obj1, undefined);
    }
    catch (err) {
        assert.fail(err.message);
    }
});
it('get list with sort', async function () {
    try {
        let list = await repository.getList('Test', null, null, [['index', 1]]);
        assert.equal(list[0].name, name2);
    }
    catch (err) {
        assert.fail(err.message);
    }
});

it('get one by id', async function () {
    try {
        let one = await repository.getOne('Test', obj1[ID]);
        assert.equal(one.name, obj1.name);
    }
    catch (err) {
        assert.fail(err.message);
    }
});

it('update one', async function () {
    try {
        obj1.name = name2;
        let one = await repository.update('Test', obj1);
        assert.equal(one.name, name2);
    }
    catch (err) {
        assert.fail(err.message);
    }
});

it('delete all', async function () {
    let list = await repository.getList('Test');
    for (let i = 0; i < list.length; i++) await repository.delete('Test', list[i][ID]);
    list = await repository.getList('Test');
    assert.equal(list.length, 0);
});


    //todo other functions
