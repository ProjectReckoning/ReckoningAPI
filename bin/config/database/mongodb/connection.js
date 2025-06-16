const Mongo = require('mongodb').MongoClient;
const config = require('../../index');
const validate = require('validate.js');
const wrapper = require('../../../helpers/utils/wrapper');

const connectionPool = [];
const connection = () => {
    return {index: null, config: '', db: null };
};

const createConnection = async (config) => {
    const options = { poolSize: 50,
        keepAlive: 15000,
        socketTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        useNewUrlParser: true,
        useUnifiedTopology: true
    };
    try {
        const connection = await Mongo.connect(config, options);
        return wrapper.data(connection);
    } catch (err) {
        return wrapper.error(err.message);
    }
};

const addConnectionPool = () => {
    const connectionMongo = connection();
    connectionMongo.index = 0;
    connectionMongo.config = config.get('/mongoDbUrl');
    connectionPool.push(connectionMongo);
};

const createConnectionPool = async () => {
    connectionPool.forEach(async (currentConnection, index) => {
        const result = await createConnection(currentConnection.config);
        if (result.err) {
            connectionPool[index].db = currentConnection;
        } else {
            connectionPool[index].db = result.data;
        }
    });
};

const init = () => {
    addConnectionPool();
    createConnectionPool();
};

const ifExistConnection = async (config) => {
    let state = {};
    connectionPool.some((currentConnection) => {
        if (currentConnection.config === config) {
            state = currentConnection;
            return true;
        }
    });
    if (validate.isEmpty(state)) {
        return wrapper.error('Connection Not Exist, Connection Must be Created Before');
    }
    return wrapper.data(state);

};

const isConnected = async (state) => {
    const connection = state.db;
    if (validate.isEmpty(connection)) {
        return wrapper.error('Connection Not Found, Connection Must be Created Before');
    }
    return wrapper.data(state);
};

const getConnection = async (config) => {
    let connectionIndex;
    const checkConnection = async () => {
        const res = await ifExistConnection(config);
        if (res.err) {
            return res;
        }
        const connection = await isConnected(res.data);
        console.log(connection);
        connectionIndex = res.data.index;
        return connection;

    };
    const result = await checkConnection();
    if (result.err) {
        const state = await createConnection(config);
        if (state.err) {
            return wrapper.data(connectionPool[connectionIndex]);
        }
        connectionPool[connectionIndex].db = state.data;
        return wrapper.data(connectionPool[connectionIndex]);

    }
    return result;

};

module.exports = {
    init,
    getConnection
};
