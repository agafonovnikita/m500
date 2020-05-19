const repository = require('../data/db/repository');
const entities = require('../data/entities');

let erase = {
    // entity: function () {
    //     return new Promise((resolve, reject) => {
    //         let eName = process.argv[3];
    //         if(!eName) throw new Error("Entity Name is not defined");

    //         let list = await repository.getList(eName);

    //         let entity = entities[eName];



    //     });
    // }
}


let action = process.argv[2];

erase[action]()
    .then((data) => {
        console.log(consolecolor.green('successfull'));
        console.log(data);
        process.exit(1)
    })
    .catch(err => {
        console.error(err);
        process.exit(1)

    });