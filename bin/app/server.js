const cors = require('cors');
const wrapper = require('../helpers/utils/wrapper');
const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');
const indexRoutes = require('../routers');
const morganStream = require("../helpers/utils/morganStream");
const morgan = require("morgan");
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load(path.resolve(__dirname, '../docs/swagger.yaml'));

class AppServer {
  constructor() {
    this.server = express();

    this.server.use(bodyParser.json());
    this.server.use(bodyParser.urlencoded({ extended: true }));

    this.server.use(cors());
    // this.server.use(helmet()); //enable when in prod

    this.server.use(morgan(':method: :url :status :response-time ms - :res[content-length]', { stream: morganStream }));

    this.server.get('/', (req, res) => {
      wrapper.response(res, 'success', wrapper.data('Takua API'), 'This services is running properly.');
    });
    
    // Documentation
    this.server.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    //Routing
    this.server.use('/api/v1', indexRoutes);

    // exception handling
    this.server.use((error, req, res, next) => {
      res.status(error.status || 500).json({
        error: {
          message: error.message
        }
      });
    });
  }
}

module.exports = AppServer;