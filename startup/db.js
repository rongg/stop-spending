const mongoose = require('mongoose');
const winston = require('winston');
const config = require('config');
mongoose.set('useCreateIndex', true);
module.exports = function(){
    const db = config.get('db');
    console.info('DB', db);
    mongoose.connect(db, {useNewUrlParser: true})
        .then(() => {
            let message = `Connected to ${db}`;
            // console.info(message);
            winston.info(message)
        });
};