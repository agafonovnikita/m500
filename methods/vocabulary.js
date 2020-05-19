const controllers = require('../agcore/controllers/base.controller');
const location = require('./location');
const repository = require('../agcore/data/db/repository');
const Op = repository.Sequelize.Op;
const core = require('../agcore/core/core');
const moment = core.moment;

class vocabulary {
    static async get(req) {
        // TODO CHECK ENTER DATA

        let result = await repository.getList('Vocabulary');
        return result;
    }
}

module.exports = vocabulary;
