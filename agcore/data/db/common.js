const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const oplib = {
    $and: [Op.and],
    $or: [Op.or],
    $gt: [Op.gt],
    $gte: [Op.gte],
    $lt: [Op.lt],
    $lte: [Op.lte],
    $ne: [Op.ne],
    $eq: [Op.eq],
    $is: [Op.is],
    $not: [Op.not],
    // [Op.between]: [6, 10],     // BETWEEN 6 AND 10
    // [Op.notBetween]: [11, 15], // NOT BETWEEN 11 AND 15
    // [Op.in]: [1, 2],           // IN [1, 2]
    // [Op.notIn]: [1, 2],        // NOT IN [1, 2]
    // { $like: [Op.like] },
    // [Op.notLike]: '%hat'       // NOT LIKE '%hat'
    // [Op.iLike]: '%hat'         // ILIKE '%hat' (case insensitive) (PG only)
    // [Op.notILike]: '%hat'      // NOT ILIKE '%hat'  (PG only)
    // [Op.startsWith]: 'hat'     // LIKE 'hat%'
    // [Op.endsWith]: 'hat'       // LIKE '%hat'
    // [Op.substring]: 'hat'      // LIKE '%hat%'
    // [Op.regexp]: '^[h|a|t]'    // REGEXP/~ '^[h|a|t]' (MySQL/PG only)
    // [Op.notRegexp]: '^[h|a|t]' // NOT REGEXP/!~ '^[h|a|t]' (MySQL/PG only)
    // { $iRegexp, [Op.iRegexp]},
    // { $notIRegexp: [Op.notIRegexp] },
    
};

const repo = {
    prepareLegend: function (entity) {
        let result = Object.assign({}, entity);
        delete result.collection;
        result.fields.forEach(field => {
            if (field.listbox) return field.datatype = "listbox";
            if (field.reference) return field.datatype = "reference";
            field.datatype = typeof field.type === 'string' ? field.type : field.type.name.toLowerCase();
        });
        return result;
    },
    /** определить объект field по имени или ссылке
     * @param { String } entityName имя таблицы - entity
     * @param { String } fieldName имя поля
     */
    getField: function (entityName, fieldName) {
        let entity = entities[entityName];
        for (let field of entity.fields) {
            if (field.name === fieldName || field.reference === fieldName || field.listbox === fieldName) return field;
        }
        return null;
    },
    /**
     * 
     * @param { any } q where запрос
     */
    convertQuery: function (q) {
        let rec = (obj) => {
            for (let key in obj) {
                if (typeof obj[key] === 'object') rec(obj[key]);

                for (let i in oplib)
                    if (i == key) {
                        obj[oplib[key][0]] = obj[key];
                        delete obj[key];
                    }

            }
        };

        rec(q);
    }
}

module.exports = repo;