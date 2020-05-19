

module.exports = {
    /** список всех id */
    getIdsFromRW: function (obj) {
        if (this.checkRW(obj))
            return new Set([...obj.read, ...obj.write]);
        console.error('объект кеширования не инициализирован');
        return false;
    },
    checkRW: function (obj) {
        if (!obj) return false;
        if (!obj.readInit || !obj.writeInit) return false;
        return true;
    }
}
