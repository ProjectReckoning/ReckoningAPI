const config = require('./bin/config');

const AppServer = require('./bin/app/server');
const logger = require('./bin/helpers/utils/logger');

const appServer = new AppServer();
const port = process.env.PORT || config.get('/port') || 8080;

appServer.server.listen(port, () => {

    logger.info(`Your server is listening on port ${port} (http://localhost:${port})`);
});