const enms = require('./enums');
const fs = require('fs');

let listboxes = {

    TagTypes: {
        0: 'Coils',
        1: 'Discrete Inputs',
        2: 'Holding Registers',
        3: 'Input Registers',
    },
    ValueTypes: {
        0: 'int',
        1: 'int32',
        2: 'float',
        3: 'bit',
    },

    ScreenType: {
        0: 'Параметры',
        2: 'Мнемосхема',
        3: 'Заводская площадка'
    },

    DeviceType: {
        1: 'Модем',
        2: 'Станция управления'
    },
    ParameterDataType: {
        1: 'bit',
        2: 'int16',
        3: 'int32',
        11: 'float32',
        12: 'floa64',
        21: 'datetime_utc',
        101: 'string',
        501: 'file'
    },

    genereteList: function (obj) {
        let result = [];
        Object.keys(obj).forEach(key => {
            let item = { value: key };
            if (typeof obj[key] === "object") {
                item.displayname = obj[key].displayname;
            }
            else item.displayname = obj[key];
            result.push(item);
        });
        return result;
    },

}

let fromEnum = function (enumName) {
    let result = {};
    let enm = enms[enumName];
    Object.keys(enm).forEach(key => {
        result[enm[key]] = key;
    });
    return result;
};

Object.keys(enms).forEach(key => {
    if (listboxes[key]) return;
    listboxes[key] = fromEnum(key);
});


const getUserLbxs = () => {

    const entitiesPath = process.env.EntitiesPath;

    const filelist = fs.readdirSync(entitiesPath);

    for (let fileName of filelist) {
        let composition = fileName.split('.');
        if (composition.length === 3 && composition[2] === 'js' && composition[1] === 'listbox') {
            let newLbxs = require(`${entitiesPath}/${composition[0]}.listbox`);
            for (let name in newLbxs) {
                let lbx = newLbxs[name];
                listboxes[name] = {};

                for (let [key, value] of Object.entries(lbx)) {
                    if (typeof value === 'object') {
                        listboxes[name][value.value] = value.displayname || key;
                    }
                    else if (typeof value === 'number' || typeof value === 'string') {
                        listboxes[name][value] = key;
                    }
                }

            }
            //listboxes = Object.assign(listboxes, newLbx);
        }
    }
}

getUserLbxs();

module.exports = listboxes;

