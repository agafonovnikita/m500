const repository = require('./../data/db/repository');
const Device = require('./device');
const LIB = require('./../helpers/lib');

let service = {
    status: {
        init: "notinited",      //runing, ok, notinited, error?
    },
    devices: null,
    toStop: false,
    start: function () {
        let self = this;
        if (this.status.init !== "notinited") return;
        this.status.init = "running";
        this.status.init = "ok";
        if (!this.devices) this.devices = {};
        this.cycle();
    },
    defaultTimeout: 5000,
    cycle: function () {
        if (this.toStop) return this.toStop = false;
        let self = this;
        let deviceToDelete = [];
        repository.getList("Device")
            .then(data => {

                Object.keys(self.devices).forEach(key => {
                    let founded = data.find(x => x._id.toString() === key);
                    if (!founded) {
                        deviceToDelete.push(key);
                        self.devices[key].toDelete = true;
                    }
                });

                data.forEach(dev => {
                    let id = dev._id.toString();
                    if (!self.devices[id]) self.devices[id] = { db: dev };
                    else self.devices[id].db = dev;
                })

                let activeDevices = [];
                Object.keys(self.devices).forEach(key => {
                    let device = self.devices[key];
                    try {
                        if (!device.poll) device.poll = new Device(device.db);

                        if (!device.toDelete && device.db.isActive) {
                            activeDevices.push(device);

                        } else device.poll.stop();

                        if (device.toDelete) delete self.devices[key];
                    }
                    catch (err) {
                        console.error(err);
                    }
                });

                return LIB.promiseArray(activeDevices, toStartDevice);
            })
            .then(() => {
                self.refresh();
            })
            .catch(err => {
                self.status.init = err;
                this.refresh();
                console.error(err);
            });
    },
    refresh: function () {
        if (this.toStop) return this.toStop = false;
        this.clearTimeout = setTimeout(this.cycle.bind(this), this.defaultTimeout);
    },
    stop: function () {
        this.toStop = true;
        clearTimeout(this.cycleTimeout);
    }
}

function toStartDevice(device) {
    return new Promise((resolve, reject) => {
        repository.getList('Tag', { deviceId: device.db._id.toString() })
            .then(data => {
                let needRefresh = true;
                if (!device.tags) device.tags = data;
                else {
                    needRefresh = false;
                    if (device.tags.length !== data.length) needRefresh = true;
                    else {
                        let tagFields = repository.fields['Tag'];
                        for (let i = 0; i < data.length; i++) {
                            let existTag = device.tags.find(x => x._id.toString() === data[i]._id.toString());
                            if (!existTag) {
                                needRefresh = true;
                                break;
                            }

                            for (let j = 0; j < tagFields.length; j++) {
                                let field = tagFields[j];
                                if (data[i][field.name] === existTag[field.name]) continue;
                                needRefresh = true;
                                break;
                            }
                            if (needRefresh) break;
                        }
                    }
                }
                if (needRefresh) {
                    device.tags = data;
                    device.poll.refreshTags(device.tags);
                }
                if (device.poll.status !== "run") device.poll.start();
                resolve(null);
            })
            .catch(err => {
                console.error(err);
                reject({ error: err });
            })
    });

}


module.exports = service;