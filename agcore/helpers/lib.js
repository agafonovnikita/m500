let lib = {
    /**
     * Обработка проммисов по массиву
     * @param {object} emailObject
     */
    promiseArray : function (Arr, fn) {
        let array = Arr.slice();
        return new Promise((resolve) => {
            let i = 0;
            let result = [];

            function f() {
                if (i >= array.length) return resolve(result);
                fn(array[i]).then(
                    data => {
                        result.push(data);
                        i++;
                        f();
                    },
                    err => {
                        result.push({ error: err });
                        i++;
                        f();
                    })
            }

            f();
        });
    }
}

module.exports = lib;