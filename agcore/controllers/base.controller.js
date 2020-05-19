const entities = require('../data/entities');
const defaultController = require('./entities/default.controller');
const fs = require('fs');
const ControllerFolderPath = process.env.ControllersPath; //__dirname + '/../../data/controllers/'

const controller = {};

let cntrlFiles = [];

const filesInit = function() {
    let files;
    try {
        files = fs.readdirSync(ControllerFolderPath);
    } catch (err) {
        return;
    }

    for (let i = 0; i < files.length; i++) {
        let fileparts = files[i].split('.');
        if (fileparts.length === 3 && fileparts[2] === 'js' && fileparts[1] === 'controller')
            if (fileparts[0] !== 'default')
                cntrlFiles.push({
                    entity: fileparts[0],
                    file: `${fileparts[0]}.${fileparts[1]}`,
                });
    }
};

const controllerInit = function() {
    filesInit();
    for (let entityName in entities) {
        controller[entityName] = new defaultController(entityName);
    }
    for (let fileCntrl of cntrlFiles) {
        if (controller[fileCntrl.entity]) {
            let entityController = require(ControllerFolderPath + fileCntrl.file);
            for (let method in entityController) {
                controller[fileCntrl.entity][method] = entityController[method];
            }
        }
    }
};

controllerInit();

module.exports = controller;
