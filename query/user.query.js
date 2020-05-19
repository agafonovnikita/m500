const user = require('../methods/user');

const userQuery = {
    ['user.create']: (data, req) => {
        return user.create(req, data);
    },

    ['user.update']: (data, req) => {
        return user.update(req, data);
    },

    ['user.delete']: (data, req) => {
        return user.delete(req, data);
    },

    ['user.set_rights']: (data, req) => {
        return user.set_rights(req, data);
    },
}

module.exports = userQuery;