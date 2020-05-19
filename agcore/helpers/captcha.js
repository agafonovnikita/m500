var svgCaptcha = require('svg-captcha');
const uuidv4 = require('uuid/v4');

let data = {};

let lib = {
    generate: function () {
        let captcha = svgCaptcha.create();
        let guid = uuidv4();
        data[guid] = { dt: new Date(), text: captcha.text };
        return { guid: guid, captcha: captcha.data };
    },
    check: function (captcha) {
        try {
            if (!captcha) return false;
            return captcha.text === data[captcha.guid].text;
        }
        catch (e) {
            return false;
        }
    }
}



setInterval(() => {
    let now = new Date();
    let keysForDelete = [];
    Object.keys(data).forEach(key => {
        if (now - data[key] > 3600000) keysForDelete.push(data[key]);
    })
    keysForDelete.forEach(key => delete data[key]);
}, 60000);


module.exports = lib;