/*
* Application Start
* */

const express = require('express');
const app = express();
const winston = require('winston');
require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/db')();
require('./startup/config')();
require('./startup/validation')();
require('./startup/prod')(app);


const port = process.env.PORT;
const server = app.listen(port, () => {
    let message = `App listening on port ${server.address().port}...`;
    console.info(message);
    winston.info(message);
});


module.exports = server;


