const repository = require('../agcore/data/db/repository');
const auth = require('../agcore/auth/auth.jwt.handler');
const { moment } = require('../agcore/core/core');
const polling = require('./../polling/polling');
const uuid = require('uuid').v4;

class Manage {
    static async modbus(req, data) {

        const user = await auth.getUserFromReq(req);

        const now = moment().toDate();

        const configs = await repository.getList('ServerModemDevice', { device_id: data.device_id });
        const config = configs[0];

        const oldValue = polling.getOne(data.device_id, data.server_alias);

        const query = {
            modem_id: config.modem_id,
            device_id: data.device_id,
            server_alias: data.server_alias,
            old_value: oldValue,
            new_value: data.new_value,
            user_id: user.id,
            dt: now,
            server_id: config.server_id,
            guid: uuid(),
        };

        const command = await repository.update('Command', query);

        const eventLog = await repository.update('EventLog', {
            user_id: user.id,
            dt: new Date(),
            action: "#event.set_parameter",
            object_type: 'device',
            object_id: data.device_id,
            value: data.new_value,
            status: 'pending',
            guid: query.guid,
            payload: JSON.stringify(query)
        });

        return command;
    }
}

module.exports = Manage;
