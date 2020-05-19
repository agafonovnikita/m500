const repository = require('../agcore/data/db/repository');

const captcha = require('../agcore/helpers/captcha');
const emailHelper = require('../agcore/helpers/mail');
const polling = require('../polling/polling');
const search = require('./../methods/search');
const location = require('./../methods/location');
const statistic = require('./../methods/statistic');
const manage = require('./../methods/manage');
const vocabulary = require('./../methods/vocabulary');

module.exports = {
    test: () => {
        return repository.getList('LocationTagDetail', {
            group_id: {
                in: [1, 2, 3, 4],
            },
        });
    },

    getParents: function ({ locationId }) {
        return location.getParents(locationId);
    },

    locationTreeTable: function (data, req) {
        return location.locationTreeTable(data);
    },

    polling: (data) => {
        return polling.get(data);
    },

    location_polling: (data, req) => {
        return polling.locations(data, req);
    },

    search: ({ search_string }, req) => {
        return search.find(search_string, req);
    },

    totalalarm: (data, req) => {
        return polling.totalalarm(req);
    },

    onlinealarms: (data, req) => {
        return polling.onlinealarms(req);
    },

    historyalarms: (data, req) => {
        return statistic.historyalarms(req, data);
    },

    archive: (data, req) => {
        return statistic.archive(req, data);
    },

    archiveBool: (data, req) => {
        return statistic.archiveBool(req, data);
    },

    archiveString: (data, req) => {
        return statistic.archiveString(req, data);
    },

    // MANAGE SECTION
    manageModbus: (data, req) => {
        return manage.modbus(req, data);
    },

    // vocabulary
    vocabulary: (data, req) => {
        return vocabulary.get(req);
    },

    // USERS
    ...require('./user.query'),

    // REPORTS
    ...require('./report.query'),

    // EVENTS
    ...require('./events.query'),

    // STAT
    ...require('./stat.query'),

    // DATA MIGRATION
    ...require('./migration.query')
};
