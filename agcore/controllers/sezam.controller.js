const config = require('./../data/config');
const repository = require('./../data/db/repository');

let SEZAM = {
    getSites: async function ({ accountId }) {
        let binds = await repository.getList('SiteAccountBind', { accountId: accountId }, ['siteId']);
        let sites = await repository.getList('Site', { $or: [{ accountId: accountId }, { accountId: { $in: binds.map(x=> x.siteId) } }] });
        return sites;
    }
};

module.exports = SEZAM;