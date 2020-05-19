const fs = require('fs');

const config = JSON.parse(fs.readFileSync(process.env.ConfigPath));

// const config = {
//     init: (path) => {
//         const data = JSON.parse(fs.readFileSync(path));
//         for (const key in data) {
//             config[key] = data[key];
//         }
//     },
//     ID: 'id',
// };

module.exports = config;
