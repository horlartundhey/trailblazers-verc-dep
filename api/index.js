const index = require('../server/index');
const serverless = require('serverless-http');

module.exports = serverless(index);
