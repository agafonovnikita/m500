const fs = require('fs');
//let srcPath = './../data';
const enums = require('./../data/enums');
const entities = require('./../data/entities');
let dstPath = './../../webui/src/app/generated';

async function build() {
    if (process.argv[2]) dstPath = process.argv[2];
    // 1. entities
    //createFolder
    if (!fs.existsSync(dstPath)) fs.mkdirSync(dstPath);
    for (let eName in entities) {
        let entity = entities[eName];
        if (!fs.existsSync(dstPath + '/entities')) fs.mkdirSync(dstPath + '/entities');
        let data = `export class ${eName}Model {\n`;
        for (let field of entity.fields) data += `\t${field.name} : ${field.type.name};\n`
        data += '}';
        fs.writeFileSync(`${dstPath}/entities/${eName}.ts`, data);
    }
    //2 enums
    let data = 'let ENUMS = {\n';
    for (let enumName in enums) {
        let enm = enums[enumName];
        if (typeof enm !== 'object') continue;
        data += `\t${enumName} : { \n`;
        Object.keys(enm).forEach(key => {
            data += `\t\t${key} : ${enm[key]},\n`;
        })
        data += `\t},\n`;
    }
    data += `}\nexport { ENUMS };`;

    fs.writeFileSync(`${dstPath}/enum.ts`, data);
}

async function build2() {
    let files = fs.readFileSync('../data/enums');
    //const enumFactory = require('./../data/enums/auth');
    let enumdata = `module.exports = {\n`;
    let lbdata = `module.exports = {\n`;

    for (let enumName in enumFactory) {
        enumdata += `\t${enumName}: {\n`;
        lbdata += `\t${enumName}: {\n`;
        let enumitems = enumFactory[enumName];
        for (let itemname in enumitems) {
            switch (typeof enumitems[itemname]) {
                case "number":
                case "string": value = enumitems[itemname];
                    lbdata += `\t\t${value}: '${itemname}',\n`
                    break;
                case 'object':
                    value = enumitems[itemname].value;
                    lbdata += `\t\t${value}: '${enumitems[itemname].text || itemname}',\n`
                    break;
            }
            enumdata += `\t\t${itemname}: ${value},\n`
        }
        enumdata += `\t},\n`;
        lbdata += `\t},\n`;
    }
    enumdata += `}`;
    lbdata += `}`;
    fs.writeFileSync(`enums.js`, enumdata);
    fs.writeFileSync(`listbox.js`, lbdata)
}


build2().then(() => {
    console.log('ok');
    process.exit(1);
}).catch(ee => {
    console.error(ee);
    process.exit(1);
});

