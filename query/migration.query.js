
const migration = require('../methods/migration');

const migrationQuery = {
    ['export.vocabulary']: (data, req) => {
        return migration.exportVocabulary(req, data);
    },
    ['import.vocabulary']: (data,req) => {
        return migration.importVocabulary(req, data);
    }

}

module.exports = migrationQuery;