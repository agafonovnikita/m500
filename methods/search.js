const controllers = require('../agcore/controllers/base.controller');
const location = require('./location');
const repository = require('../agcore/data/db/repository');
const Op = repository.Sequelize.Op;

const Parents = {};
const GetParents = async (location_id) => {
    if (Parents[location_id]) return Parents[location_id];
    Parents[location_id] = await location.getParents(location_id);
    return Parents[location_id];
};

const Search = {
    find: async (search_string, req) => {
        let result = {
            locations: [],
            devices: []
        };

        let locationList;
        let allLocations;
        /*  try {
             //локации
             locationList = await controllers['Location'].getList(req, {
                 name: { [Op.iLike]: '%' + search_string + '%' },
             });
         } catch (err) {
             console.error(err);
             locationList = undefined;
         } */
        try {
             allLocations= await controllers['Location'].getList();
            locationList = allLocations.filter(loc => {
                return loc.name.toLowerCase().includes(search_string.toLowerCase())
            });
        } catch (error) {
            console.error(error);
            locationList = undefined;
        }

        if (locationList) {
            for (let location of locationList) {
                try {
                    let parents = await GetParents(location.id);
                    result.locations.push({ location, parents });
                } catch (err) {
                    console.error(err);
                }
            }
        }

        //устройства
        const resultDevices = new Set();
        try {
            let deviceList = [];
            deviceList = await controllers['Device'].getList(req, {
                name: { [Op.iLike]: '%' + search_string + '%' },
            });
            let deviceList2 = await controllers['Device'].getList();
            deviceList.forEach(device => {
                resultDevices.add(device);
            });
            console.log();
        } catch (err) {
            console.error(err);
        }

        //девайсы по моделям
        try {
            let modelsList = await controllers['Model'].getList(req, {
                name: { [Op.iLike]: '%' + search_string + '%' },
            });
            if (modelsList) {
                let deviceList = [];
                deviceList = await controllers['Device'].getList(req, {
                    model_id: { [Op.in]: modelsList.map(item => item.id) },
                });
                deviceList.forEach(device => {
                    resultDevices.add(device);
                });
                console.log();
            }
        } catch (error) {
            console.log(error);
        }

        if (resultDevices.size > 0)
            try {
                let modelsList = await controllers['Model'].getList();
                resultDevices.forEach(device => {
                    device.modelName = modelsList.find(model => model.id === device.model_id).name;
                    device.locationName=allLocations.find(location=>location.id===device.location_id).name;
                    result.devices.push(device)
                });
            } catch (error) {

            }

        return result;
    },
};

module.exports = Search;
