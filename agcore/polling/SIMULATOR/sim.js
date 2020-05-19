const repository = require('./../../data/db/repository');
const moment = require('moment');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const fp = require('ieee-float');
const enms = require('./../../data/enums');

let polling = function () {
    let self = this;
    this.Tags = null;
    this.Timeout = 1000;
    // this.unitId = ID;
    this.connectionStatus = "none";
    this.simtags = {};

}


/**
 * Создает пакеты для опроса
 */
polling.prototype.setPackages = function (tags) {
    let self = this;
    this.Tags = tags;
    this.Packages = [];
    this.Packages.push({ tags: tags });
    this.refreshTags(tags);
    return this.Packages;
}

/**
 * Запрос устройства
 */
polling.prototype.get = function (pack) {
    let self = this;
    return new Promise((resolve, reject) => {
        let result = {};
        for (let key in this.simtags) {
            let simtag = this.simtags[key];
            let dt = new Date();
            if (!simtag.dt) simtag.dt = dt;
            result[simtag.tag._id] = getNewValue(simtag, dt);
        }
        resolve(result);
    })
}


function getNewValue(simtag, dt) {
    let delta = Math.abs(simtag.tag.max - simtag.tag.min);
    let length = simtag.tag.timeout ? moment(dt - simtag.dt).valueOf() / simtag.tag.timeout : 1;

    switch (simtag.tag.type) {
        case enms.SimulatorType.SIN:
            simtag.value = Math.sin(length * Math.PI) * (delta / 2) + delta / 2 + simtag.tag.min;
            break;
        case enms.SimulatorType.COS:
            simtag.value = Math.cos(length * Math.PI) * (delta / 2) + delta / 2 + simtag.tag.min;
            break;
        case enms.SimulatorType.CONSTANT:
            simtag.value = simtag.tag.min;
            break;
        case enms.SimulatorType.RANDOM:
            simtag.value = Math.random() * (simtag.tag.max - simtag.tag.min) + simtag.tag.min;
            break;
        case enms.SimulatorType.STAIRS:
            length = length - Math.floor(length);
            if (length < 0.5) {
                simtag.value = simtag.tag.min + delta * length * 2;
            } else {
                simtag.value = simtag.tag.max - delta * (length - 0.5) * 2;
            }
            break;
        case enms.SimulatorType.SAW:
            length = length - Math.floor(length);
            simtag.value = simtag.tag.min + delta * length;
            break;
    }

    return simtag.value;
}

polling.prototype.refreshTags = function (tags) {
    //todo сравнение новых тегов с имеющимися
    tags.forEach(tag => {
        let id = tag._id;
        this.simtags[id] = {
            tag: tag,
            dt: null,
            value: null
        };
    });
}




module.exports = polling;