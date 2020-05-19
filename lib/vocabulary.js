const repository = require('../agcore/data/db/repository');

const refreshTimeout = 5 * 60 * 1000;
const Vocabulary = new Map();

const init = () => {

    repository.getList('Vocabulary')
        .then(
            data => {
                for (const word of data) {
                    let langKit = Vocabulary.get(word.lang);
                    if (!langKit) {
                        langKit = new Map();
                        Vocabulary.set(word.lang, langKit);
                    }

                    langKit.set(word.word, word.translation);
                }
            }
        )
        .catch(err => console.error(err));
}


const get = (word, lang = 'ru') => {
    let langKit = Vocabulary.get(lang);

    if (!langKit) return null;

    return langKit.get(word) || null;
}

const smartGet = (word, lang) => {
    return get(word, lang) || word;
}


setInterval(() => init(), refreshTimeout);

init();

module.exports = { get, smartGet };