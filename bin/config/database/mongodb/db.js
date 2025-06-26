const validate = require('validate.js');
const mongoConnection = require('./connection');
const wrapper = require('../../../helpers/utils/wrapper');
const { MongoClient } = require('mongodb');
const logger = require('../../../helpers/utils/logger');

class DB {

  constructor(config) {
    this.config = config;
    this.client = new MongoClient(this.config);
  }

  setCollection(collectionName) {
    this.collectionName = collectionName;
  }

  async getDatabase() {
    const config = this.config.replace('//', '');
    /* eslint no-useless-escape: "error" */
    const pattern = new RegExp('/([a-zA-Z0-9-]+)?');
    const dbName = pattern.exec(config);
    return dbName[1];
  }

  async findOne(parameter) {
    const ctx = 'mongodb-findOne';
    const dbName = await this.getDatabase();
    // const result = await mongoConnection.getConnection(this.config);
    logger.info('mau connect');
    await this.client.connect();
    try {
      // console.log("halo", result.data.db);
      // const cacheConnection = result.data.db;
      const connection = this.client.db(dbName);
      const db = connection.collection(this.collectionName);
      const recordset = await db.findOne(parameter);
      logger.info('masuk db kok')
      if (validate.isEmpty(recordset)) {
        return wrapper.error('Data Not Found Please Try Another Input');
      }
      return wrapper.data(recordset);

    } catch (err) {
      console.log(err.message, 'Error find data in mongodb')
      return wrapper.error(`Error Find One Mongo ${err.message}`);
    }

  }

  async findMany(parameter) {
    const ctx = 'mongodb-findMany';
    const dbName = await this.getDatabase();
    // const result = await mongoConnection.getConnection(this.config);
    await this.client.connect();
    try {
      // const cacheConnection = result.data.db;
      const connection = this.client.db(dbName);
      const db = connection.collection(this.collectionName);
      const recordset = await db.find(parameter).toArray();
      if (validate.isEmpty(recordset)) {
        return wrapper.error('Data Not Found , Please Try Another Input');
      }
      return wrapper.data(recordset);

    } catch (err) {
      console.log(err.message, 'Error find data in mongodb')
      return wrapper.error(`Error Find Many Mongo ${err.message}`);
    }

  }

  async insertOne(document) {
    const ctx = 'mongodb-insertOne';
    const dbName = await this.getDatabase();
    // const result = await mongoConnection.getConnection(this.config);
    await this.client.connect();
    try {
      // const cacheConnection = result.data.db;
      const connection = this.client.db(dbName);
      const db = connection.collection(this.collectionName);
      const recordset = await db.insertOne(document);
      if (recordset.acknowledged !== true) {
        return wrapper.error('Failed Inserting Data to Database');
      }
      return wrapper.data(document);

    } catch (err) {
      console.log(err.message, 'Error insert data in mongodb')
      return wrapper.error(`Error Insert One Mongo ${err.message}`);
    }

  }

  async insertMany(data) {
    const ctx = 'mongodb-insertMany';
    const document = data;
    const dbName = await this.getDatabase();
    // const result = await mongoConnection.getConnection(this.config);
    await this.client.connect();
    try {
      // const cacheConnection = result.data.db;
      const connection = this.client.db(dbName);
      const db = connection.collection(this.collectionName);
      const recordset = await db.insertMany(document);
      if (recordset.acknowledged !== true) {
        return wrapper.error('Failed Inserting Data to Database');
      }
      return wrapper.data(document);

    } catch (err) {
      console.log(err.message, 'Error insert data in mongodb')
      return wrapper.error(`Error Insert Many Mongo ${err.message}`);
    }

  }

  // nModified : 0 => data created
  // nModified : 1 => data updated
  async upsertOne(parameter, updateQuery) {
    const ctx = 'mongodb-upsertOne';
    const dbName = await this.getDatabase();
    // const result = await mongoConnection.getConnection(this.config);
    await this.client.connect();
    try {
      // const cacheConnection = result.data.db;
      const connection = this.client.db(dbName);
      const db = connection.collection(this.collectionName);
      const data = await db.updateOne(parameter, updateQuery, { upsert: true });
      if (data.modifiedCount >= 0) {
        const { modifiedCount } = data;
        const recordset = await this.findOne(parameter);
        if (modifiedCount === 0) {
          return wrapper.data(recordset.data);
        }
        return wrapper.data(recordset.data);

      }
      return wrapper.error('Failed upsert data');
    } catch (err) {
      console.log(err.message, 'Error upsert data in mongodb')
      return wrapper.error(`Error Upsert Mongo ${err.message}`);
    }

  }

  async findAllData(fieldName, row, page, param) {
    const ctx = 'mongodb-findAllData';
    const dbName = await this.getDatabase();
    // const result = await mongoConnection.getConnection(this.config);
    await this.client.connect();
    try {
      // const cacheConnection = result.data.db;
      const connection = this.client.db(dbName);
      const db = connection.collection(this.collectionName);
      const parameterSort = {};
      parameterSort[fieldName] = 1;
      const parameterPage = row * (page - 1);
      // const recordset = await db.find(param)
      const recordset = await db.find(param).sort(parameterSort).limit(row).skip(parameterPage)
        .toArray();
      if (validate.isEmpty(recordset)) {
        return wrapper.error('Data Not Found, Please Try Another Input');
      }
      return wrapper.data(recordset);

    } catch (err) {
      console.log(err.message, 'Error upsert data in mongodb')
      return wrapper.error(`Error Mongo ${err.message}`);
    }


  }

  async countData(param) {
    const ctx = 'mongodb-countData';
    const dbName = await this.getDatabase();
    // const result = await mongoConnection.getConnection(this.config);
    await this.client.connect();
    try {
      // const cacheConnection = result.data.db;
      const connection = this.client.db(dbName);
      const db = connection.collection(this.collectionName);
      const recordset = await db.countDocuments(param);
      if (validate.isEmpty(recordset)) {
        return wrapper.error('Data Not Found , Please Try Another Input');
      }
      return wrapper.data(recordset);

    } catch (err) {
      console.log(err.message, 'Error count data in mongodb')
      return wrapper.error(`Error Mongo ${err.message}`);
    }


  }
}

module.exports = DB;