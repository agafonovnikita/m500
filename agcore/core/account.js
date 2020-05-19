const auth = require('../auth/auth.handler');
const enums = require('../data/enums');
const bcrypt = require('bcrypt');
const consolecolor = require('cli-color');

let account = {
    create: async function () {
        let email = process.argv[3];
        let password = process.argv[4];
        if (!email || !password) throw new Error('Not enhoug parameters');
        let roleName = process.argv[5] || 'NONE';
        let role = enums.Role.NONE;
        Object.keys(enums.Role).forEach(key => {
            if (roleName.toLowerCase() === key.toLowerCase()) role = enums.Role[key];
        })
        return await auth.createAccount(email, password, role);
    },
    createSalt: async function () {
        return bcrypt.genSaltSync(10);
    }
}

let action = process.argv[2];
if (!action) {
    console.error('Функция не задана');
    return;
}

account[action]()
    .then((data) => {
        console.log(consolecolor.green('successfull'));
        console.log(data);
        process.exit(1)
    })
    .catch(err => {
        console.error(err);
        process.exit(1)
        
    });