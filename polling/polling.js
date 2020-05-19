const repository = require('../agcore/data/db/repository');
const TIMEOUT = 3000;
const DEVICETIEMOUT = 20000;

const auth = require('../agcore/auth/auth.jwt.handler');
const Access = require('../agcore/auth/access')

/**
 * Кол-во текущих аварий
 */
let totalalarm = 0;
const LOCATION = require('../methods/location');
const config = require('../agcore/data/config');

let polling = {
    DATA: {},
    MODEMDATA: {},
    DEVICES: {},
    MODEMS: {},
    Alarms: [],
    get: (data) => {
        return new Promise((resolve, reject) => {
            let result = { deviceData: {}, modemData: {} };
            for (const device_id in data.query) {
                result.deviceData[device_id] = {};

                if (!polling.DATA[device_id]) {
                    for (const alias of data.query[device_id]) {
                        result.deviceData[device_id][alias] = null;
                    }
                } else {
                    for (const alias of data.query[device_id]) {
                        result.deviceData[device_id][alias] = polling.DATA[device_id][alias];
                    }
                }
            }

            for (const modem_id in data.modemQuery) {
                result.modemData[modem_id] = {};

                if (!polling.MODEMDATA[modem_id]) {
                    for (const alias of data.modemQuery[modem_id]) {
                        result.modemData[modem_id][alias] = null;
                    }
                } else {
                    for (const alias of data.modemQuery[modem_id]) {
                        result.modemData[modem_id][alias] = polling.MODEMDATA[modem_id][alias];
                    }
                }
            }

            resolve(result);
        });
    },

    async totalalarm(req) {
        let total = 0;

        const user = await auth.getUserFromReq(req);

        const user_id = user.id;

        for (let alarm of polling.Alarms) {
            const device_id = alarm.device_id;
            if (device_id && Access.viewDevice({ user_id, device_id })) total++;
        }

        return { total };
    },

    async onlinealarms(req) {
        const user = await auth.getUserFromReq(req);
        const user_id = user.id;

        let result = [];

        for (let keydevice in polling.DATA) {
            if (keydevice === 'null') continue;
            if (!Access.viewDevice({ user_id, device_id: keydevice })) continue;
            let devicedata = polling.DATA[keydevice];
            for (let alias in devicedata) {
                if (devicedata[alias].alarm) {

                    const pollingDevice = polling.DEVICES[keydevice];

                    result.push({
                        alarm: devicedata[alias],
                        device: `${pollingDevice.Model.name} ${polling.DEVICES[keydevice].name}`,
                        location: pollingDevice.Location.Parents.reverse().map((x) => x.name).join(', '),
                        site_id: pollingDevice.Location.Site.id
                    });
                }
            }
        }

        return result
    },

    locations: async (data, req) => {
        return polling.getLocation(data);
    },

    getLocation(location) {
        const result = {
            devices: {},
            status: {
                nolink: 0,
                run: 0,
                idle: 0,
            },
            children: {},
        };
        const devices = Object.values(this.DEVICES).filter((x) => x.location_id === location.id);
        devices.forEach((dev) => {
            const state = this.deviceState(dev.id);
            result.devices[dev.id] = state;
            result.status[state]++;
        });

        for (const child of location.locations) {
            result.children[child.id] = this.getLocation(child);
        }

        return result;
    },

    deviceState(device_id) {
        if (!this.DATA[device_id]) return 'nolink';
        if (!this.DATA[device_id].Run) return 'nolink';
        if (this.DATA[device_id].Run.value_bool === true) return 'run';
        else return 'idle';
    },

    getOne(device_id, alias) {
        if (!polling.DATA[device_id]) return null;
        const tag = polling.DATA[device_id][alias];
        if (!tag) return null;
        if (tag.value !== null && tag.value !== undefined) return tag.value;
        if (tag.value_bool !== null && tag.value_bool !== undefined) return tag.value_bool;
        return tag.value_string;
    },
};

module.exports = polling;

/**
 * POLLING START FLAG
 */
let pollingStart = false;
/**
 * POLLING ERROR FLAG
 */
let wasError = false;
/**
 * POLLING TIMEOUT object
 */
let t;
let pre_Value = 0;
const f = () => {
    repository
        .getList('Live')
        .then((data) => {
            let _totalalarm = 0;
            polling.Alarms = [];
            if (!pollingStart) {
                console.log('POLLING IS STARTED');
                pollingStart = true;
            }

            for (let item of data) {
                if (item.device_id) {
                    if (!polling.DATA[item.device_id]) polling.DATA[item.device_id] = {};
                    polling.DATA[item.device_id][item.alias] = item;
                    if (item.alarm) {
                        polling.Alarms.push(item);
                        _totalalarm++;
                    }
                } else {
                    if (!polling.MODEMDATA[item.modem_id]) polling.MODEMDATA[item.modem_id] = {};
                    polling.MODEMDATA[item.modem_id][item.alias] = item;
                }

            }

            totalalarm = _totalalarm;
            t = setTimeout(() => {
                f();
            }, TIMEOUT);
            wasError = false;

            if (!deviceRefreshStarted) deviceRefresh();
        })
        .catch((err) => {
            if (!wasError) {
                wasError = true;
                console.error(err);
            }
            t = setTimeout(() => {
                f();
            }, TIMEOUT);
        });
};

let deviceRefreshError = false;
let deviceRefreshStarted = false;
const deviceRefresh = async () => {
    try {
        deviceRefreshStarted = true;

        let deviceIds = [];
        for (let devicekey in polling.DATA) {
            if (devicekey === 'null') continue;
            deviceIds.push(devicekey);
        }
        let devices = await repository.getList('Device', { id: deviceIds });
        let locationIds = devices.map((x) => x.location_id);
        let locations = await repository.superList('Location', { id: locationIds }, ['Site']);
        for (let location of locations) {
            location.Parents = await LOCATION.getParents(location.id);
        }
        let modelIds = devices.map((x) => x.model_id);
        let models = await repository.getList('Model', { id: modelIds });
        const MODELS = {};
        models.forEach((model) => (MODELS[model.id] = model));

        devices.forEach((dev) => {
            dev.Location = locations.find((x) => x.id == dev.location_id);
            dev.Model = MODELS[dev.model_id];
            polling.DEVICES[dev.id] = dev;
        });

        deviceRefreshError = false;
        setTimeout(() => {
            deviceRefresh().then();
        }, DEVICETIEMOUT);
    } catch (e) {
        if (!deviceRefreshError) console.error(e);
        deviceRefreshError = true;
        setTimeout(() => {
            deviceRefresh().then();
        }, DEVICETIEMOUT);
    }
    return;
};

if (config.polling) t = setTimeout(f, TIMEOUT);
else console.log('POLLING IS DISABLED');
