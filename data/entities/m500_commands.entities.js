module.exports = {
    Command: {
        name: 'Command',
        collection: 'commands',
        fields: [
            { name: 'modem_id', type: Number },
            { name: 'device_id', type: Number },
            { name: 'server_alias', type: String },
            { name: 'old_value', type: String, allowNull: true },
            { name: 'new_value', type: String },
            { name: 'guid', type: String },
            { name: 'user_id', type: Number },
            { name: 'dt', type: Date },
            { name: 'server_id', type: Number },
        ],
        authorize: null,
        displayForm: ['server_alias'],
        withoutAdmin: true,
    },
    CommandHistory: {
        name: 'CommandHistory',
        collection: 'command_history',
        fields: [
            { name: 'modem_id', type: Number, reference: 'Modem' },
            { name: 'device_id', type: Number, reference: 'Device' },
            { name: 'server_alias', type: String },
            { name: 'old_value', type: String, allowNull: true, },
            { name: 'new_value', type: String },
            { name: 'user_id', type: Number, reference: 'Account' },
            { name: 'dt', type: Date },
            { name: 'dt_response', type: Date },
            { name: 'server_id', type: Number, reference: 'Server' },
            { name: 'status', type: Number },
            { name: 'error', type: String },
            { name: 'guid', type: String },
        ],
        authorize: null,
        displayForm: ['server_alias'],
        withoutAdmin: true,
    },
};
