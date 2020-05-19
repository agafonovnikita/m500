const exp = {
    LocationTableDetailType: {
        field: { value: 0, displayname: 'Поле' },
        alias: { value: 1, displayname: 'Параметр' },
    },
    LocationViewType: {
        none: { value: 0, displayname: 'нет' },
        liveMap: { value: 1, displayname: 'Карта' },
        imageBack: { value: 3, displayname: 'Картинка' }
    },
    Role: {
        NONE: 0,
        ADMIN: 128,
        PUBLIC: 1,
        USER: 4,
        TEHNO: 8,
        ORGADMIN: 16
    },
}

module.exports = exp;