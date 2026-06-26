
const crypto = require('crypto');

const bootId = crypto.randomBytes(16).toString('hex');

console.log(`[serverBoot] bootId = ${bootId}`);

module.exports = {
    bootId
};
