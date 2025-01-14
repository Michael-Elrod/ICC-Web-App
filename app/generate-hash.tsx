const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = 'test123';
    const hash = await bcrypt.hash(password, 12);
    console.log(hash)
}

generateHash();