const Agenda = require('agenda');
const config = require('config');

const dbConn = config.get('db');
const dbName = dbConn.substring(dbConn.lastIndexOf('/') + 1);

const MongoClient = require('mongodb').MongoClient;

// const client = new MongoClient(dbConn, {useUnifiedTopology: true, useNewUrlParser: true});

const agenda = new Agenda({db: {address: dbConn}});

agenda.define('update goal statuses', async job => {
    console.log('update goals');
    MongoClient.connect(dbConn, {useNewUrlParser: true}, async (err, client) => {
        if (err) {
            return console.error(err);
        }
        const db = client.db(dbName);
        const goals = db.collection('goals');
        let now = new Date();

        const update = await goals.updateMany(
            {end: {$lte: now}, active: true},
            {$set: {active: false}}
        );

        console.log("found: ", update.matchedCount);
        console.log("modified: ", update.modifiedCount);

        client.close();
    });

});


module.exports = (async function () {
    console.log('goal job db: ', dbConn, 'name: ', dbName);
    await agenda.start();
    await agenda.every('1 hour', 'update goal statuses');
});
