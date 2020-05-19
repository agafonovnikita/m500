const report = require('../methods/events');

const reportQuery = {
    ['EventLog']: (data, req) => {
        return report.get(req, data);
    },
}

module.exports = reportQuery;