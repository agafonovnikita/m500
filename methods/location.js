const repository = require('../agcore/data/db/repository');

const location = {
    getParents: (locationId) => {
        return new Promise((resolve, reject) => {
            if (!Number.isInteger(locationId)) reject({ code: 'Bad request' });
            let result;
            repository.query('get_parents', [locationId])
                .then(data => {
                    result = data;
                    return repository.getList('LocationType');
                })
                .then(location_types => {
                    for (let item of result) {
                        item.LocationType = location_types.find(x => x.id === item.location_type);
                    }
                    resolve(result);
                })
                .catch(err => {
                    console.error(err);
                    reject(err);
                })

        });
    },

    locationTreeTable: async (data) => {

        // console.log(data);

        const { site_id } = data;

        const qFilter = site_id ? { site_id } : {};

        let locations = await repository.getList('Location', qFilter);
        let locationTypes = await repository.getList('LocationType', qFilter);
        let siteList = await repository.getList('Site');

        let locationPaths = {};
        let types = {};
        let sites = {}

        for (let location of locations) {
            let type = types[location.location_type];
            if (!type) {
                type = locationTypes.find(x => x.id == location.location_type);
                types[location.location_type] = type;
            }
            location.LocationType = type;

            let site = sites[location.site_id];
            if (!site) {
                site = siteList.find(x => x.id == location.site_id);
                sites[location.site_id] = site;
            }
            location.Site = site;


            let locationPath = findLocationPath(location, locations, locationPaths);
            locationPaths[location.id] = locationPath;

            location.Location = locationPath;
        }

        let parentLocations = [];
        for (let location of locations) {
            let item = {
                value: location.id,
                displayname: locationPaths[location.id] ? locationPaths[location.id] + ' / ' + location.name : location.name,
                site_id: location.site_id
            }
            parentLocations.push(item);
        }

        parentLocations.sort((a, b) => {
            if (a.displayname > b.displayname) return 1;
            if (a.displayname < b.displayname) return -1;
            return 0;
        });

        return [
            locations,
            parentLocations,
            locationTypes,  //.map(x => ({ value: x.id, displayname: x.name })),
            siteList,   //.map(x => ({ value: x.id, displayname: x.name })),
        ];
    },

}

const empty = '';

function findLocationPath(location, locations, locationPaths) {

    if (!location.location_id) {
        return empty;
    }

    let locPath = locationPaths[location.id];

    if (locPath || locPath === empty) return locPath;

    let parent = locations.find(x => x.id == location.location_id);
    let parentLocPath = findLocationPath(parent, locations, locationPaths);

    locPath = parentLocPath === empty ? parent.name : parentLocPath + ' / ' + parent.name;

    locationPaths[location.id] = locPath;

    return locPath;
}


module.exports = location;