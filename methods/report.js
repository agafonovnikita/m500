const controllers = require('../agcore/controllers/base.controller');

const Location = require('./location');
const Statistic = require('./statistic');

const repository = require('../agcore/data/db/repository');
const Op = repository.Sequelize.Op;

const exceljs = require('exceljs');
const _ = require('lodash');
const moment = require('moment');
const uuid = require('uuid');
const path = require('path');

const cyrillicToTranslit = require('cyrillic-to-translit-js');

class Report {
    static async statistic(req, data) {
        const { device_id, tags, start, end, filename, title } = data;

        const _start = moment(start);
        const _end = moment(end);

        const numberTags = [];
        const boolTags = [];
        const stringTags = [];

        for (const tag of tags) {
            switch (tag.type) {
                case 4:
                    boolTags.push(tag);
                    break;
                case (5, 9):
                    stringTags.push(tag);
                    break;
                default:
                    numberTags.push(tag);
            }
        }

        const [boolArchive, stringArchive, numberArchive] = await Promise.all([
            boolTags.length === 0
                ? Promise.resolve([])
                : repository.getList('History_Bool', {
                    device_id,
                    alias: {
                        [Op.in]: boolTags.map((x) => x.alias),
                    },
                    dt: {
                        [Op.between]: [_start, _end],
                    },
                }),
            stringTags.length === 0
                ? Promise.resolve([])
                : repository.getList('History_String', {
                    device_id,
                    alias: {
                        [Op.in]: stringTags.map((x) => x.alias),
                    },
                    dt: {
                        [Op.between]: [_start, _end],
                    },
                }),
            numberTags.length === 0
                ? Promise.resolve([])
                : repository.getList('History', {
                    device_id,
                    alias: {
                        [Op.in]: numberTags.map((x) => x.alias),
                    },
                    dt: {
                        [Op.between]: [_start, _end],
                    },
                }),
        ]);


        let dt;
        const excelRows = [];
        excelRows.push([title]);
        excelRows.push([moment(start).format('DD.MM.YY HH:mm:ss') + ' - ' + moment(end).format('DD.MM.YY HH:mm:ss')]);

        let currentRow = [];
        let tagFinished = new Array(tags.length).fill(false);
        const preValue = new Array(tags.length).fill(null);
        const indexes = new Array(tags.length).fill(0);
        const firstRow = ['Date', 'Time'];

        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i];

            firstRow[i + 2] = tag.displayname || tag.alias;

            switch (tag.type) {
                case 4:
                    tag.archive = boolArchive.filter((x) => x.alias === tag.alias);
                    break;
                case (5, 9):
                    tag.archive = stringArchive.filter((x) => x.alias === tag.alias);
                    break;
                default:
                    tag.archive = numberArchive.filter((x) => x.alias === tag.alias);
                    break;
            }

