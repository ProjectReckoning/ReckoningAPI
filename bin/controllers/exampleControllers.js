const wrapper = require('../helpers/utils/wrapper');
const productModules = require('../modules/exampleModules');
const logger = require("../helpers/utils/logger");

module.exports.createProduct = (req, res) => {
  const productData = {
    name: req.body.name,
    avail_size: req.body.avail_size,
    price: parseFloat(req.body.price),
    stock: parseInt(req.body.stock, 10),
    description: req.body.description,
    image_url: req.body.image_url,
    category: req.body.category
  }
  productModules.createProduct(productData)
    .then(resp => {
      logger.info('Product has been created');
      wrapper.response(res, 'success', wrapper.data(resp), 'Product has been created', 201);
    })
    .catch(err => {
      logger.error('Error while creating product', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while creating product. Error: ${err}`, 400);
    });
}

module.exports.getAllProduct = (req, res) => {
  productModules.allProduct()
    .then(resp => {
      const productMap = new Map();
      resp.forEach(item => {
        if (!productMap.has(item.name)) {
          productMap.set(item.name, {
            product_id: item.product_id,
            name: item.name,
            price: item.price,
            stock: item.stock > 0,
            description: item.description,
            image_url: item.image_url,
            category: item.category
          });
        }
      });
      const result = Array.from(productMap.values());
      logger.info('All Product has been fetched');
      wrapper.response(res, 'success', wrapper.data(result), 'All Product has been fetched', 200);
    })
    .catch(err => {
      logger.error('Error while fetching product', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while fetching product. Error: ${err}`, 400);
    });
}

module.exports.getDetailProduct = (req, res) => {
  const { name } = req.params;
  productModules.detailProduct({ name })
    .then(resp => {
      const result = {
        name: resp[0].name,
        avail_size: resp
          .filter(item => item.stock > 0) // Only include items with stock > 0
          .map(item => ({
            product_id: item.product_id,
            size: item.avail_size,
            price: item.price
          })),
        description: resp[0].description,
        image_url: resp[0].image_url,
        category: resp[0].category,
      };
      logger.info('Detail Product has been fetched');
      wrapper.response(res, 'success', wrapper.data(result), 'Detail Product has been fetched', 200);
    })
    .catch(err => {
      logger.error('Error while fetching product', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while fetching product. Error: ${err}`, 400);
    });
}

module.exports.updateProduct = (req, res) => {
  const { name } = req.params;
  const updatedData = {
    name: req.body.name,
    avail_size: req.body.avail_size,
    price: req.body.price,
    stock: req.body.stock,
    description: req.body.description,
    image_url: req.body.image_url,
    category: req.body.category
  }

  productModules.updateProduct(name, updatedData)
    .then(resp => {
      logger.info('Product has been updated');
      wrapper.response(res, 'success', wrapper.data(resp), 'Product has been updated', 200);
    })
    .catch(err => {
      logger.error('Error while updating product', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while updating product. Error: ${err}`, 400);
    });
}

module.exports.deleteProduct = (req, res) => {
  const { id } = req.params;

  productModules.deleteProduct(id)
    .then(resp => {
      logger.info('Product has been deleted');
      wrapper.response(res, 'success', wrapper.data(resp), 'Product has been deleted', 200);
    })
    .catch(err => {
      logger.error('Error while deleting product', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while deleting product. Error: ${err}`, 400);
    });
}
