const winston = require('winston');

/*
*   Retrieves a single instance of a server
* */

let server;

module.exports = function (app) {

    async function createInstance() {
        const port = process.env.PORT || 8000;
        server = await app.listen(port, () => {
            let message = `App listening on port ${port}...`;
            console.info(message);
            winston.info(message);
        });

        return server;
    }

    return {
        getInstance: async function () {
            if (!server) {
                server = await createInstance();
            }

            return server;
        }
    };
};
