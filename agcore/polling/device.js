const repository = require('./../data/db/repository');
const ModbusTcp = require('./MODBUS/modbustcp');
const Simulator = require('./SIMULATOR/sim');
const LIB = require('./../helpers/lib');
const ValueType = require('./valueType');
const ENUMS = require("../data/enums");

let defaultPollingCycle = 500;
let Device = function (device) {
    this.dbDevice = device;
    this.status = 'notinited';
    this.archive = {};
    this.online = {};

    this.pollingCycle = device.pollingCycle || defaultPollingCycle;
    this.packages = null; //пакеты для опроса устройства - соответствие тегов базы и тегов опроса
    this.tags = [];
    switch (device.type) {
        case ENUMS.DevicePollingType.SIMULATOR:
            this.polling = new Simulator();
            break;
        case ENUMS.DevicePollingType["MODBUS TCP"]:
            this.polling = new ModbusTcp(this.dbDevice.address || "127.0.0.1", this.dbDevice.port || 502);
            break;
        default:
            throw new Error("Device Polling Type is not determinated");
            break;
    }

    this.toStop = false;
}

Device.prototype.start = function () {
    let self = this;
    this.toStop = false;
    switch (this.status) {
        case "notinited":
            this.status = "inited";
        case "inited":
            break;
        case "run":
            return;
        case "stop":
            break;
    }
    this.init()
        .then(() => {
            this.do();
        })
        .catch(err => {
            this.status = "error";
        })

}

Device.prototype.init = async function () {
    try {
        let onlinetags = await repository.getList("Online");
        for (let tag of onlinetags) {
            this.online[tag.tagId] = tag;
        }
        return true;
    }
    catch (err) {
        console.error(err);
        throw new Error(err);
    }
}

Device.prototype.stop = function () {
    if (this.toStop === true) return;
    this.toStop = true;
    switch (this.status) {
        case "notinited":
            break;
        case "inited":
            break;
        case "run":
            break;
        case "stop":
            break;
    }

    this.status = "stop";
}

Device.prototype.do = function () {
    this.status = "run";
    let self = this;
    LIB.promiseArray(
        this.packages,
        (pack) => {
            return new Promise((resolve, reject) => {
                self.polling.get(pack)
                    .then(data => {
                        return self.save(pack, data);
                    })
                    .then(data => {
                        resolve(data);
                    })
                    .catch(err=>{
                        console.error(err);
                        reject(err);
                    });
            })
        }).then(data => {
            self.refresh();
        });
}


Device.prototype.save = function (pack, data) {
    let self = this;
    return new Promise((resolve, reject) => {
        let onlinetags = [];
        let archivetags = [];
        let dt = new Date();

        for (let tag of pack.tags) {
            let newvalue = data[tag._id];
            let oldvalue = self.archive[tag._id] === undefined ? null : self.archive[tag._id];
            let toArchive = oldvalue === null && newvalue === null ? false : true;

            if (oldvalue !== undefined) {

                if (oldvalue === newvalue) toArchive = false;
                else if (tag.useDelta) {
                    switch (tag.valueType) {
                        case ValueType.int:
                        case ValueType.float:
                        case ValueType.int32:
                            if (oldvalue === null && newvalue === null) toArchive = false;
                            else if (oldvalue === null || newvalue === null) toArchive = true;
                            else {
                                let delta = tag.deltaValue || 1;
                                if (tag.isAbsDelta) toArchive = Math.abs(newvalue - oldvalue) > delta;
                                else toArchive = Math.abs(newvalue - oldvalue) / oldvalue > delta * 0.01;
                            }
                            break;
                    }
                }
            };

            if (toArchive) {
                archivetags.push({
                    tagId: tag._id.toString(),
                    dt: dt,
                    value: newvalue,
                    preValue: oldvalue
                });
            }

            let newonlinetag = {
                tagId: tag._id.toString(),
                dt: dt,
                value: newvalue
            }

            let oldonlinetag = self.online[tag.id];
            if (oldonlinetag) {
                newonlinetag._id = oldonlinetag._id;
            }
            onlinetags.push(newonlinetag);
        }

        Promise.all([repository.updateList('Online', onlinetags), repository.updateList('Archive', archivetags)])
            .then(([onlinetags, archivetags]) => {
                for (let archivetag of archivetags) {
                    self.archive[archivetag.tagId] = archivetag.value;
                }
                for (let onlinetag of onlinetags) {
                    self.online[onlinetag.tagId] = onlinetag;
                }
                resolve(onlinetags);
            })
            .catch(reject);
    });
}

Device.prototype.refreshTags = function (tags) {
    this.tags = tags;
    this.packages = this.polling.setPackages(tags);
}

Device.prototype.refresh = function () {
    if (!this.toStop)
        setTimeout(this.do.bind(this), this.pollingCycle);
}


module.exports = Device;