            if (tag.archive.length !== 0) {
                if (!dt) dt = tag.archive[0].dt;
                else if (dt > tag.archive[0].dt) dt = tag.archive[0].dt;

                preValue[i] = tag.archive[0].prev_value;
            } else tagFinished[i] = true;
        }

        excelRows.push(firstRow);

        // TODO add mask
        while (dt) {
            const row = Array.from(preValue);

            let saveIt = false;

            for (let i = 0; i < tags.length; i++) {
                if (tagFinished[i]) continue;

                const tag = tags[i];

                const index = indexes[i];

                if (tag.archive[index].dt === dt) {
                    row[i] = tags[i].archive[index].value;

                    if (preValue[i] !== row[i]) saveIt = true;

                    preValue[i] = row[i];
                    indexes[i] = indexes[i] + 1;
                    if (indexes[i] >= tags[i].archive.length) tagFinished[i] = true;
                }
            }

            if (saveIt || excelRows.length === 0) {
                const _dt = moment(dt);
                excelRows.push([_dt.format('YYYY-MM-DD'), _dt.format('HH:mm:ss'), ...row]);
            }

            dt = null;
            for (let i = 0; i < tags.length; i++) {
                if (tagFinished[i]) continue;

                const index = indexes[i];

                if (!dt) dt = tags[i].archive[index].dt;
                else if (dt > tags[i].archive[index].dt) dt = tags[i].archive[index].dt;
            }
        }

        // EXCEL

        const workbook = new exceljs.Workbook();

        const sheet = workbook.addWorksheet('DATA');

        for (const row of excelRows) {
            sheet.addRow(row);
        }

        sheet.style = { font: { vertical: 'middle', horizontal: 'center' } };

        // STYLE
        const row = sheet.getRow(1);
        row.height = 20;
        row.style = { font: { bold: true, size: 12 } };

        const row3 = sheet.getRow(3);
        row3.height = 20;
        row3.style = { font: { bold: true, size: 12 } };

        let column = sheet.getColumn(1);
        column.width = 13;
        column = sheet.getColumn(2);
        column.width = 13;

        for (let i = 0; i < tags.length; i++) {
            column = sheet.getColumn(i + 3);
            const tag = tags[i];

            switch (tag.type) {
                case 4:
                    column.width = 8;
                    break;
                case (5, 9):
                    column.width = 30;
                    break;
                default:
                    column.width = 13;
                    break;
            }
        }

        const _filename = filename ? cyrillicToTranslit().transform(filename) + '.xlsx' : `statistic_report.xlsx`;
        const filePath = path.join(__dirname, '..', 'uploads', 'report', _filename);
        await Report.createFile(workbook, filePath);
        await pause(500);

        return { filename: _filename };
    }

    static createFile(workbook, filePath) {
        new Promise((resolve, reject) => {
            workbook.xlsx.writeFile(filePath, (err) => {
                if (err) return reject(err);
                resolve(true);
            });
        });
    }

    static async prepareDevices(req, { device_ids }) {
        const devices = await repository.superList('Device', { id: device_ids }, ['Model', 'Location']);

        const locSet = new Set();

        devices.forEach(dev => locSet.add(dev.location_id));

        const parents = {};
        const locations = [];
        for (const loc_id of locSet) {
            parents[loc_id] = await Location.getParents(loc_id);

            const location = parents[loc_id][0];

            parents[loc_id].reverse();

            const fullname = parents[loc_id].map(x => x.name).join(' / ');
            location.fullname = fullname;
            location.devices = devices.filter(x => x.location_id === location.id);

            locations.push(location);
        }
        _.orderBy(locations, ['fullname'], ['asc']);

        return { locations, devices };
    }

    static async loading(req, options) {
        const { device_ids, start, end, filename } = options;

        const data = {}

        for (const device_id of device_ids) {
            data[device_id] = await Statistic.statDevicePeriod(req, { device_id, period: 'day' });
        }

        const { locations, devices } = await this.prepareDevices(req, { device_ids });

        const excelRows = [];
        for (const location of locations) {
            const locDevices = location.devices; //.filter(x => x.location_id === location.id);

            for (const device of locDevices) {
                const row = [];
                row.push(location.fullname);
                row.push(`${device.Model.name} ${device.name}`);

                const devData = data[device.id];
                if (devData) {
                    row.push(devData.run);
                    row.push(devData.idle);
                    row.push(devData.connection);
                }

                excelRows.push(row);
            }
        }

        // EXCEL

        const workbook = new exceljs.Workbook();

        const sheet = workbook.addWorksheet('DATA');

        sheet.addRow(['Location', 'Device', 'Run', 'Idle', 'No Link']);

        for (const row of excelRows) {
            sheet.addRow(row);
        }

        sheet.style = { font: { vertical: 'middle', horizontal: 'center' } };

        // STYLE
        const row = sheet.getRow(1);
        row.height = 20;
        row.style = { font: { bold: true, size: 12 } };


        let column = sheet.getColumn(1);
        column.width = 20;
        column = sheet.getColumn(2);
        column.width = 13;

        const gui = uuid.v4();
        const _filename = filename ? `${filename}.xlsx` : `loading-${gui}.xlsx`;
        const filePath = path.join(__dirname, '..', 'uploads', 'report', _filename);
        await Report.createFile(workbook, filePath);
        await pause(500);

        return { filename: _filename };
    }


    static async stops(req, options) {
        const { device_ids, start, end, filename } = options;

        const data = {}

        const _start = start ? moment(start).toDate() : moment().add(-1, 'day').toDate();
        const _end = end ? moment(end).toDate() : new Date();

        for (const device_id of device_ids) {
            data[device_id] = await Statistic.stopsDevice(req, { device_id, start: _start, end: _end });
        }

        const { locations, devices } = await this.prepareDevices(req, { device_ids });

        const excelRows = [];
        for (const location of locations) {
            const locDevices = location.devices; //.filter(x => x.location_id === location.id);

            for (const device of locDevices) {
                const row = [];
                row.push(location.fullname);
                row.push(`${device.Model.name} ${device.name}`);

                const devData = data[device.id];
                if (devData) {
                    row.push(devData.stops);
                }

                excelRows.push(row);
            }
        }

        // EXCEL

        const workbook = new exceljs.Workbook();

        const sheet = workbook.addWorksheet('DATA');

        sheet.addRow(['Location', 'Device', 'Stops']);

        for (const row of excelRows) {
            sheet.addRow(row);
        }

        sheet.style = { font: { vertical: 'middle', horizontal: 'center' } };

        // STYLE
        const row = sheet.getRow(1);
        row.height = 20;
        row.style = { font: { bold: true, size: 12 } };


        let column = sheet.getColumn(1);
        column.width = 20;
        column = sheet.getColumn(2);
        column.width = 13;

        const gui = uuid.v4();
        const _filename = filename ? `${filename}.xlsx` : `loading-${gui}.xlsx`;
        const filePath = path.join(__dirname, '..', 'uploads', 'report', _filename);
        await Report.createFile(workbook, filePath);
        await pause(500);

        return { filename: _filename };
    }
}




const pause = (interval) => {
    return new Promise(resolve => {
        setTimeout(
            () => resolve(true), interval
        )
    })
}

module.exports = Report;
