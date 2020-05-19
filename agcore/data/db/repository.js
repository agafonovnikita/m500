const config = require('../config');

let repository;

switch (config.DB.toLowerCase()) {
    case "mssql":
        repository = require('./mssql');
        break;
    case "postgresql":
        repository = require('./postgresql');
        break;
    case "mongodb":
    default:
        repository = require('./mongodb');
}


module.exports = repository;