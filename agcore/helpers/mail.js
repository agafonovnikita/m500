const nodemailer = require('nodemailer');
const fs = require('fs');
const emailConfig = require('../data/constants').email;
const repository = require('./../data/db/repository');
const nup = () => { };
const config = require('./../data/config');

let mailHelper = {
    /** Подготовка email html сообщения 
     * @param { string } template шаблон сообщения
     * @param { object }  data данные
    */
    prepareHtml: function (template, data) {
        return 'text';
    },
    /**
     * Отправка сообщения
     * 
     * @param {object} emailObject      -- где-то потом я отгребу (todo)
     */
    send: function ({ subject, html, to, from }) {

        return new Promise((resolve, reject) => {
            try {
                let transporter = nodemailer.createTransport(emailConfig.transport);

                let mailOptions = {
                    from: from || emailConfig.noreply,
                    to: to || emailConfig.info,
                    subject: subject || "Тест",
                    html: html || '<h2>Тест</h2>',
                };

                if (!config.emailnotify) resolve({ ok: 'ok' });


                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        mailOptions.dt = new Date();
                        mailOptions.pending = false;
                        mailOptions.result = 99;
                        mailOptions.errorMessage = JSON.stringify(error);
                        repository.update('Email', mailOptions).then();
                        reject(error);
                        return console.log(error);
                    }
                    mailOptions.dt = new Date();
                    mailOptions.pending = false;
                    mailOptions.result = 1;
                    repository.update('Email', mailOptions).then();
                    resolve(info);
                });
            } catch (e) {
                reject(e);
            }
        })
    }
}


module.exports = mailHelper;