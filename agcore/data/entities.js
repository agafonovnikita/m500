const fs = require('fs');
const config = require('./config');

let entities = {
    Test: {
        name: 'Test',
        collection: 'tests',
        fields: [
            { name: 'name', type: String },
            { name: 'index', type: Number },
        ],
        displayForm: ['name'],
        withoutAdmin: true,
    },

    Email: {
        name: 'Email',
        collection: 'Emails',
        fields: [
            { name: 'to', type: String },
            { name: 'from', type: String },
            { name: 'subject', type: String },
            { name: 'dt', type: Date },
            { name: 'result', type: Number },
            { name: 'errorMessage', type: String },
            { name: 'html', type: String },
            { name: 'pending', type: Boolean },
        ],
        displayForm: ['subject'],
    },
    Request: {
        name: 'Request',
        collection: 'Requests',
        fields: [
            { name: 'email', type: String },
            //            { name: 'phone', type: String },
            { name: 'name', type: String },
            { name: 'text', type: String },
            { name: 'dt', type: Date },
            { name: 'answer', type: Boolean },
        ],
        displayForm: ['email'],
    },
};

function init() {
    // let fileList = fs.readdirSync(__dirname + '/../../data/entity');

    const entitiesPath = process.env.EntitiesPath;
    const fileList = fs.readdirSync(entitiesPath);


    for (const fileName of fileList) {
        let composition = fileName.split('.');
        if (composition.length === 3 && composition[2] === 'js' && composition[1] === 'entities') {
            if (config.entities && config.entities.length !== 0)
                if (!config.entities.includes(composition[0])) continue;
            let _entities = require(`${entitiesPath}/${composition[0]}.entities`);
            for (let eName in _entities) {
                if (!entities[eName]) {
                    entities[eName] = _entities[eName];
                    entities[eName].file = composition[0];
                }
            }
        }
    }
}

init();

module.exports = entities;
