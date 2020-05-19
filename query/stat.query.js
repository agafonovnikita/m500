const stat = require('../methods/statistic');

const statQuery = {
    ['stat.device']: (data, req) => {
        return stat.statDevicePeriod(req, data);
    },
    ['stat.devices']: (data, req) => {
        return stat.statDevicesPeriod(req, data);
    },

}

module.exports = statQuery;