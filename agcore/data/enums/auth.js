module.exports = {
    AuthRight: {
        byAccount: { value: 1 },
        byRole: { value: 2 },
        adminOnly: { value: 3 },
        entityRole: { value: 4 },
        relation: { value: 5 }
    },
    AccountStatus: {
        Unconfirmed: { value: 0 },
        Confirmed: { value: 1 },
    },
    SezamAccountStatus: {
        Unregistered: { value: 0 },
        Registered:  { value: 1 }
    },
}