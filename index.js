/*
* Application Start
* */

const express = require('express');
const app = express();
const winston = require('winston');
const goalJob = require('./jobs/goal_job');
require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/db')();
require('./startup/config')();
require('./startup/validation')();
require('./startup/prod')(app);

console.log('ENV', process.env.NODE_ENV);

const port = process.env.PORT;
const server = app.listen(port, () => {
    let message = `App listening on port ${server.address().port}...`;
    console.info(message);
    winston.info(message);
    if(process.env.NODE_ENV !== 'test') goalJob();
});


module.exports = server;