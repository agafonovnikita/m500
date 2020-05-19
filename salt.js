const bcrypt = require('bcryptjs');

const salt = bcrypt.genSaltSync(10);

process.stdout.write(salt);