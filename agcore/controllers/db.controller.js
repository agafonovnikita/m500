const repository = require('./../data/db/repository');
const entities = require('./../data/entities');
const listboxes = require('./../data/listboxes');
const url = require('url');

let functional = {
    getLegend: async function (req) {
        let data = req.body;
        let entries = Object.entries(entities);
        let result = {};
        if (data.entities.length === 0)
            entries.forEach(([key, entity]) => {
                if (!entity.withoutAdmin) result[key] = repository.prepareLegend(entity);
            });
        else {
            for (let entity of data.entities) {
                for (let entry of entries) {
                    if (entry[0].toLowerCase() === entity.toLowerCase()) {
                        result[entry[0]] = repository.prepareLegend(entry[1]);
                        break;
                    }
                }
            }
        }
        return result;
    },

    getListboxes: async function (req) {
        let url_parts = url.parse(req.url, true);
        let query = url_parts.query;
        let names = query.ids.split(',');
        let result = {};
        names.forEach(name => {
            result[name] = [];
            Object.keys(listboxes[name]).forEach(key => result[name].push({ value: key, displayname: listboxes[name][key] }));
        });

        return result;
    }
};

module.exports = functional;