const repository = require('../agcore/data/db/repository');
const core = require('../agcore/core/core');
const moment = core.moment;

const auth = require('../agcore/auth/auth.jwt.handler');

const Location = require('./location');
const Vocabulary = require('../lib/vocabulary');

class Events {


    static async get(req, data) {

        const user = await auth.getUserFromReq(req);

        const language = user.language || 'ru';

        const events = await repository.superList('EventLog', {}, ['User']);

        const deviceIds = [];
        const locationIds = [];

        for (const event of events) {
            if (event.object_type === 'device') {
                deviceIds.push(+event.object_id);
            }
        }

        const devices = await repository.superList('Device', { id: deviceIds }, ["Location", 'Model']);
        const sites = await repository.getList('Site');

        const Parents = new Map();

        for (const device of devices) {
            let parents = Parents.get(device.location_id);

            if (!parents) {
                parents = await Location.getParents(device.location_id);
                Parents.set(device.location_id, parents);
            }

            device.LocationName = device.Location.name;
            for (const parent of parents) {
                device.LocationName += ' / ' + parent.name;
            }
        }

        const result = [];

        for (const event of events) {
            const userName = getUserName(event.User);
            const dt = moment(event.dt).format('DD.MM.YYYY HH:mm:ss');

            switch (event.action) {
                case 'Login':
                case '#event.login':
                    result.push({
                        dt,
                        user: userName,
                        user_id: user.id,
                        action: '#event.login',
                        description: Vocabulary.smartGet('#event.description.login', language) + ' ' + userName
                    })
                    break;
                case '#event.set_parameter':
                    const payload = JSON.parse(event.payload);
                    const device = devices.find(x => x.id == event.object_id);
                    let description = payload.server_alias + ' = ' + payload.new_value;
                    if (device) description += ' ' + Vocabulary.smartGet('#common.device', language) + ' ' + device.Model.name + ' ' + device.name;
                    result.push({
                        dt,
                        user: userName,
                        user_id: user.id,
                        action: event.action,
                        description
                    })
                    break;
            }
        }
        return result;
    }
}

const getUserName = (user) => user.surname + ' ' + user.name;

module.exports = Events;
