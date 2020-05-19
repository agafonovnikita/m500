const controllers = require('../agcore/controllers/base.controller');
const location = require('./location');
const repository = require('../agcore/data/db/repository');
const Op = repository.Sequelize.Op;
const core = require('../agcore/core/core');

const auth = core.auth;
const Access = core.Access;

const moment = core.moment;

class Statistic {
    static async archive(req, { device_id, alias, start, end }) {
        // TODO CHECK ENTER DATA
        let _start = moment(start);
        let _end = moment(end);
        const tz = new Date().getTimezoneOffset();
        let result = await repository.getList('History', {
            device_id,
            alias,
            dt: {
                [Op.between]: [_start, _end],
            },
        });

        // result.forEach((item) => {
        //     item.dt = moment(item.dt).add(-tz, 'minute');
        // });
        return result;
    }

    static async archiveBool(req, { device_id, alias, start, end }) {
        // const tz = new Date().getTimezoneOffset();
        const _start = moment(start);
        const _end = moment(end);
        const result = await repository.getList('History_Bool', {
            device_id,
            alias,
            dt: {
                [Op.between]: [_start, _end],
            },
        });

        result.forEach((item) => {
            item.value = +item.value;
            item.prev_value = +item.prev_value;
        });
        return result;
    }

    static async archiveString(req, { device_id, alias, start, end }) {
        // const tz = new Date().getTimezoneOffset();
        const _start = moment(start).toDate();
        const _end = moment(end).toDate();
        const result = await repository.getList('History_String', {
            device_id,
            alias,
            dt: {
                [Op.between]: [_start, _end],
            },
        });

        return result;
    }

    static async historyalarms(req, { start, end }) {
        const user = await auth.getUserFromReq(req);
        const user_id = user.id;

        const _start = moment(start).toDate();
        const _end = moment(end).toDate();
        const alarms = await repository.getList('AlarmHistory', {
            [Op.or]: {
                dt_start: {
                    [Op.between]: [_start, _end],
                },
                dt_finish: {
                    [Op.between]: [_start, _end],
                },
            },
            device_id: {
                [Op.ne]: null
            }

        });

        const [devices, locations] = await Promise.all([
            repository.superList('Device', {}, ["Model"]),
            repository.superList('Location', {}, ['Site'])])

        const result = [];

        for (const alarm of alarms) {
            const device = devices.find(x => x.id === alarm.device_id);

            if (!device) continue;
            if (!Access.viewDevice({ user_id, device_id: device.id })) continue;

            const location = locations.find(x => x.id === device.location_id);
            result.push({ alarm, device, location, site_id: location.Site.id });
        }

        return result;
    }

    static async statDevice(req, { device_id, start, end }) {

        const data = await repository.getList(
            'History_Bool',
            {
                device_id,
                alias: ['Run', 'Link'],
                dt: {
                    [Op.between]: [start, end],
                },
            },
            [
                ['dt', 'asc']
            ]
        );

        let total = 0;

        const result = {
            run: 0,
            idle: 0,
            connection: 0,
            alarm: 0
        }

        const firstRun = data.find(x => x.alias === 'Run');
        const firstLink = data.find(x => x.alias === 'Link');

        if (!firstRun && !firstLink) return {
            run: 0,
            idle: 0,
            connection: 100,
            alarm: 0
        };

        let first;

        let dt = start;
        let currentRun = firstRun.prev_value === true;
        let currentLink = firstLink ? firstLink.prev_value === true : true;

        let duration;

        for (const item of data) {
            duration = moment(item.dt).diff(dt, 'seconds');
            dt = item.dt;
            total += duration;

            if (item.alias === 'Link') {
                if (item.value === true) {
                    if (currentLink) {
                        if (currentRun) result.run += duration;
                        else result.idle += duration;
                    } else {
                        result.connection += duration;
                    }
                } else {
                    if (currentLink) {
                        if (currentRun) result.run += duration;
                        else result.idle += duration;
                    }
                    else result.connection += duration
                }

                currentLink = item.value;

            } else {
                if (currentLink) {
                    if (currentRun) result.run += duration;
                    else result.idle += duration;
                } else {
                    result.connection += duration;
                }

                currentRun = item.value;
            }
        }

        duration = moment(end).diff(dt, 'seconds');
        total += duration;

        if (currentLink) {
            if (currentRun) result.run += duration;
            else result.idle += duration;
        } else result.connection += duration;


        if (total === 0) return result;

        result.connection = 100 * result.connection / total;
        result.run = 100 * result.run / total;
        result.idle = 100 * result.idle / total;

        return result;
    }

    static async statDevicePeriod(req, { device_id, period }) {

        const start = moment().add(-1, period).toDate();
        const end = new Date();

        return await this.statDevice(req, { device_id, start, end });

    }

    static async statDevicesPeriod(req, { device_ids, period }) {

        const _period = period || 'day'
        const result = {};
        for (const device_id of device_ids) {
            result[device_id] = await this.statDevicePeriod(req, { device_id, period: _period })
        }

        return result;
    }


    static async stopsDevice(req, { device_id, start, end }) {
        const data = await repository.getList(
            'History_Bool',
            {
                device_id,
                alias: ['Run'],
                dt: {
                    [Op.between]: [start, end],
                },
            },
            [
                ['dt', 'asc']
            ]
        );

        const result = { stops: 0 };

        if (data.length === 0) return result;

        let pre = data[0].prev_value;

        for (const item of data) {
            if (!pre && item.value) result.stops++;
            pre = item.value;
        }

        return result;
    }

}

module.exports = Statistic;
