module.exports = {
    Live: {
        name: 'Live',
        collection: 'live',
        fields: [
            { name: 'device_id', type: Number, reference: 'Device' },
            { name: 'modem_id', type: Number, reference: 'Modem' },
            { name: 'alias', type: String },
            { name: 'value', type: 'Float', allowNull: true },
            { name: 'value_bool', type: Boolean, allowNull: true },
            { name: 'value_string', type: String, allowNull: true },
            { name: 'dt', type: Date },
            { name: 'alarm', type: String, allowNull: true }
        ],
        authorize: null,
        displayForm: ["Device"],
        withoutAdmin: false
    },
    History: {
        name: 'History',
        collection: 'history',
        fields: [
            { name: 'device_id', type: Number, reference: 'Device' },
            { name: 'modem_id', type: Number, reference: 'Modem' },
            { name: 'alias', type: String },
            { name: 'value', type: 'Float', allowNull: true },
            { name: 'prev_value', type: 'Float', allowNull: true },
            { name: 'dt', type: Date }
        ],
        authorize: null,
        displayForm: ["Device"],
        withoutAdmin: true
    },
    History_Bool: {
        name: 'History_Bool',
        collection: 'history_bool',
        fields: [
            { name: 'device_id', type: Number, reference: 'Device' },
            { name: 'alias', type: String },
            { name: 'value', type: Boolean, allowNull: true },
            { name: 'prev_value', type: Boolean, allowNull: true },
            { name: 'dt', type: Date }
        ],
        authorize: null,
        displayForm: ["Device"],
        withoutAdmin: true
    },
    History_String: {
        name: 'History_String',
        collection: 'history_string',
        fields: [
            { name: 'device_id', type: Number, reference: 'Device' },
            { name: 'alias', type: String },
            { name: 'value', type: String, allowNull: true },
            { name: 'prev_value', type: String, allowNull: true },
            { name: 'dt', type: Date }
        ],
        authorize: null,
        displayForm: ["device"],
        withoutAdmin: true
    },
    AlarmHistory: {
        name: 'AlarmHistory',
        collection: 'alarm_history',
        fields: [
            { name: 'device_id', type: Number, reference: 'Device' },
            { name: 'modem_id', type: Number, reference: 'Device' },
            { name: 'alias', type: String },
            { name: 'value_start', type: String, allowNull: true },
            { name: 'value_finish', type: String, allowNull: true },
            { name: 'description', type: String, allowNull: true },
            { name: 'prev_value', type: String, allowNull: true },
            { name: 'dt_start', type: Date },
            { name: 'dt_finish', type: Date },
            { name: 'dt_confirm', type: Date },
            { name: 'confirmed', type: Boolean, }
        ],
        authorize: null,
        displayForm: ["device"],
        withoutAdmin: true
    },

}