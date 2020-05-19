const enums = require('./enums');

module.exports = {
    main: enums.Role.PUBLIC | enums.Role.ADMIN,
    adminonly: enums.Role.ADMIN
}