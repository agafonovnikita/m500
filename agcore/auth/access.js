const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const config = require('../data/config');
const repository = require('./../data/db/repository');
const Errors = require('../core/errors');

let ACCESS = {};


const init = async () => {
    const rules = await repository.getList('UserRight');
    ACCESS = {};

    for (const rule of rules) {
        const user_id = +rule.user_id;
        if (!ACCESS[user_id]) ACCESS[user_id] = {
            site: {},
            location: {},
            device: {}
        };

        ACCESS[user_id][rule.object_type][+rule.object_id] = rule.right;
    }

    const sites = await repository.getList('Site');
    const locations = await repository.getList('Location');
    const devices = await repository.getList('Device');

    for (const site of sites) {
        const site_id = +site.id;

        for (const userAccess of Object.values(ACCESS)) {
            if (userAccess.site[site_id]) continue;
            userAccess.site[site_id] = 'hide';
        }
    }

    const findLocationRule = (userAccess, location) => {
        const parent_id = location.location_id;
        if (userAccess.location[parent_id]) return userAccess.location[parent_id];

        if (parent_id === null) {
            const siteRule = userAccess.site[location.site_id] || 'hide';
            userAccess.location[parent_id] = siteRule;
            return siteRule;
        }

        let rule;
        const parent = locations.find(x => x.id == parent_id);
        if (!parent) {
            rule = 'hide';
        } else {
            rule = findLocationRule(userAccess, parent);
        }
        userAccess.location[parent_id] = rule;
        return rule;
    }

    for (const location of locations) {
        const location_id = +location.id;


        for (const userAccess of Object.values(ACCESS)) {
            if (userAccess.location[location_id]) continue;
            userAccess.location[location_id] = findLocationRule(userAccess, location);
        }
    }

    for (const device of devices) {
        const device_id = +device.id;


        for (const userAccess of Object.values(ACCESS)) {
            if (userAccess.device[device_id]) continue;
            userAccess.device[device_id] = userAccess.location[device.location_id] || 'hide';
        }
    }


    console.log(ACCESS);
}

const refresh = async () => {
    await init();
    return ACCESS;
}

const access = (userId) => {
    return ACCESS[userId];
}

const awaitAccess = async (userId) => {
    await init();
    return ACCESS[userId];
}

/**
 * 
 * @param {object} options 
 * @param {number} options.user_id
 * @param {number} options.device_id 
 */
const viewDevice = (options) => {
    const { user_id, device_id } = options;

    if (!ACCESS[user_id]) return false;

    const access = ACCESS[user_id].device[device_id];

    switch (access) {
        case 'admin':
        case 'manage':
        case 'view':
            return true;
        default: return false;
    }

}

init().then().catch(console.error)

module.exports = { access, refresh, awaitAccess, viewDevice };
