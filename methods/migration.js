
const Core = require('../agcore/core/core');
const controllers = Core.controllers; //require('../agcore/controllers/base.controller');
const repository = Core.repository;
const Op = repository.Sequelize.Op;

const location = require('./location');

const exceljs = require('exceljs');
const path = require('path');
const fs = require('fs');
const moment = Core.moment;
const _ = require('lodash');

const cyrillicToTranslit = require('cyrillic-to-translit-js');

class Migration {

    static async getVocabulary() {
        const vocabulary = await repository.getList('Vocabulary', {}, [['word']]);

        //const excelRows = [];

        const wordMap = {};

        const langs = new Set();

        for (const word of vocabulary) {
            if (!wordMap[word.word]) {
                wordMap[word.word] = {};
            }

            const wordView = wordMap[word.word];

            wordView[word.lang] = word;

            langs.add(word.lang);

        }

        return { wordMap, langs };
    }

    static async exportVocabulary(req, data) {

        const user = await Core.auth.getUserFromReq(req);

        if (!user.is_admin) throw new Core.Error.ForbiddenError();

        const { wordMap, langs } = await this.getVocabulary();


        // EXCEL
        const workbook = new exceljs.Workbook();

        const sheet = workbook.addWorksheet('Vocabulary');

        const firstRow = ['Word']
        for (const lang of langs) {
            firstRow.push(lang);
        }
        sheet.addRow(firstRow);

        for (const word in wordMap) {
            const row = [];

            row.push(word);

            for (const lang of langs) {
                row.push(wordMap[word][lang] ? wordMap[word][lang].translation || '' : '');
            }

            sheet.addRow(row);
        }

        sheet.style = { font: { vertical: 'middle', horizontal: 'center' } };

        // STYLE
        const row = sheet.getRow(1);
        row.height = 20;
        row.style = { font: { bold: true, size: 12 } };

        let column = sheet.getColumn(1);
        column.width = 20;
        for (let i = 0; i < langs.size; i++) {
            column = sheet.getColumn(2 + i);
            column.width = 20;
        }

        const _filename = 'vocabulary.xlsx';
        const filePath = path.join(__dirname, '..', 'uploads', 'export', _filename);

        await workbook.xlsx.writeFile(filePath);

        await pause(500);

        return { filename: _filename };
    }

    static async importVocabulary(req, data) {
        const user = await Core.auth.getUserFromReq(req);

        if (!user.is_admin) throw new Core.Error.ForbiddenError();

        const filename = data.file;
        const fileFullPath = __dirname + '/../uploads/import/' + filename

        const workbook = new exceljs.Workbook();

        await workbook.xlsx.readFile(fileFullPath);

        const worksheet = workbook.getWorksheet(1);

        const firstRow = worksheet.getRow(1);

        const langs = firstRow.values.splice(2);

        const updates = [];

        for (let i = 2; i < worksheet.rowCount; i++) {
            const row = worksheet.getRow(i);
            const word = row.values[1];

            if (!word) continue;

            for (let j = 2; j < langs.length + 2; j++) {
                const lang = langs[j - 2];
                const translation = row.values[j];

                if (!translation) continue;

                updates.push({
                    lang, word, translation
                });
            }
        }

        const { wordMap } = await this.getVocabulary();

        const result = {
            update: 0,
            insert: 0
        }

        for (const update of updates) {
            let id = _.get(wordMap, [update.word, update.lang, 'id'], null);

            if (id) {
                await repository.update('Vocabulary', { ...update, id })
                result.update++;
            } else {
                await repository.update('Vocabulary', update);
                result.insert++;
            }
        }

        fs.unlink(fileFullPath, () => { });

        return result;
    }
}

const pause = (interval) => {
    return new Promise(resolve => {
        setTimeout(
            () => resolve(true), interval
        )
    })
}

module.exports = Migration;
