let enums = {
    SimulatorType: {
        SIN: 1,
        COS: 2,
        STAIRS: 3,
        CONSTANT: 4,
        RANDOM: 5,
        SAW: 6
    },
    DevicePollingType: {
        SIMULATOR: 0,
        OPC_UA: 1,
        MODBUS_TCP: 10,
        MODBUS_RTU: 100,
        CANBUS: 107
    },
    Role: {
        NONE: 0,
        ADMIN: 128,
        PUBLIC: 1,
        USER: 4,
    },
    Rights: {
        None: 0,
        Only_Read: 1,
        Only_Write: 2,
        Owner: 64,
        Admin: 128,
    },
    AuthRight: {
        byAccount: 1,
        byRole: 2,
        adminOnly: 3,
        entityRole: 4,
        relation: 5
    },
    AccountStatus: {
        Unconfirmed: 0,
        Confirmed: 1
    },
    SezamAccountStatus: {
        Unregistered: 0,
        Registered: 1
    },

    SiteType: {
        NORM: 0,
        LOCATION: 1,
        Schema: 2,
        Manufactory: 3,
    },
    UnitType: {
        Automatic: 1,
        Machine: 101
    },
    UnitDevBindType: {
        main: 0,
        sub: 1
    },
    CycleType: {
        OneOff: 0,
        Dayly: 1,
        Weekly: 7,
        Monthly: 30,
        Quarterly: 120,
        HalfYearly: 182,
        Annually: 365,
    },
    IncomeType: {
        Salary: 1,
        SalaryPrepaid: 2,
        FromGodFather: 99
    },
    Objects: {
        Purchase: 1,
    },
    PurchaseStatus: {
        New: 1,
        Done: 2
    },
    PurchaseType: {
        Main: 1,
        Need: 2
    },
    Priority: {
        Lo: 0,
        Middle: 1,
        Hi: 2
    }
}


module.exports = enums;