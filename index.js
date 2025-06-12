const config = require('./bin/config');

const AppServer = require('./bin/app/server');

const appServer = new AppServer();
const port = process.env.PORT || config.get('/port') || 8080;

appServer.server.listen(port, () => {

    console.log(`Your server is listening on port ${port} (http://localhost:${port})`);
});