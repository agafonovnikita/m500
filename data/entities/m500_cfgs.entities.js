module.exports = {
    Server: {
        name: 'Server',
        collection: 'servers',
        fields: [
            { name: 'name', type: String },
            { name: 'guid', type: String },
        ],
        authorize: null,
        displayForm: ['name'],
    },
    ServerTemplate: {
        name: 'ServerTemplate',
        collection: 'server_templates',
        fields: [{ name: 'name', type: String }],
        authorize: null,
        displayForm: ['name'],
    },
    ServerTemplateParameter: {
        name: 'ServerTemplateParameter',
        collection: 'server_config_parameters',
        fields: [
            { name: 'server_template_id', type: Number, reference: 'ServerTemplate' },
            { name: 'name', type: String },
            { name: 'value', type: String },
        ],
        authorize: null,
        displayForm: ['name', 'ServerTemplate'],
    },
    ServerTemplateParameterBind: {
        name: 'ServerTemplateParameterBind',
        collection: 'server_template_binds',
        fields: [
            { name: 'server_template_id', type: Number, reference: 'ServerTemplate' },
            { name: 'server_id', type: Number, reference: 'Server' },
        ],
        authorize: null,
        displayForm: ['Server', 'ServerTemplate'],
    },

    Modem: {
        name: 'Modem',
        collection: 'modems',
        fields: [
            { name: 'name', type: String },
            { name: 'guid', type: String },
            // TODO { name: 'template_id', type: Number, }
            { name: 'server_alias_template_id', type: Number, reference: 'ServerAliasTemplate', allowNull: true, defaultValue: null },

        ],
        authorize: null,
        displayForm: ['name'],
        filters: ['name'],
    },
    ModemTemplate: {
        name: 'ModemTemplate',
        collection: 'modem_templates',
        fields: [{ name: 'name', type: String }],
        authorize: null,
        displayForm: ['name'],
    },
    ModemTemplateParameter: {
        name: 'ModemTemplateParameter',
        collection: 'modem_template_parameters',
        fields: [
            { name: 'modem_template_id', type: Number, reference: 'ModemTemplate' },
            { name: 'name', type: String },
            { name: 'value', type: String },
        ],
        authorize: null,
        displayForm: ['name', 'ModemTemplate'],
        filters: ['ModemTemplate'],
    },
    ModemTemplateBind: {
        name: 'ModemTemplateBind',
        collection: 'modem_template_binds',
        fields: [
            { name: 'modem_template_id', type: Number, reference: 'ModemTemplate' },
            { name: 'modem_id', type: Number, reference: 'Modem' },
        ],
        authorize: null,
        displayForm: ['Server', 'ModemTemplate'],
    },
    DeviceTemplate: {
        name: 'DeviceTemplate',
        collection: 'device_templates',
        fields: [{ name: 'name', type: String }],
        authorize: null,
        displayForm: ['name'],
    },
    DeviceTemplateParameter: {
        name: 'DeviceTemplateParameter',
        collection: 'device_template_parameters',
        fields: [
            { name: 'device_template_id', type: Number, reference: 'DeviceTemplate' },
            { name: 'address', type: String },
        ],
        authorize: null,
        displayForm: ['name', 'DeviceTemplate'],
        filters: ['DeviceTemplate'],
    },
    DeviceTemplateBind: {
        name: 'DeviceTemplateBind',
        collection: 'device_template_binds',
        fields: [
            { name: 'device_template_id', type: Number, reference: 'DeviceTemplate' },
            { name: 'device_id', type: Number, reference: 'Device' },
        ],
        authorize: null,
        displayForm: ['Device', 'DeviceTemplate'],
    },

    // DeviceConnectionBind: {
    //     name: "DeviceConnectionBind",
    //     collection: 'device_connection_binds',
    //     fields: [
    //         { name: 'device_id', type: Number, reference: 'Device' },
    //         { name: 'server_id', type: Number, reference: 'Server' },
    //         { name: 'modem_id', type: Number, reference: 'Modem' },
    //         { name: 'alias_kit_id', type: Number, reference: 'AliasKit' },
    //     ],
    //     authorize: null,
    //     displayForm: ["Device"],
    // },

    ServerDataType: {
        name: 'ServerDataType',
        collection: 'server_data_types',
        fields: [{ name: 'data_type', type: String }],
        authorize: null,
        displayForm: ['data_type'],
    },

    ServerAliasTemplate: {
        name: 'ServerAliasTemplate',
        collection: 'server_alias_templates',
        fields: [{ name: 'name', type: String }],
        authorize: null,
        displayForm: ['name'],
    },

    ServerAliasTemplateParameter: {
        name: 'ServerAliasTemplateParameter',
        collection: 'server_alias_template_parameters',
        fields: [
            { name: 'server_alias_template_id', type: Number, reference: 'ServerAliasTemplate' },
            { name: 'device_alias', type: String },
            { name: 'alias', type: String },
            { name: 'server_data_type_id', type: Number, reference: 'ServerDataType' },
            { name: 'first_bit', type: Number },
            { name: 'last_bit', type: Number },
            { name: 'value_interpretation', type: String },
            { name: 'coef_k', type: 'float' },
            { name: 'coef_b', type: 'float' },
            { name: 'qos', type: Number },
            { name: 'mask', type: Number },
            { name: 'deadband_value', type: Number },
            { name: 'deadband_percent', type: Number },
            { name: 'deadband_time_sec', type: Number },
            { name: 'eu', type: String },
            { name: 'is_set', type: Boolean },
        ],
        authorize: null,
        displayForm: ['alias'],
    },

    DeviceAliasTemplate: {
        name: 'DeviceAliasTemplate',
        collection: 'device_alias_templates',
        fields: [{ name: 'name', type: String }],
        authorize: null,
        displayForm: ['name'],
    },

    DeviceAliasTemplateParameter: {
        name: 'DeviceAliasTemplateParameter',
        collection: 'device_alias_template_parameters',
        fields: [
            { name: 'device_alias_template_id', type: Number, reference: 'DeviceAliasTemplate', displayname: 'Шаблон' },
            { name: 'alias', type: String },
            { name: 'address', type: String },
            { name: 'read_func', type: Number },
            { name: 'write_func', type: Number },
            { name: 'data_type', type: String },
            { name: 'publish', type: Boolean },
            { name: 'subscribe', type: Boolean },
            { name: 'koef_k', type: 'float' },
            { name: 'koef_b', type: 'float' },
            { name: 'qos', type: Number },
            { name: 'mask', type: Number },
            { name: 'deadband_value', type: 'float' },
            { name: 'deadband_percent', type: 'float' },
            { name: 'deadband_time_sec', type: Number },
        ],
        authorize: null,
        displayForm: ['alias'],
    },

    ServerModemDevice: {
        name: 'ServerModemDevice',
        collection: 'server_modem_device_binds',
        fields: [
            { name: 'device_id', type: Number, reference: 'Device' },
            { name: 'server_id', type: Number, reference: 'Server' },
            { name: 'modem_id', type: Number, reference: 'Modem' },
        ],
        authorize: null,
        filters: ['Device', 'Server'],
        displayForm: ['alias'],
    },
};
