const report = require('../methods/report');

const reportQuery = {
    ['report.statistic']: (data, req) => {
        return report.statistic(req, data);
    },

    ['report.loading']: (data, req) => {
        return report.loading(req, data);
    },

    ['report.stops']: (data, req) => {
        return report.stops(req, data);
    }
}

module.exports = reportQuery;