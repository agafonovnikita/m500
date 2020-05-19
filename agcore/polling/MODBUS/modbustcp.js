const repository = require('./../../data/db/repository');
const modbusClient = require('modbusjs').ModbusTcpClient;
const moment = require('moment');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const fp = require('ieee-float');
const ModbusDataType = require('./modbusDataType');

let polling = function (ipAddress, ipPort = 502, ID = 1) {
    let self = this;

    // this.Device = device;
    // this.DeviceAlarm = null;
    this.Tags = null;
    this.ipAddress = ipAddress;
    this.ipPort = ipPort;
    this.Timeout = 1000;
    this.unitId = ID;
    this.connectionStatus = "none";
    // this.clientError = false;
    // this.reconnectTimeout = this.Timeout * 3;
    // this.ArchiveData = {};
    // this.currentDataInited = false;
    // this.CurrentData = {};
    // this.Alarms = {};
    // this.AlarmHistory = {};
    // this.connectionError = null;
    // this.Status = {
    //     polling: false,
    //     toStop: false,
    //     toStart: false,
    // };
    // this.Packages = [];
    // this.WriteData = {};
    // this.waswrite = false;

    this.initClient();
}

function parseAddress(address) {
    let dotIndex = address.indexOf('.');
    if (~dotIndex) return parseInt(address);
    return parseInt(address.split('.')[0]);
}

polling.prototype.initClient = function () {
    this.Client = new modbusClient(this.ipAddress, this.ipPort || 502, { debug: true })
}
///
const modbusLimit = 50;

//////////////
polling.prototype.setPackages = function (tags) {
    let self = this;
    this.Tags = tags;
    this.Packages = [];
    for (let i = 0; i < 4; i++) {
        let typeTags = this.Tags.filter(x => x.type === i);
        if (typeTags != 0) {
            typeTags.sort((a, b) => {
                let _a = parseAddress(a.address);
                let _b = parseAddress(b.address);
                if (_a < _b) return -1;
                if (_a > _b) return 1;
                return 0;
            });
            let makeNewPackage = () => { return { type: i, tags: [], guid: uuidv4() }; }
            let package = makeNewPackage();
            this.Packages.push(package);
            typeTags.forEach(x => {
                if (package.tags.length !== 0) {
                    let fNewPackage = false;
                    if (package.tags.length > 200) {
                        fNewPackage = true;
                    } else if (parseAddress(x.address) - parseAddress(package.tags[0].address) > 200) {
                        fNewPackage = true;
                    }
                    else {
                        if (parseAddress(x.address) - parseAddress(package.tags[package.tags.length - 1].address) > 50) fNewPackage = true;
                    }
                    if (fNewPackage) {
                        package = makeNewPackage();
                        this.Packages.push(package);
                    }
                }
                else {
                    package.startAddress = parseAddress(x.address);
                }
                package.tags.push(x);
                package.endAddress = parseAddress(x.address);
            });
        }
    }
    return this.Packages;
}

polling.prototype.get = function (pack) {
    let self = this;
    return new Promise((resolve, reject) => {
        let connectPromise = Promise.resolve();
        if (this.Client.isConnected()) {

        } else {
            connectPromise = this.Client.connect();
        }
        self.connectionStatus = "";
        connectPromise
            .catch(err => {
                //console.error(err);
                self.connectionStatus = "error";
            })
            .then(() => {
                let readPromise = Promise.resolve([]);
                if (self.connectionStatus !== "error") {
                    switch (pack.type) {
                        case ModbusDataType.Coil:
                            break;
                        case ModbusDataType.DiscreteInput:
                            break;
                        case ModbusDataType.HoldingRegister:
                            readPromise = this.Client.readHoldingRegisters(pack.startAddress, pack.endAddress - pack.startAddress + 2);
                            break;
                        case ModbusDataType.InputRegister:
                            break;
                    }
                }
                return readPromise;
            })
            .then((data) => {
                let result = {};
                if (self.connectionStatus === "error") {
                    result["connection"] = false;
                    for (let tag of pack.tags) {
                        result[tag._id] = null;
                    }
                } else {
                    result["connection"] = true;
                    for (let tag of pack.tags) {
                        result[tag._id] = getValue(pack, tag, data.result);
                    }
                }
                resolve(result);
            })
            .catch(err => {
                console.error(err);
                reject(err);
            });
    });
}

function getValue(pack, tag, dataArray) {
    try {
        let result = null;
        let index = parseAddress(tag.address) - pack.startAddress;
        switch (tag.valueType) {
            case 0: result = dataArray[index];
                break;
            case 2: result = ieee32ToFloat(dataArray[index + 1] * 65536 + (dataArray[index] < 0 ? 65536 + dataArray[index] : dataArray[index]));
                break;
            default: return null;
        }
        return tag.useKoef && tag.koef ? result * tag.koef : result;
    }
    catch (err) {
        return null;
    }
}

function ieee32ToFloat(intval) {
    var fval = 0.0;
    var x;//exponent
    var m;//mantissa
    var s;//sign
    s = (intval & 0x80000000) ? -1 : 1;
    x = ((intval >> 23) & 0xFF);
    m = (intval & 0x7FFFFF);
    switch (x) {
        case 0:
            //zero, do nothing, ignore negative zero and subnormals
            break;
        case 0xFF:
            if (m) fval = NaN;
            else if (s > 0) fval = Number.POSITIVE_INFINITY;
            else fval = Number.NEGATIVE_INFINITY;
            break;
        default:
            x -= 127;
            m += 0x800000;
            fval = s * (m / 8388608.0) * Math.pow(2, x);
            break;
    }
    return fval;
}

module.exports = polling;