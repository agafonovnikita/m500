const auth = require('../auth/auth.handler');
const repository = require('./../data/db/repository');
const uuid = require('uuid');
const ID = require('../data/config').ID;

let assert = require('assert');
let guid = uuid();
let reg = {
    name: '1050test_' + guid,
    password: 'Password'
}
let user;
let session;

it('registration user', async function () {
    try {
        user = await auth.registration(reg.name, reg.password, false);
        assert.notEqual(user, undefined);
    } catch (err) {
        assert.fail(err.message);
    }
});

it('confirm user', async function () {
    try {
        let confirm = await auth.confirm(user.confirmGuid);
        console.log(guid);
        assert.ok(confirm);
    } catch (err) {
        assert.fail(err.message);
    }
});

it('login user', async function () {
    try {
        session = await auth.login(reg.name, reg.password);
        assert.ok(confirm);
    } catch (err) {
        assert.fail(err.message);
    }
});

it('get session user', async function () {
    try {
        let luser = await auth.getuser({ userid: session.userid });
        assert.equal(luser.session.userid, session.userid);
    } catch (err) {
        assert.fail(err.message);
    }
});

it('close session user | logout', async function () {
    try {
        await auth.logout({ userid: session.userid });
        try {
            let luser = await auth.getuser({ userid: session.userid });
            assert.equal(luser, undefined);
        }
        catch (e) {
            assert.ok(null);
        }
    } catch (err) {
        assert.fail(err.message);
    }
});



// it('delete user', async function () {
//     let regexp = /^1050test/;
//     let list = await repository.getList('Account', { email: regexp });
//     if (list.length === 0) assert.ok(0);
//     else {
//         for (let i = 0; i < list.length; i++) await repository.delete('Account', list[i][ID]);
//         list = await repository.getList('Account', { email: regexp });
//         assert.equal(list.length, 0);
//     }
// });
