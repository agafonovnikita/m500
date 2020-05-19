

let notify = {
    confirmEmail: function (email, guid) {
        return new Promise((resolve, reject) => {
            resolve(true);
        })
    }
}

module.exports = notify;