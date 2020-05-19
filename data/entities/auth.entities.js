module.exports = {
    Account: {
        name: 'Account',
        collection: 'accounts',
        fields: [
            { name: 'email', type: String },
            { name: 'password', type: String },
            { name: 'status', type: Number, listbox: 'AccountStatus' },
            { name: 'guid', type: String },
            { name: 'confirmGuid', type: String },
            { name: 'name', type: String },
            { name: 'surname', type: String },
            { name: 'phone', type: String },
            { name: 'role', type: Number },
        ],
        displayForm: ['email'],
    },
    Session: {
        name: 'Session',
        collection: 'sessions',
        fields: [
            { name: 'email', type: String },
            { name: 'userid', type: String },
            { name: 'expire', type: Date },
            { name: 'userguid', type: String },
            { name: 'role', type: Number },
        ],
        displayForm: ['email'],
    },
    Vocabulary: {
        name: 'Vocabulary',
        collection: 'vocabulary',
        fields: [
            { name: 'word', type: String, displayname: '#common.constant', size: 20 },
            { name: 'lang', type: String, displayname: '#common.lang' },
            { name: 'translation', type: String, displayname: '#common.translation', size: 30 },
        ],
        displayForm: ['word'],
        filters: ['word', 'lang'],
    },
    User: {
        name: 'User',
        collection: 'users',
        fields: [
            { name: 'email', type: String },
            { name: 'name', type: String },
            { name: 'surname', type: String },
            { name: 'patronymic', type: String },
            { name: 'phone', type: String },
            { name: 'account_id', type: Number, reference: 'Account' },
            { name: 'language', type: String },
            { name: 'is_admin', type: Boolean },
            { name: 'site_id', type: Number, reference: 'Site' }
        ],
        displayForm: ['name', 'surname'],
    },
    UserRight: {
        name: 'UserRight',
        collection: 'user_rights',
        fields: [
            { name: 'object_type', type: String },
            { name: 'right', type: String },
            { name: 'user_id', type: Number, reference: 'User' },
            { name: 'object_id', type: Number },
        ],
        displayForm: ['User'],
    },
    EventLog: {
        name: 'EventLog',
        collection: 'event_log',
        fields: [
            { name: 'action', type: String },
            { name: 'dt', type: Date },
            { name: 'object_id', type: Number, allowNull: true, defaultValue: null },
            { name: 'object_type', type: String, allowNull: true, defaultValue: null },
            { name: 'site_id', type: Number, reference: 'Site', allowNull: true, defaultValue: null },
            { name: 'user_id', type: Number, reference: 'User' },
            { name: 'value', type: String, allowNull: true, defaultValue: null },
            { name: 'guid', type: String, allowNull: true, defaultValue: null },
            { name: 'status', type: String, allowNull: true, defaultValue: null },
            { name: 'payload', type: String }
        ],
        displayForm: ['name', 'surname'],
    }
};
